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
      const plan = await this.prisma.$transaction(async (tx) => {
        const p = await tx.annualPlan.upsert({
          where: { organisationId_year: { organisationId, year } },
          create: { organisationId, year },
          update: {},
          include: { items: { orderBy: { month: 'asc' } } },
        });

        await this.auditService.logTx(tx, {
          organisationId,
          actorId: user.id,
          action: 'annual_plan.created',
          entityType: 'AnnualPlan',
          entityId: p.id,
        });

        return p;
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
      await this.prisma.$transaction(async (tx) => {
        await tx.annualPlan.delete({ where: { id } });

        await this.auditService.logTx(tx, {
          organisationId: plan.organisationId,
          actorId: user.id,
          action: 'annual_plan.deleted',
          entityType: 'AnnualPlan',
          entityId: id,
        });
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
      const item = await this.prisma.$transaction(async (tx) => {
        const i = await tx.planItem.create({
          data: {
            annualPlanId: planId,
            title: data.title,
            description: data.description,
            month: data.month,
            status: (data.status as any) || 'TODO',
          },
        });

        await this.auditService.logTx(tx, {
          organisationId: plan.organisationId,
          actorId: user.id,
          action: 'annual_plan.item_added',
          entityType: 'PlanItem',
          entityId: i.id,
        });

        return i;
      });

      return item;
    } catch (error) {
      this.logger.error(`Failed to create plan item`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to create plan item');
    }
  }

  async createPlanItemsBulk(
    planId: string,
    items: Array<{ title: string; description?: string; month: number; status?: string }>,
    user: AuthenticatedUser,
  ) {
    const plan = await this.prisma.annualPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');

    await this.organisationsService.requireRole(
      plan.organisationId,
      user.id,
      CAN_MANAGE_WORK_PLAN
    );

    try {
      const dataToInsert = items.map(item => ({
        annualPlanId: planId,
        title: item.title,
        description: item.description,
        month: item.month,
        status: (item.status as any) || 'TODO',
      }));

      const result = await this.prisma.$transaction(async (tx) => {
        const r = await tx.planItem.createMany({
          data: dataToInsert,
        });

        await this.auditService.logTx(tx, {
          organisationId: plan.organisationId,
          actorId: user.id,
          action: 'annual_plan.items_bulk_added',
          entityType: 'AnnualPlan',
          entityId: plan.id,
          payload: { count: r.count }
        });

        return r;
      });

      return { count: result.count };
    } catch (error) {
      this.logger.error(`Failed to bulk create plan items`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to bulk create plan items');
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
