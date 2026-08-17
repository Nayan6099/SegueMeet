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

@Injectable()
export class AgendaService {
  private readonly logger = new Logger(AgendaService.name);

  // Roles allowed to modify agenda
  private readonly EDIT_ROLES: OrganisationRole[] = [
    OrganisationRole.BOARD_ADMIN,
    OrganisationRole.CHAIR,
    OrganisationRole.SECRETARY,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
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
      select: { id: true, organisationId: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const membership = await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    if (!this.EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to modify the agenda');
    }

    try {
      return await this.prisma.agendaSection.create({
        data: {
          meetingId,
          title: dto.title,
          position: dto.position ?? 0,
        },
      });
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

    await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    try {
      // Return the meeting with sections and items ordered by position
      return await this.prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          agendaSections: {
            orderBy: { position: 'asc' },
            include: {
              items: {
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      });
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
      include: { meeting: { select: { organisationId: true } } },
    });
    if (!section) throw new NotFoundException('Agenda section not found');

    const membership = await this.organisationsService.requireMembership(
      section.meeting.organisationId,
      user.id,
    );

    if (!this.EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to modify the agenda');
    }

    try {
      return await this.prisma.agendaSection.update({
        where: { id: sectionId },
        data: {
          title: dto.title,
          position: dto.position,
        },
      });
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
      include: { meeting: { select: { organisationId: true } } },
    });
    if (!section) throw new NotFoundException('Agenda section not found');

    const membership = await this.organisationsService.requireMembership(
      section.meeting.organisationId,
      user.id,
    );

    if (!this.EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to modify the agenda');
    }

    try {
      await this.prisma.agendaSection.delete({
        where: { id: sectionId },
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
      include: { meeting: { select: { organisationId: true } } },
    });
    if (!section) throw new NotFoundException('Agenda section not found');

    const membership = await this.organisationsService.requireMembership(
      section.meeting.organisationId,
      user.id,
    );

    if (!this.EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to modify the agenda');
    }

    try {
      return await this.prisma.agendaItem.create({
        data: {
          sectionId,
          title: dto.title,
          purpose: dto.purpose,
          presenter: dto.presenter,
          durationMinutes: dto.durationMinutes ?? 5,
          position: dto.position ?? 0,
        },
      });
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
          include: { meeting: { select: { organisationId: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Agenda item not found');

    const membership = await this.organisationsService.requireMembership(
      item.section.meeting.organisationId,
      user.id,
    );

    if (!this.EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to modify the agenda');
    }

    try {
      return await this.prisma.agendaItem.update({
        where: { id: itemId },
        data: {
          title: dto.title,
          purpose: dto.purpose,
          presenter: dto.presenter,
          durationMinutes: dto.durationMinutes,
          position: dto.position,
        },
      });
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
          include: { meeting: { select: { organisationId: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Agenda item not found');

    const membership = await this.organisationsService.requireMembership(
      item.section.meeting.organisationId,
      user.id,
    );

    if (!this.EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to modify the agenda');
    }

    try {
      await this.prisma.agendaItem.delete({
        where: { id: itemId },
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
}
