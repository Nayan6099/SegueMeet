import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
  BadRequestException,
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
        action: 'annual_plan.created',
        entityType: 'AnnualPlan',
        entityId: plan.id,
      });

      return plan;
    } catch (error) {
      this.logger.error(`Failed to create annual plan`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to create annual plan');
    }
  }

  async deleteAnnualPlan(id: string, user: AuthenticatedUser) {
    const plan = await this.prisma.annualPlan.findUnique({ where: { id } });
    if (!plan) throw new BadRequestException('Plan not found');

    await this.organisationsService.requireRole(
      plan.organisationId,
      user.id,
      CAN_MANAGE_WORK_PLAN
    );

    try {
      await this.prisma.annualPlan.delete({ where: { id } });

      this.auditService.log({
        organisationId: plan.organisationId,
        actorId: user.id,
        action: 'annual_plan.deleted',
        entityType: 'AnnualPlan',
        entityId: id,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete annual plan`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to delete annual plan');
    }
  }


  async createPlanItem(
    planId: string,
    data: { title: string; description?: string; month: number; status?: string },
    user: AuthenticatedUser
  ) {
    const plan = await this.prisma.annualPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Annual plan not found');

    await this.organisationsService.requireRole(
      plan.organisationId,
      user.id,
      CAN_MANAGE_WORK_PLAN
    );

    try {
      const item = await this.prisma.planItem.create({
        data: {
          annualPlanId: planId,
          title: data.title,
          description: data.description,
          month: data.month,
          status: data.status || 'TODO',
        },
      });

      this.auditService.log({
        organisationId: plan.organisationId,
        actorId: user.id,
        action: 'annual_plan.item.created',
        entityType: 'AnnualPlanItem',
        entityId: item.id,
        payload: { title: data.title },
      });

      return item;
    } catch (error) {
      this.logger.error(`Failed to create plan item for plan ${planId}`, error);
      throw new InternalServerErrorException('Failed to create plan item');
    }
  }

  async updatePlanItem(
    planId: string,
    itemId: string,
    data: { title?: string; description?: string; month?: number; status?: string },
    user: AuthenticatedUser
  ) {
    const plan = await this.prisma.annualPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Annual plan not found');

    await this.organisationsService.requireRole(
      plan.organisationId,
      user.id,
      CAN_MANAGE_WORK_PLAN
    );

    try {
      const updated = await this.prisma.planItem.update({
        where: { id: itemId, annualPlanId: planId },
        data,
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update plan item ${itemId}`, error);
      throw new InternalServerErrorException('Failed to update plan item');
    }
  }

  async deletePlanItem(planId: string, itemId: string, user: AuthenticatedUser) {
    const plan = await this.prisma.annualPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Annual plan not found');

    await this.organisationsService.requireRole(
      plan.organisationId,
      user.id,
      CAN_MANAGE_WORK_PLAN
    );

    try {
      await this.prisma.planItem.delete({
        where: { id: itemId, annualPlanId: planId },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete plan item ${itemId}`, error);
      throw new InternalServerErrorException('Failed to delete plan item');
    }
  }
}
