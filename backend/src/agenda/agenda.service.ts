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
import { CreateAgendaSectionDto } from './dto/create-agenda-section.dto';
import { UpdateAgendaSectionDto } from './dto/update-agenda-section.dto';
import { CreateAgendaItemDto } from './dto/create-agenda-item.dto';
import { UpdateAgendaItemDto } from './dto/update-agenda-item.dto';
import { OrganisationRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { CAN_MANAGE_AGENDA } from '../common/auth/roles.constants';

@Injectable()
export class AgendaService {
  private readonly logger = new Logger(AgendaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // SECTIONS
  // ─────────────────────────────────────────────

  async createSection(
    meetingId: string,
    dto: CreateAgendaSectionDto,
    user: AuthenticatedUser,
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, organisationId: true, agendaStatus: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.agendaStatus === 'PUBLISHED') throw new ForbiddenException('Cannot modify a published agenda');

    const membership = await this.organisationsService.requireRole(
      meeting.organisationId,
      user.id,
      CAN_MANAGE_AGENDA
    );

    try {
      const section = await this.prisma.agendaSection.create({
        data: {
          meetingId,
          title: dto.title,
          position: dto.position ?? 0,
        },
      });

      this.auditService.log({
        organisationId: meeting.organisationId,
        actorId: user.id,
        action: 'agenda_section.created',
        entityType: 'AgendaSection',
        entityId: section.id,
        payload: { meetingId, title: dto.title },
      });

      return section;
    } catch (error) {
      this.logger.error(
        `Failed to create agenda section for meeting ${meetingId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create agenda section');
    }
  }

  async getAgenda(meetingId: string, user: AuthenticatedUser) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, organisationId: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const membership = await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    const isGuest = membership.role === 'GUEST';

    try {
      const meetingData = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          agendaSections: {
            orderBy: { position: 'asc' },
            include: {
              items: {
                orderBy: { position: 'asc' },
                include: {
                  accessRules: true
                }
              },
            },
          },
        },
      });

      if (!meetingData) return null;

      if (isGuest) {
        // Filter sections and items
        const newSections = meetingData.agendaSections.map(section => {
          section.items = section.items.filter(item => 
            item.accessRules.some(access => access.memberId === membership.id)
          );
          return section;
        }).filter(section => section.items.length > 0);
        
        return {
          ...meetingData,
          agendaSections: newSections
        };
      }

      return meetingData;
    } catch (error) {
      this.logger.error(
        `Failed to fetch agenda for meeting ${meetingId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch agenda');
    }
  }

  async updateSection(
    sectionId: string,
    dto: UpdateAgendaSectionDto,
    user: AuthenticatedUser,
  ) {
    const section = await this.prisma.agendaSection.findUnique({
      where: { id: sectionId },
      include: { meeting: { select: { organisationId: true, agendaStatus: true } } },
    });
    if (!section) throw new NotFoundException('Agenda section not found');
    if (section.meeting.agendaStatus === 'PUBLISHED') throw new ForbiddenException('Cannot modify a published agenda');

    const membership = await this.organisationsService.requireRole(
      section.meeting.organisationId,
      user.id,
      CAN_MANAGE_AGENDA
    );

    try {
      const updated = await this.prisma.agendaSection.update({
        where: { id: sectionId },
        data: {
          title: dto.title,
          position: dto.position,
        },
      });

      this.auditService.log({
        organisationId: section.meeting.organisationId,
        actorId: user.id,
        action: 'agenda_section.updated',
        entityType: 'AgendaSection',
        entityId: sectionId,
        payload: { title: dto.title, position: dto.position },
      });

      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update agenda section ${sectionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update agenda section');
    }
  }

  async deleteSection(sectionId: string, user: AuthenticatedUser) {
    const section = await this.prisma.agendaSection.findUnique({
      where: { id: sectionId },
      include: { meeting: { select: { organisationId: true, agendaStatus: true } } },
    });
    if (!section) throw new NotFoundException('Agenda section not found');
    if (section.meeting.agendaStatus === 'PUBLISHED') throw new ForbiddenException('Cannot modify a published agenda');

    const membership = await this.organisationsService.requireRole(
      section.meeting.organisationId,
      user.id,
      CAN_MANAGE_AGENDA
    );

    try {
      await this.prisma.agendaSection.delete({
        where: { id: sectionId },
      });

      this.auditService.log({
        organisationId: section.meeting.organisationId,
        actorId: user.id,
        action: 'agenda_section.deleted',
        entityType: 'AgendaSection',
        entityId: sectionId,
      });

      return { message: 'Agenda section deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete agenda section ${sectionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete agenda section');
    }
  }

  // ─────────────────────────────────────────────
  // ITEMS
  // ─────────────────────────────────────────────

  async createItem(
    sectionId: string,
    dto: CreateAgendaItemDto,
    user: AuthenticatedUser,
  ) {
    const section = await this.prisma.agendaSection.findUnique({
      where: { id: sectionId },
      include: { meeting: { select: { organisationId: true, agendaStatus: true } } },
    });
    if (!section) throw new NotFoundException('Agenda section not found');
    if (section.meeting.agendaStatus === 'PUBLISHED') throw new ForbiddenException('Cannot modify a published agenda');

    const membership = await this.organisationsService.requireRole(
      section.meeting.organisationId,
      user.id,
      CAN_MANAGE_AGENDA
    );

    try {
      const item = await this.prisma.agendaItem.create({
        data: {
          sectionId,
          title: dto.title,
          purpose: dto.purpose,
          presenter: dto.presenter,
          durationMinutes: dto.durationMinutes ?? 5,
          position: dto.position ?? 0,
        },
      });

      this.auditService.log({
        organisationId: section.meeting.organisationId,
        actorId: user.id,
        action: 'agenda_item.created',
        entityType: 'AgendaItem',
        entityId: item.id,
        payload: { sectionId, title: dto.title },
      });

      return item;
    } catch (error) {
      this.logger.error(
        `Failed to create agenda item in section ${sectionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create agenda item');
    }
  }

  async updateItem(
    itemId: string,
    dto: UpdateAgendaItemDto,
    user: AuthenticatedUser,
  ) {
    const item = await this.prisma.agendaItem.findUnique({
      where: { id: itemId },
      include: {
        section: {
          include: { meeting: { select: { organisationId: true, agendaStatus: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Agenda item not found');
    if (item.section.meeting.agendaStatus === 'PUBLISHED') throw new ForbiddenException('Cannot modify a published agenda');

    const membership = await this.organisationsService.requireRole(
      item.section.meeting.organisationId,
      user.id,
      CAN_MANAGE_AGENDA
    );

    try {
      const updated = await this.prisma.agendaItem.update({
        where: { id: itemId },
        data: {
          title: dto.title,
          purpose: dto.purpose,
          presenter: dto.presenter,
          durationMinutes: dto.durationMinutes,
          position: dto.position,
        },
      });

      this.auditService.log({
        organisationId: item.section.meeting.organisationId,
        actorId: user.id,
        action: 'agenda_item.updated',
        entityType: 'AgendaItem',
        entityId: itemId,
        payload: { title: dto.title, purpose: dto.purpose },
      });

      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update agenda item ${itemId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update agenda item');
    }
  }

  async deleteItem(itemId: string, user: AuthenticatedUser) {
    const item = await this.prisma.agendaItem.findUnique({
      where: { id: itemId },
      include: {
        section: {
          include: { meeting: { select: { organisationId: true, agendaStatus: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Agenda item not found');
    if (item.section.meeting.agendaStatus === 'PUBLISHED') throw new ForbiddenException('Cannot modify a published agenda');

    const membership = await this.organisationsService.requireRole(
      item.section.meeting.organisationId,
      user.id,
      CAN_MANAGE_AGENDA
    );

    try {
      await this.prisma.agendaItem.delete({
        where: { id: itemId },
      });

      this.auditService.log({
        organisationId: item.section.meeting.organisationId,
        actorId: user.id,
        action: 'agenda_item.deleted',
        entityType: 'AgendaItem',
        entityId: itemId,
      });

      return { message: 'Agenda item deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete agenda item ${itemId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete agenda item');
    }
  }

  async grantItemAccess(
    meetingId: string,
    itemId: string,
    memberIds: string[],
    user: AuthenticatedUser
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { organisationId: true, agendaStatus: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.agendaStatus === 'PUBLISHED') throw new ForbiddenException('Cannot modify a published agenda');

    const membership = await this.organisationsService.requireRole(
      meeting.organisationId,
      user.id,
      CAN_MANAGE_AGENDA
    );

    try {
      // Clear existing access
      await this.prisma.agendaItemAccess.deleteMany({
        where: { agendaItemId: itemId }
      });

      // Add new access
      if (memberIds.length > 0) {
        await this.prisma.agendaItemAccess.createMany({
          data: memberIds.map(id => ({
            agendaItemId: itemId,
            memberId: id
          }))
        });
      }

      this.auditService.log({
        organisationId: meeting.organisationId,
        actorId: user.id,
        action: 'agenda_item.access_updated',
        entityType: 'AgendaItem',
        entityId: itemId,
        payload: { memberIds },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update agenda access for item ${itemId}`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to update agenda access');
    }
  }
}
