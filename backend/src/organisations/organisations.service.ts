import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, OrganisationMember, OrganisationRole } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AuditService } from '../audit/audit.service';

/** Roles that have administrative permissions within an organisation. */
const ADMIN_ROLES: OrganisationRole[] = [OrganisationRole.BOARD_ADMIN];

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // ORGANISATION CRUD
  // ─────────────────────────────────────────────

  /**
   * GET /organisations/:id
   *
   * Returns the organisation. Requesting user must be a member.
   */
  async findById(organisationId: string, requestingUser: AuthenticatedUser) {
    await this.requireMembership(organisationId, requestingUser.id);

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: {
        id: true,
        name: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { members: true, meetings: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    return org;
  }

  /**
   * PATCH /organisations/:id
   *
   * Updates the organisation. Requesting user must be a BOARD_ADMIN.
   */
  async update(
    organisationId: string,
    dto: UpdateOrganisationDto,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireAdminRole(organisationId, requestingUser.id);

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });
    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    const updatedOrg = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.settings !== undefined && {
          settings: dto.settings as Prisma.InputJsonValue,
        }),
      },
      select: {
        id: true,
        name: true,
        settings: true,
        updatedAt: true,
      },
    });

    this.auditService.log({
      organisationId,
      actorId: requestingUser.id,
      action: 'organisation.updated',
      entityType: 'Organisation',
      entityId: organisationId,
      payload: { name: dto.name, settings: dto.settings },
    });

    return updatedOrg;
  }

  // ─────────────────────────────────────────────
  // MEMBER MANAGEMENT
  // ─────────────────────────────────────────────

  /**
   * GET /organisations/:id/members
   *
   * Lists all members. Requesting user must be a member of the organisation.
   */
  async listMembers(organisationId: string, requestingUser: AuthenticatedUser) {
    await this.requireMembership(organisationId, requestingUser.id);

    const orgExists = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });
    if (!orgExists) {
      throw new NotFoundException('Organisation not found');
    }

    return this.prisma.organisationMember.findMany({
      where: { organisationId },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * POST /organisations/:id/members
   *
   * Adds an existing user to the organisation with the specified role.
   * Requesting user must be a BOARD_ADMIN.
   */
  async addMember(
    organisationId: string,
    dto: AddMemberDto,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireAdminRole(organisationId, requestingUser.id);

    const orgExists = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });
    if (!orgExists) {
      throw new NotFoundException('Organisation not found');
    }

    // Look up the target user by email
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      select: { id: true, email: true, name: true },
    });
    if (!targetUser) {
      throw new NotFoundException(
        `No account found with email ${dto.email}. The user must register first.`,
      );
    }

    // Check they are not already a member
    const existingMembership = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId,
          userId: targetUser.id,
        },
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        `${dto.email} is already a member of this organisation`,
      );
    }

    const membership = await this.prisma.organisationMember.create({
      data: {
        organisationId,
        userId: targetUser.id,
        role: dto.role,
      },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    this.auditService.log({
      organisationId,
      actorId: requestingUser.id,
      action: 'organisation.member_added',
      entityType: 'OrganisationMember',
      entityId: membership.id,
      payload: { userId: targetUser.id, role: dto.role },
    });

    return membership;
  }

  /**
   * DELETE /organisations/:id/members/:userId
   *
   * Removes a user's membership from the organisation.
   * Requesting user must be a BOARD_ADMIN.
   *
   * Safety guards:
   *  - Admins cannot remove themselves (prevents accidental lock-out).
   *  - The last BOARD_ADMIN of an org cannot be removed.
   *  - Only the membership record is deleted, never the User account.
   */
  async removeMember(
    organisationId: string,
    targetUserId: string,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireAdminRole(organisationId, requestingUser.id);

    const orgExists = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });
    if (!orgExists) {
      throw new NotFoundException('Organisation not found');
    }

    // Prevent self-removal to guard against accidental lock-out
    if (targetUserId === requestingUser.id) {
      throw new BadRequestException(
        'You cannot remove yourself from the organisation. Ask another admin to do this.',
      );
    }

    // Find the target membership
    const membership = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId,
          userId: targetUserId,
        },
      },
    });
    if (!membership) {
      throw new NotFoundException(
        'This user is not a member of the organisation',
      );
    }

    // Protect the last BOARD_ADMIN
    if (membership.role === OrganisationRole.BOARD_ADMIN) {
      const adminCount = await this.prisma.organisationMember.count({
        where: { organisationId, role: OrganisationRole.BOARD_ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last Board Admin. Promote another member to Board Admin first.',
        );
      }
    }

    // Delete the membership record (NOT the user account)
    await this.prisma.organisationMember.delete({
      where: { id: membership.id },
    });

    this.auditService.log({
      organisationId,
      actorId: requestingUser.id,
      action: 'organisation.member_removed',
      entityType: 'OrganisationMember',
      entityId: membership.id,
      payload: { userId: targetUserId, role: membership.role },
    });

    return { message: 'Member removed from the organisation successfully' };
  }

  // ─────────────────────────────────────────────
  // TENANT ISOLATION HELPERS
  // ─────────────────────────────────────────────

  /**
   * Verifies the user is a member of the organisation.
   * Throws 403 Forbidden if they are not — preventing cross-tenant access.
   *
   * This is the foundation for all tenant-scoped operations.
   * Future modules (Meetings, Agenda, Minutes) should delegate to this method
   * or copy the same pattern in their respective services.
   *
   * Returns the membership record so callers can inspect the role.
   */
  async requireMembership(
    organisationId: string,
    userId: string,
  ): Promise<OrganisationMember> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: { organisationId, userId },
      },
    });

    if (!membership) {
      // Return 403, not 404, to avoid confirming the org exists to non-members
      throw new ForbiddenException(
        'You do not have access to this organisation',
      );
    }

    return membership;
  }

  /**
   * Verifies the user is a member with an administrative role.
   * Throws 403 Forbidden if they are a member but lack admin privileges.
   */
  private async requireAdminRole(
    organisationId: string,
    userId: string,
  ): Promise<OrganisationMember> {
    const membership = await this.requireMembership(organisationId, userId);

    if (!ADMIN_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'Only Board Admins can perform this action',
      );
    }

    return membership;
  }
}
