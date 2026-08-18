import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OrganisationRole } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  type JwtPayload,
  type AuthenticatedUser,
  SAFE_USER_SELECT,
} from './auth.types';

/** bcrypt cost factor — 12 rounds is the recommended production minimum. */
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

    // 4. Fetch the safe user representation for the response
    const safeUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      select: SAFE_USER_SELECT,
    });

    return {
      accessToken: this.issueToken(safeUser.id, safeUser.email),
      user: safeUser,
      organisation: { id: result.orgId, name: result.orgName },
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
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Build safe user (omit passwordHash)
    const { passwordHash: _pw, ...safeUser } = user;
    void _pw; // explicitly discard

    return {
      accessToken: this.issueToken(user.id, user.email),
      user: safeUser,
    };
  }

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  logout() {
    /**
     * JWT tokens are stateless — the server cannot invalidate an already-issued
     * token without a revocation store (e.g. Redis blocklist).
     *
     * For Phase 2, clients should discard the access token on their side.
     * Token revocation can be added in a future security hardening phase.
     */
    return {
      message:
        'Logged out successfully. Please discard your access token on the client side.',
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
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  private issueToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
