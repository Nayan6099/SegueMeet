import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrganisationRole, Prisma } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateMinutesDto } from './dto/create-minutes.dto';
import { UpdateMinutesDto } from './dto/update-minutes.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';

/** Roles permitted to create, update, or delete Minutes and Action Items. */
const EDIT_ROLES: OrganisationRole[] = [
  OrganisationRole.BOARD_ADMIN,
  OrganisationRole.CHAIR,
  OrganisationRole.SECRETARY,
];

@Injectable()
export class MinutesService {
  private readonly logger = new Logger(MinutesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Resolves a meeting by ID and returns its organisationId.
   * Throws 404 if the meeting does not exist.
   */
  private async resolveMeeting(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, organisationId: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  /**
   * Resolves a Minutes record by ID together with its parent meeting.
   * Throws 404 if not found.
   */
  private async resolveMinutes(minutesId: string) {
    const minutes = await this.prisma.minutes.findUnique({
      where: { id: minutesId },
      include: {
        meeting: { select: { id: true, organisationId: true } },
      },
    });
    if (!minutes) throw new NotFoundException('Minutes not found');
    return minutes;
  }

  /**
   * Resolves a MinutesActionItem all the way up to its organisationId.
   * Throws 404 if any segment of the chain is missing.
   */
  private async resolveActionItem(actionItemId: string) {
    const item = await this.prisma.minutesActionItem.findUnique({
      where: { id: actionItemId },
      include: {
        minutes: {
          include: {
            meeting: { select: { id: true, organisationId: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Action item not found');
    return item;
  }

  /**
   * Verifies that a user (by userId) is a member of the given organisation.
   * Used to validate that an assignee belongs to the same tenant.
   * Throws 400 if the user does not exist, 409 if they are cross-tenant.
   */
  private async validateAssigneeInOrg(
    assigneeId: string,
    organisationId: string,
  ) {
    const assigneeUser = await this.prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, name: true },
    });
    if (!assigneeUser) {
      throw new NotFoundException(
        `Assignee user ${assigneeId} does not exist`,
      );
    }

    const assigneeMembership = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: { organisationId, userId: assigneeId },
      },
    });
    if (!assigneeMembership) {
      throw new ForbiddenException(
        'Assignee does not belong to this organisation',
      );
    }
  }

  // ─────────────────────────────────────────────
  // MINUTES
  // ─────────────────────────────────────────────

  /**
   * POST /meetings/:meetingId/minutes
   */
  async createMinutes(
    meetingId: string,
    dto: CreateMinutesDto,
    user: AuthenticatedUser,
  ) {
    const meeting = await this.resolveMeeting(meetingId);

    const membership = await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to create minutes',
      );
    }

    try {
      return await this.prisma.minutes.create({
        data: {
          meetingId,
          status: dto.status,
          content: dto.content,
        },
        include: { actionItems: true },
      });
    } catch (error) {
      // meetingId is @unique in the Minutes model → P2002 means a duplicate
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Minutes already exist for this meeting. Use PATCH to update.',
        );
      }

      this.logger.error(
        `Failed to create minutes for meeting ${meetingId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create minutes');
    }
  }

  /**
   * GET /meetings/:meetingId/minutes
   */
  async getMinutes(meetingId: string, user: AuthenticatedUser) {
    const meeting = await this.resolveMeeting(meetingId);

    await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    try {
      const minutes = await this.prisma.minutes.findUnique({
        where: { meetingId },
        include: {
          actionItems: {
            orderBy: { createdAt: 'asc' },
            include: {
              assignee: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      if (!minutes) throw new NotFoundException('No minutes found for this meeting');

      return minutes;
    } catch (error) {
      // Re-throw expected NestJS exceptions unchanged
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to fetch minutes for meeting ${meetingId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch minutes');
    }
  }

  /**
   * PATCH /minutes/:minutesId
   */
  async updateMinutes(
    minutesId: string,
    dto: UpdateMinutesDto,
    user: AuthenticatedUser,
  ) {
    const minutes = await this.resolveMinutes(minutesId);

    const membership = await this.organisationsService.requireMembership(
      minutes.meeting.organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to update minutes',
      );
    }

    try {
      return await this.prisma.minutes.update({
        where: { id: minutesId },
        data: {
          status: dto.status,
          content: dto.content,
        },
        include: { actionItems: true },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update minutes ${minutesId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update minutes');
    }
  }

  /**
   * DELETE /minutes/:minutesId
   *
   * Cascade: MinutesActionItem records are automatically removed via
   * the existing `onDelete: Cascade` defined in schema.prisma.
   */
  async deleteMinutes(minutesId: string, user: AuthenticatedUser) {
    const minutes = await this.resolveMinutes(minutesId);

    const membership = await this.organisationsService.requireMembership(
      minutes.meeting.organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to delete minutes',
      );
    }

    try {
      await this.prisma.minutes.delete({ where: { id: minutesId } });
      return { message: 'Minutes deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete minutes ${minutesId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete minutes');
    }
  }

  // ─────────────────────────────────────────────
  // ACTION ITEMS
  // ─────────────────────────────────────────────

  /**
   * POST /minutes/:minutesId/action-items
   */
  async createActionItem(
    minutesId: string,
    dto: CreateActionItemDto,
    user: AuthenticatedUser,
  ) {
    const minutes = await this.resolveMinutes(minutesId);
    const { organisationId } = minutes.meeting;

    const membership = await this.organisationsService.requireMembership(
      organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to create action items',
      );
    }

    // Validate assignee belongs to the same tenant before touching DB
    if (dto.assigneeId) {
      await this.validateAssigneeInOrg(dto.assigneeId, organisationId);
    }

    try {
      return await this.prisma.minutesActionItem.create({
        data: {
          minutesId,
          description: dto.description,
          assigneeId: dto.assigneeId ?? null,
          dueDate: dto.dueDate ?? null,
          status: dto.status,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create action item for minutes ${minutesId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create action item');
    }
  }

  /**
   * PATCH /action-items/:actionItemId
   */
  async updateActionItem(
    actionItemId: string,
    dto: UpdateActionItemDto,
    user: AuthenticatedUser,
  ) {
    const item = await this.resolveActionItem(actionItemId);
    const { organisationId } = item.minutes.meeting;

    const membership = await this.organisationsService.requireMembership(
      organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to update action items',
      );
    }

    // Validate new assignee belongs to same tenant (if being changed)
    if (dto.assigneeId) {
      await this.validateAssigneeInOrg(dto.assigneeId, organisationId);
    }

    try {
      return await this.prisma.minutesActionItem.update({
        where: { id: actionItemId },
        data: {
          description: dto.description,
          // undefined = don't touch the field; null = explicit unassign
          ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
          dueDate: dto.dueDate,
          status: dto.status,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update action item ${actionItemId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update action item');
    }
  }

  /**
   * DELETE /action-items/:actionItemId
   */
  async deleteActionItem(actionItemId: string, user: AuthenticatedUser) {
    const item = await this.resolveActionItem(actionItemId);
    const { organisationId } = item.minutes.meeting;

    const membership = await this.organisationsService.requireMembership(
      organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to delete action items',
      );
    }

    try {
      await this.prisma.minutesActionItem.delete({ where: { id: actionItemId } });
      return { message: 'Action item deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete action item ${actionItemId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete action item');
    }
  }
}
