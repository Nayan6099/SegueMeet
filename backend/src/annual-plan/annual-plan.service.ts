import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CAN_MANAGE_WORK_PLAN } from '../common/auth/roles.constants';

@Injectable()
export class AnnualPlanService {
  private readonly logger = new Logger(AnnualPlanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
  ) {}

  async getAnnualPlans(organisationId: string, year: number, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      return await this.prisma.annualPlan.findMany({
        where: { organisationId, year },
        include: {
          items: {
            orderBy: { month: 'asc' },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch annual plan for organisation ${organisationId} year ${year}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch annual plan');
    }
  }

  async createAnnualPlan(organisationId: string, year: number, user: AuthenticatedUser) {
    await this.organisationsService.requireRole(
      organisationId,
      user.id,
      CAN_MANAGE_WORK_PLAN
    );

    try {
      const plan = await this.prisma.annualPlan.upsert({
        where: { organisationId_year: { organisationId, year } },
        create: { organisationId, year },
        update: {},
        include: { items: { orderBy: { month: 'asc' } } },
      });

      this.auditService.log({
        organisationId,
        actorId: user.id,
        action: 'annual_plan.created_or_accessed',
        entityType: 'AnnualPlan',
        entityId: plan.id,
        payload: { year },
      });

      return plan;
    } catch (error) {
      this.logger.error(
        `Failed to create annual plan for organisation ${organisationId} year ${year}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create annual plan');
    }
  }
}
