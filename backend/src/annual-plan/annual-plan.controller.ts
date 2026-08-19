import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AnnualPlanService } from './annual-plan.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('annual-plans')
export class AnnualPlanController {
  constructor(private readonly annualPlanService: AnnualPlanService) {}

  @Get()
  getAnnualPlans(
    @Query('organisationId') organisationId: string,
    @Query('year') year: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!organisationId) {
      throw new BadRequestException('organisationId query parameter is required');
    }
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.annualPlanService.getAnnualPlans(organisationId, targetYear, user);
  }

  @Post()
  createAnnualPlan(
    @Body() body: { organisationId: string; year: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.organisationId) {
      throw new BadRequestException('organisationId is required');
    }
    return this.annualPlanService.createAnnualPlan(body.organisationId, body.year || new Date().getFullYear(), user);
  }

  @Delete(':id')
  deleteAnnualPlan(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.annualPlanService.deleteAnnualPlan(id, user);
  }

  @Post(':id/items')
  createPlanItem(
    @Param('id') id: string,
    @Body() body: { title: string; description?: string; month: number; status?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.title || !body.month) {
      throw new BadRequestException('title and month are required');
    }
    return this.annualPlanService.createPlanItem(id, body, user);
  }

  @Patch(':id/items/:itemId')
  updatePlanItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { title?: string; description?: string; month?: number; status?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.annualPlanService.updatePlanItem(id, itemId, body, user);
  }

  @Delete(':id/items/:itemId')
  deletePlanItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.annualPlanService.deletePlanItem(id, itemId, user);
  }
}
