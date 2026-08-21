import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes, createHash } from 'crypto';
import { OrganisationRole } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { TokenBlocklistService } from './token-blocklist.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  type JwtPayload,
  type AuthenticatedUser,
  SAFE_USER_SELECT,
} from './auth.types';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

/** bcrypt cost factor — 12 rounds is the recommended production minimum. */
const BCRYPT_ROUNDS = 12;

import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenBlocklistService: TokenBlocklistService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    // 1. Reject duplicate email early (before touching the DB transactionally)
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'An account with this email address already exists',
      );
    }

    // 2. Hash password — never store plaintext
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // 2.5 Generate email verification token (SHA-256 hash for DB, raw token for email)
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 3. Atomically create: User → Organisation → OrganisationMember (BOARD_ADMIN)
    //    Using $transaction to guarantee consistency.
    let result: { userId: string; orgId: string; orgName: string };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            name: dto.name.trim(),
            passwordHash,
            isEmailVerified: false,
            verificationTokenHash,
            verificationExpires,
          },
          select: { id: true },
        });

        const org = await tx.organisation.create({
          data: { 
            name: dto.organisationName.trim(),
            settings: {
              physicalAddress: dto.physicalAddress,
              country: dto.country,
            }
          },
          select: { id: true, name: true },
        });

        await tx.organisationMember.create({
          data: {
            userId: user.id,
            organisationId: org.id,
            role: OrganisationRole.BOARD_ADMIN,
          },
        });

        return { userId: user.id, orgId: org.id, orgName: org.name };
      });
    } catch {
      throw new InternalServerErrorException(
        'Registration failed — please try again',
      );
    }

    // 4. Fetch the fully populated safe user representation for the response
    const safeUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      select: {
        ...SAFE_USER_SELECT,
        memberships: {
          select: {
            organisationId: true,
            role: true,
            organisation: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 4. Send verification email
    await this.mailService.sendVerificationEmail(safeUser.email, verificationToken);

    await this.auditService.logSystemEvent(
      'USER_REGISTERED',
      'User successfully registered an account',
      { userId: safeUser.id },
    );

    return {
      message: 'Account created successfully. Please verify your email.',
      user: safeUser,
    };
  }

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    // Fetch user including passwordHash for comparison
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Use a timing-safe comparison path — return the same error for missing
    // user and wrong password to prevent email enumeration.
    if (!user || !user.passwordHash) {
      // Run a dummy bcrypt to maintain constant-time behaviour
      await bcrypt.compare(
        dto.password,
        '$2b$12$invalidhashpadding000000000000000',
      );
      
      if (user) {
        await this.auditService.logSystemEvent(
          'LOGIN_FAILED',
          'Failed login attempt (wrong password)',
          { userId: user.id },
        );
      }
      
      throw new UnauthorizedException('Invalid email or password or account unverified.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.auditService.logSystemEvent(
        'LOGIN_FAILED',
        'Failed login attempt (wrong password)',
        { userId: user.id },
      );
      throw new UnauthorizedException('Invalid email or password or account unverified.');
    }

    // Unverified account
    if (!user.isEmailVerified) {
      await this.auditService.logSystemEvent(
        'LOGIN_FAILED',
        'Failed login attempt (account unverified)',
        { userId: user.id },
      );
      throw new UnauthorizedException('Invalid email or password or account unverified.');
    }

    // Fetch the fully populated safe user with memberships
    const safeUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        ...SAFE_USER_SELECT,
        memberships: {
          select: {
            organisationId: true,
            role: true,
            organisation: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (safeUser) {
      await this.auditService.logSystemEvent(
        'LOGIN_SUCCESS',
        'User successfully logged in',
        { userId: safeUser.id },
      );
    }

    return {
      accessToken: this.issueToken(user.id, user.email),
      user: safeUser,
    };
  }

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  async logout(jti?: string, exp?: number, userId?: string) {
    if (jti && exp) {
      this.tokenBlocklistService.revokeToken(jti, exp);
    }
    
    if (userId) {
      await this.auditService.logSystemEvent(
        'LOGOUT',
        'User logged out',
        { userId },
      );
    }

    return {
      message: 'Logged out successfully.',
    };
  }

  // ─────────────────────────────────────────────
  // ME
  // ─────────────────────────────────────────────

  async me(currentUser: AuthenticatedUser) {
    // Re-query to include organisation memberships efficiently
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        ...SAFE_USER_SELECT,
        memberships: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            organisationId: true,
            organisation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.mobileNumber !== undefined && { mobileNumber: dto.mobileNumber }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.suffix !== undefined && { suffix: dto.suffix }),
      },
      select: SAFE_USER_SELECT
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'seguemeet_avatars',
          resource_type: 'image',
          transformation: [{ width: 500, height: 500, crop: 'limit' }],
        },
        async (error, result) => {
          if (error) {
            return reject(new InternalServerErrorException('Failed to upload image'));
          }
          if (!result) {
            return reject(new InternalServerErrorException('No result from Cloudinary'));
          }

          try {
            const updatedUser = await this.prisma.user.update({
              where: { id: userId },
              data: { avatarUrl: result.secure_url },
              select: SAFE_USER_SELECT,
            });
            resolve(updatedUser);
          } catch (dbError) {
            reject(new InternalServerErrorException('Failed to update avatar in database'));
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // ─────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ─────────────────────────────────────────────

  async verifyEmail(token: string) {
    const verificationTokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        verificationTokenHash,
        verificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationTokenHash: null,
        verificationExpires: null,
      },
    });

    await this.auditService.logSystemEvent(
      'EMAIL_VERIFIED',
      'User verified their email address',
      { userId: user.id },
    );

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user && !user.isEmailVerified) {
      const verificationToken = randomBytes(32).toString('hex');
      const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationTokenHash,
          verificationExpires,
        },
      });

      await this.mailService.sendVerificationEmail(user.email, verificationToken);
      
      await this.auditService.logSystemEvent(
        'EMAIL_VERIFICATION_SENT',
        'Resent verification email',
        { userId: user.id },
      );
    }

    // Generic response to prevent enumeration
    return { message: 'If the account exists and requires verification, a verification email has been sent.' };
  }

  // ─────────────────────────────────────────────
  // PASSWORD RESET
  // ─────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Silently return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists for this email, a password reset link has been sent.' };
    }

    // Generate secure token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: resetTokenHash,
        resetPasswordExpires,
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    await this.auditService.logSystemEvent(
      'PASSWORD_RESET_REQUESTED',
      'User requested a password reset',
      { userId: user.id },
    );

    return { message: 'If an account exists for this email, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetTokenHash = createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: resetTokenHash,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
        lastPasswordResetAt: new Date(),
      },
    });

    await this.auditService.logSystemEvent(
      'PASSWORD_RESET_COMPLETED',
      'User completed password reset',
      { userId: user.id },
    );

    return { message: 'Password has been reset successfully.' };
  }

  // ─────────────────────────────────────────────
  // CHANGE PASSWORD
  // ─────────────────────────────────────────────

  async changePassword(currentUser: AuthenticatedUser, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found or password not set.');
    }

    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Incorrect current password.');
    }

    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new ConflictException('New password must be different from current password.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        lastPasswordResetAt: new Date(),
      },
    });

    await this.auditService.logSystemEvent(
      'PASSWORD_CHANGED',
      'User changed their password',
      { userId: user.id },
    );

    return { message: 'Password changed successfully.' };
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  private issueToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email, jti: randomUUID() };
    return this.jwtService.sign(payload);
  }
}
