import {
  Controller,
  Get,
  Post,
  Body,
  Query,
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
}
