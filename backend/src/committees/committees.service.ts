import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditService } from '../audit/audit.service';
import { CAN_MANAGE_COMMITTEES } from '../common/auth/roles.constants';

@Injectable()
export class CommitteesService {
  private readonly logger = new Logger(CommitteesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
  ) {}

  async getCommittees(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      return await this.prisma.committee.findMany({
        where: { organisationId },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch committees for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch committees');
    }
  }

  async createCommittee(dto: CreateCommitteeDto, user: AuthenticatedUser) {
    await this.organisationsService.requireRole(
      dto.organisationId,
      user.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const committee = await this.prisma.committee.create({
        data: {
          name: dto.name,
          description: dto.description,
          organisationId: dto.organisationId,
          members: {
            create: {
              userId: user.id,
              role: 'CHAIR',
            }
          }
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      this.auditService.log({
        organisationId: dto.organisationId,
        actorId: user.id,
        action: 'committee.created',
        entityType: 'Committee',
        entityId: committee.id,
        payload: { name: dto.name },
      });

      return committee;
    } catch (error) {
      this.logger.error(
        `Failed to create committee in organisation ${dto.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create committee');
    }
  }
}
