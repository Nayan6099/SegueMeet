import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { CreateMeetingConflictDto } from './dto/create-meeting-conflict.dto';
import { UpdateMeetingConflictDto } from './dto/update-meeting-conflict.dto';

@Injectable()
export class InterestsService {
  private readonly logger = new Logger(InterestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async getInterests(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      return await this.prisma.interest.findMany({
        where: { organisationId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch interests for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch interests');
    }
  }

  async createInterest(dto: CreateInterestDto, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(dto.organisationId, user.id);

    if (!dto.userId && !dto.guestName) {
      throw new BadRequestException('Either userId or guestName must be provided');
    }
    
    return this.prisma.interest.create({
      data: {
        organisationId: dto.organisationId,
        userId: dto.userId || null,
        guestName: dto.guestName || null,
        title: dto.title,
        description: dto.description,
        notificationDate: dto.notificationDate,
        isResolved: dto.isResolved ?? false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      }
    });
  }

  async updateInterest(interestId: string, dto: UpdateInterestDto, user: AuthenticatedUser) {
    const interest = await this.prisma.interest.findUnique({
      where: { id: interestId }
    });
    if (!interest) throw new NotFoundException('Interest not found');

    await this.organisationsService.requireMembership(interest.organisationId, user.id);

    return this.prisma.interest.update({
      where: { id: interestId },
      data: {
        title: dto.title,
        description: dto.description,
        notificationDate: dto.notificationDate,
        isResolved: dto.isResolved,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      }
    });
  }

  async deleteInterest(interestId: string, user: AuthenticatedUser) {
    const interest = await this.prisma.interest.findUnique({
      where: { id: interestId }
    });
    if (!interest) throw new NotFoundException('Interest not found');

    await this.organisationsService.requireMembership(interest.organisationId, user.id);

    await this.prisma.interest.delete({ where: { id: interestId } });
    return { message: 'Interest deleted successfully' };
  }

  // ─────────────────────────────────────────────
  // MEETING CONFLICTS
  // ─────────────────────────────────────────────

  async getMeetingConflicts(meetingId: string, user: AuthenticatedUser) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { organisationId: true }
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    await this.organisationsService.requireMembership(meeting.organisationId, user.id);

    return this.prisma.meetingConflict.findMany({
      where: { meetingId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        interest: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async declareMeetingConflict(meetingId: string, dto: CreateMeetingConflictDto, user: AuthenticatedUser) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { organisationId: true }
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    await this.organisationsService.requireMembership(meeting.organisationId, user.id);

    if (dto.interestId) {
      const interest = await this.prisma.interest.findUnique({ where: { id: dto.interestId } });
      if (!interest || interest.organisationId !== meeting.organisationId) {
        throw new BadRequestException('Invalid interestId');
      }
    }

    return this.prisma.meetingConflict.create({
      data: {
        meetingId,
        agendaItemId: dto.agendaItemId ?? null,
        userId: dto.userId,
        interestId: dto.interestId ?? null,
        description: dto.description ?? null,
        actionTaken: dto.actionTaken ?? 'NOTED',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        interest: true,
      }
    });
  }

  async updateMeetingConflict(conflictId: string, dto: UpdateMeetingConflictDto, user: AuthenticatedUser) {
    const conflict = await this.prisma.meetingConflict.findUnique({
      where: { id: conflictId },
      include: { meeting: { select: { organisationId: true } } }
    });
    if (!conflict) throw new NotFoundException('Conflict not found');

    await this.organisationsService.requireMembership(conflict.meeting.organisationId, user.id);

    return this.prisma.meetingConflict.update({
      where: { id: conflictId },
      data: {
        actionTaken: dto.actionTaken,
        description: dto.description,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        interest: true,
      }
    });
  }
}

