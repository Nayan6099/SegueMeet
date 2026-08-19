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
import * as crypto from 'crypto';
import { CreateMinutesDto } from './dto/create-minutes.dto';
import { UpdateMinutesDto } from './dto/update-minutes.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

import { CAN_MANAGE_MINUTES, CAN_MANAGE_ACTIONS } from '../common/auth/roles.constants';

@Injectable()
export class MinutesService {
  private readonly logger = new Logger(MinutesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
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
      throw new NotFoundException(`Assignee user ${assigneeId} does not exist`);
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

    const membership = await this.organisationsService.requireRole(
      meeting.organisationId,
      user.id,
      CAN_MANAGE_MINUTES
    );

    try {
      const minutes = await this.prisma.minutes.create({
        data: {
          meetingId,
          status: dto.status,
          content: dto.content,
        },
        include: { actionItems: true },
      });

      this.auditService.log({
        organisationId: meeting.organisationId,
        actorId: user.id,
        action: 'minutes.created',
        entityType: 'Minutes',
        entityId: minutes.id,
        payload: { meetingId, status: dto.status },
      });

      return minutes;
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
          signatures: {
            include: {
              signer: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      if (!minutes)
        throw new NotFoundException('No minutes found for this meeting');

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

    const membership = await this.organisationsService.requireRole(
      minutes.meeting.organisationId,
      user.id,
      CAN_MANAGE_MINUTES
    );

    try {
      const updated = await this.prisma.minutes.update({
        where: { id: minutesId },
        data: {
          status: dto.status,
          content: dto.content,
        },
        include: { actionItems: true },
      });

      this.auditService.log({
        organisationId: minutes.meeting.organisationId,
        actorId: user.id,
        action: 'minutes.updated',
        entityType: 'Minutes',
        entityId: minutesId,
        payload: { status: dto.status },
      });

      return updated;
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

    const membership = await this.organisationsService.requireRole(
      minutes.meeting.organisationId,
      user.id,
      CAN_MANAGE_MINUTES
    );

    try {
      await this.prisma.minutes.delete({ where: { id: minutesId } });

      this.auditService.log({
        organisationId: minutes.meeting.organisationId,
        actorId: user.id,
        action: 'minutes.deleted',
        entityType: 'Minutes',
        entityId: minutesId,
      });

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
  // MINUTES APPROVAL WORKFLOW
  // ─────────────────────────────────────────────

  async submitForReview(minutesId: string, user: AuthenticatedUser) {
    const minutes = await this.resolveMinutes(minutesId);
    await this.organisationsService.requireRole(
      minutes.meeting.organisationId,
      user.id,
      CAN_MANAGE_MINUTES
    );

    if (minutes.status !== 'DRAFT') {
      throw new ConflictException('Only DRAFT minutes can be submitted for review');
    }

    try {
      const updated = await this.prisma.minutes.update({
        where: { id: minutesId },
        data: { status: 'IN_REVIEW' },
      });

      this.auditService.log({
        organisationId: minutes.meeting.organisationId,
        actorId: user.id,
        action: 'minutes.submitted_for_review',
        entityType: 'Minutes',
        entityId: minutesId,
      });

      // Notify attendees that minutes are ready for review
      const attendees = await this.prisma.meetingAttendee.findMany({
        where: { meetingId: minutes.meetingId },
      });

      for (const attendee of attendees) {
        if (attendee.userId !== user.id) {
          await this.notificationsService.createNotification({
            organisationId: minutes.meeting.organisationId,
            recipientId: attendee.userId,
            type: NotificationType.DOCUMENT_UPLOADED,
            title: 'Minutes Ready for Review',
            message: 'The meeting minutes are now ready for your review and signature.',
            entityType: 'Minutes',
            entityId: minutesId,
          });
        }
      }

      return updated;
    } catch (error) {
      this.logger.error(`Failed to submit minutes ${minutesId} for review`, error);
      throw new InternalServerErrorException('Failed to submit minutes for review');
    }
  }

  async signMinutes(minutesId: string, user: AuthenticatedUser) {
    const minutes = await this.resolveMinutes(minutesId);
    
    // Any member of the org can technically sign if they were at the meeting
    // Validating membership is a baseline security check
    await this.organisationsService.requireMembership(
      minutes.meeting.organisationId,
      user.id
    );

    if (minutes.status !== 'IN_REVIEW') {
      throw new ConflictException('Minutes must be IN_REVIEW to be signed');
    }

    // Optional: check if they attended the meeting
    const attendance = await this.prisma.meetingAttendee.findUnique({
      where: {
        meetingId_userId: { meetingId: minutes.meetingId, userId: user.id }
      }
    });

    if (!attendance) {
      throw new ForbiddenException('Only meeting attendees can sign the minutes');
    }

    const signatureHash = crypto
      .createHash('sha256')
      .update(`${minutesId}:${user.id}:${minutes.content || ''}:${Date.now()}`)
      .digest('hex');

    try {
      const signature = await this.prisma.minutesSignature.create({
        data: {
          minutesId,
          signerId: user.id,
          signatureHash,
        },
      });

      this.auditService.log({
        organisationId: minutes.meeting.organisationId,
        actorId: user.id,
        action: 'minutes.signed',
        entityType: 'MinutesSignature',
        entityId: signature.id,
      });

      return signature;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already signed these minutes');
      }
      this.logger.error(`Failed to sign minutes ${minutesId}`, error);
      throw new InternalServerErrorException('Failed to sign minutes');
    }
  }

  async confirmMinutes(minutesId: string, user: AuthenticatedUser) {
    const minutes = await this.resolveMinutes(minutesId);
    await this.organisationsService.requireRole(
      minutes.meeting.organisationId,
      user.id,
      CAN_MANAGE_MINUTES
    );

    if (minutes.status !== 'IN_REVIEW') {
      throw new ConflictException('Only IN_REVIEW minutes can be confirmed');
    }

    try {
      const updated = await this.prisma.minutes.update({
        where: { id: minutesId },
        data: { status: 'CONFIRMED' },
      });

      this.auditService.log({
        organisationId: minutes.meeting.organisationId,
        actorId: user.id,
        action: 'minutes.confirmed',
        entityType: 'Minutes',
        entityId: minutesId,
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to confirm minutes ${minutesId}`, error);
      throw new InternalServerErrorException('Failed to confirm minutes');
    }
  }

  // ─────────────────────────────────────────────
  // ACTION ITEMS
  // ─────────────────────────────────────────────

  /**
   * GET /minutes/actions
   * Fetch all action items across all meetings for an organisation
   */
  async getGlobalActionItems(organisationId: string, user: AuthenticatedUser, skip?: number, take?: number) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      const where = {
        minutes: {
          meeting: {
            organisationId,
          },
        },
      };

      const [data, total] = await Promise.all([
        this.prisma.minutesActionItem.findMany({
          where,
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            minutes: {
              include: {
                meeting: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.minutesActionItem.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      this.logger.error(
        `Failed to fetch global action items for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch action items');
    }
  }

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

    const membership = await this.organisationsService.requireRole(
      organisationId,
      user.id,
      CAN_MANAGE_ACTIONS
    );

    // Validate assignee belongs to the same tenant before touching DB
    if (dto.assigneeId) {
      await this.validateAssigneeInOrg(dto.assigneeId, organisationId);
    }

    try {
      const item = await this.prisma.minutesActionItem.create({
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

      this.auditService.log({
        organisationId,
        actorId: user.id,
        action: 'action_item.created',
        entityType: 'MinutesActionItem',
        entityId: item.id,
        payload: {
          minutesId,
          description: dto.description,
          status: dto.status,
        },
      });

      if (dto.assigneeId && dto.assigneeId !== user.id) {
        await this.notificationsService.createNotification({
          organisationId,
          recipientId: dto.assigneeId,
          type: NotificationType.ACTION_ITEM_ASSIGNED,
          title: 'Action Item Assigned',
          message: `You have been assigned an action item: "${dto.description}"`,
          entityType: 'MinutesActionItem',
          entityId: item.id,
        });
      }

      return item;
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

    const membership = await this.organisationsService.requireRole(
      organisationId,
      user.id,
      CAN_MANAGE_ACTIONS
    );

    // Validate new assignee belongs to same tenant (if being changed)
    if (dto.assigneeId) {
      await this.validateAssigneeInOrg(dto.assigneeId, organisationId);
    }

    try {
      const updated = await this.prisma.minutesActionItem.update({
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

      this.auditService.log({
        organisationId,
        actorId: user.id,
        action: 'action_item.updated',
        entityType: 'MinutesActionItem',
        entityId: actionItemId,
        payload: { description: dto.description, status: dto.status },
      });

      if (dto.assigneeId && dto.assigneeId !== item.assigneeId && dto.assigneeId !== user.id) {
        await this.notificationsService.createNotification({
          organisationId,
          recipientId: dto.assigneeId,
          type: NotificationType.ACTION_ITEM_ASSIGNED,
          title: 'Action Item Assigned',
          message: `You have been assigned an action item: "${dto.description || item.description}"`,
          entityType: 'MinutesActionItem',
          entityId: item.id,
        });
      }

      return updated;
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

    const membership = await this.organisationsService.requireRole(
      organisationId,
      user.id,
      CAN_MANAGE_ACTIONS
    );

    try {
      await this.prisma.minutesActionItem.delete({
        where: { id: actionItemId },
      });

      this.auditService.log({
        organisationId,
        actorId: user.id,
        action: 'action_item.deleted',
        entityType: 'MinutesActionItem',
        entityId: actionItemId,
      });

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
