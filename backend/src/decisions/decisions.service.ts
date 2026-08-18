import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class DecisionsService {
  private readonly logger = new Logger(DecisionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async getDecisions(organisationId: string, skipQuery: string, takeQuery: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      const skip = skipQuery ? Number(skipQuery) : 0;
      const take = takeQuery ? Number(takeQuery) : 50;

      const [data, total] = await Promise.all([
        this.prisma.decision.findMany({
          where: { organisationId },
          include: {
            meeting: { select: { id: true, title: true } },
          },
          orderBy: { date: 'desc' },
          skip,
          take,
        }),
        this.prisma.decision.count({ where: { organisationId } }),
      ]);

      return { data, total, skip, take };
    } catch (error) {
      this.logger.error(
        `Failed to fetch decisions for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch decisions');
    }
  }
}
