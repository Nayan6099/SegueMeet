import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateInterestDto } from './dto/create-interest.dto';

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
}

