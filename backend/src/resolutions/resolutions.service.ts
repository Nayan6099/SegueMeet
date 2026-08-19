import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { VoteStatus, ResolutionStatus } from '@prisma/client';
import { CreateResolutionDto } from './dto/create-resolution.dto';

import { CAN_MANAGE_RESOLUTIONS, CAN_VOTE } from '../common/auth/roles.constants';

@Injectable()
export class ResolutionsService {
  private readonly logger = new Logger(ResolutionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async getResolutions(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      return await this.prisma.resolution.findMany({
        where: { organisationId },
        include: {
          votes: {
            include: { voter: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch resolutions for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch resolutions');
    }
  }

  async createResolution(dto: CreateResolutionDto, user: AuthenticatedUser) {
    await this.organisationsService.requireRole(
      dto.organisationId,
      user.id,
      CAN_MANAGE_RESOLUTIONS
    );

    try {
      return await this.prisma.resolution.create({
        data: {
          organisationId: dto.organisationId,
          title: dto.title,
          description: dto.description,
          closeDate: dto.closeDate,
          status: ResolutionStatus.OPEN, // Start open for voting immediately
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create resolution for organisation ${dto.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create resolution');
    }
  }

  async castVote(
    resolutionId: string,
    status: VoteStatus,
    user: AuthenticatedUser,
  ) {
    const resolution = await this.prisma.resolution.findUnique({
      where: { id: resolutionId },
    });

    if (!resolution) throw new NotFoundException('Resolution not found');

    await this.organisationsService.requireRole(
      resolution.organisationId,
      user.id,
      CAN_VOTE
    );

    if (resolution.status !== 'OPEN') {
      throw new ForbiddenException('This resolution is not open for voting');
    }

    // Enforce closeDate (end of day local time, simple string comparison or date comparison)
    // closeDate is 'YYYY-MM-DD'. A simple Date parsing will do.
    const now = new Date();
    const closeDate = new Date(resolution.closeDate);
    // Add 1 day to make the closeDate inclusive of the whole day (23:59:59)
    closeDate.setDate(closeDate.getDate() + 1);

    if (now > closeDate) {
      throw new ForbiddenException('The voting period for this resolution has closed');
    }

    try {
      return await this.prisma.vote.upsert({
        where: {
          resolutionId_voterId: {
            resolutionId,
            voterId: user.id,
          },
        },
        update: { status },
        create: {
          resolutionId,
          voterId: user.id,
          status,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to cast vote for user ${user.id} on resolution ${resolutionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to cast vote');
    }
  }
}
