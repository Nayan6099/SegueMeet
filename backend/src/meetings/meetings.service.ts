import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { OrganisationRole, Prisma, NotificationType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  // Roles allowed to edit meetings
  private readonly EDIT_ROLES: OrganisationRole[] = [
    OrganisationRole.BOARD_ADMIN,
    OrganisationRole.CHAIR,
    OrganisationRole.SECRETARY,
  ];

  // Roles allowed to delete meetings
  private readonly DELETE_ROLES: OrganisationRole[] = [
    OrganisationRole.BOARD_ADMIN,
    OrganisationRole.CHAIR,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * POST /meetings
   */
  async createMeeting(dto: CreateMeetingDto, user: AuthenticatedUser) {
    // 1. Verify tenant membership
    await this.organisationsService.requireMembership(
      dto.organisationId,
      user.id,
    );

    try {
      const meeting = await this.prisma.meeting.create({
        data: {
          organisationId: dto.organisationId,
          title: dto.title,
          date: dto.date,
          startTime: dto.startTime,
          endTime: dto.endTime,
          location: dto.location,
          isRemote: dto.isRemote ?? false,
          administrator: dto.administrator,
          notes: dto.notes,
          status: dto.status,
        },
      });

      this.auditService.log({
        organisationId: dto.organisationId,
        actorId: user.id,
        action: 'meeting.created',
        entityType: 'Meeting',
        entityId: meeting.id,
        payload: { title: dto.title, date: dto.date },
      });

      // Fetch all organisation members to notify them
      const members = await this.prisma.organisationMember.findMany({
        where: { organisationId: dto.organisationId },
      });

      for (const member of members) {
        if (member.userId !== user.id) { // Optional: don't notify the creator
          await this.notificationsService.createNotification({
            organisationId: dto.organisationId,
            recipientId: member.userId,
            type: NotificationType.MEETING_CREATED,
            title: 'New Meeting Scheduled',
            message: `A new meeting "${meeting.title}" has been scheduled for ${meeting.date}.`,
            entityType: 'Meeting',
            entityId: meeting.id,
          });
        }
      }

      return meeting;
    } catch (error) {
      this.logger.error(
        `Failed to create meeting for org ${dto.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create meeting');
    }
  }

  /**
   * GET /meetings
   */
  async getMeetings(query: QueryMeetingsDto, user: AuthenticatedUser) {
    // 1. Verify tenant membership
    await this.organisationsService.requireMembership(
      query.organisationId,
      user.id,
    );

    try {
      const where: Prisma.MeetingWhereInput = {
        organisationId: query.organisationId,
      };

      if (query.status) {
        where.status = query.status;
      }

      if (query.from || query.to) {
        where.date = {};
        if (query.from) where.date.gte = query.from;
        if (query.to) where.date.lte = query.to;
      }

      if (query.search) {
        where.title = { contains: query.search, mode: 'insensitive' };
      }

      const skip = query.skip ? Number(query.skip) : 0;
      const take = query.take ? Number(query.take) : 50;

      const [data, total] = await Promise.all([
        this.prisma.meeting.findMany({
          where,
          orderBy: { date: 'desc' },
          skip,
          take,
        }),
        this.prisma.meeting.count({ where }),
      ]);

      return { data, total, skip, take };
    } catch (error) {
      this.logger.error(
        `Failed to fetch meetings for org ${query.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch meetings');
    }
  }

  /**
   * GET /meetings/:id
   */
  async getMeetingById(id: string, user: AuthenticatedUser) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // 1. Verify tenant membership against the meeting's organisationId
    await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    return meeting;
  }

  /**
   * PATCH /meetings/:id
   */
  async updateMeeting(
    id: string,
    dto: UpdateMeetingDto,
    user: AuthenticatedUser,
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // 1. Verify tenant membership
    const membership = await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    // 2. Enforce role-based authorization for editing
    if (!this.EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to update meetings in this organisation',
      );
    }

    try {
      const updated = await this.prisma.meeting.update({
        where: { id },
        data: {
          title: dto.title,
          date: dto.date,
          startTime: dto.startTime,
          endTime: dto.endTime,
          location: dto.location,
          isRemote: dto.isRemote,
          administrator: dto.administrator,
          notes: dto.notes,
          status: dto.status,
          agendaStatus: dto.agendaStatus,
        },
      });

      this.auditService.log({
        organisationId: meeting.organisationId,
        actorId: user.id,
        action: 'meeting.updated',
        entityType: 'Meeting',
        entityId: id,
        payload: { title: dto.title, status: dto.status },
      });

      if (dto.agendaStatus === 'PUBLISHED') {
        this.auditService.log({
          organisationId: meeting.organisationId,
          actorId: user.id,
          action: 'agenda.published',
          entityType: 'Meeting',
          entityId: id,
        });

        // Notify all members
        const members = await this.prisma.organisationMember.findMany({
          where: { organisationId: meeting.organisationId },
        });

        for (const member of members) {
          if (member.userId !== user.id) {
            await this.notificationsService.createNotification({
              organisationId: meeting.organisationId,
              recipientId: member.userId,
              type: NotificationType.AGENDA_PUBLISHED,
              title: 'Agenda Published',
              message: `The agenda for "${meeting.title}" has been published.`,
              entityType: 'Meeting',
              entityId: meeting.id,
            });
          }
        }
      }

      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update meeting ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update meeting');
    }
  }

  /**
   * DELETE /meetings/:id
   */
  async deleteMeeting(id: string, user: AuthenticatedUser) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // 1. Verify tenant membership
    const membership = await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    // 2. Enforce role-based authorization for deletion
    if (!this.DELETE_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to delete meetings in this organisation',
      );
    }

    try {
      await this.prisma.meeting.delete({
        where: { id },
      });

      this.auditService.log({
        organisationId: meeting.organisationId,
        actorId: user.id,
        action: 'meeting.deleted',
        entityType: 'Meeting',
        entityId: id,
      });

      return { message: 'Meeting deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete meeting ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete meeting');
    }
  }
}
