import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardMetrics(
    @Query('organisationId') organisationId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!organisationId) throw new BadRequestException('organisationId is required');
    return this.analyticsService.getDashboardMetrics(organisationId, user);
  }

  @Get('engagement')
  getEngagementReport(
    @Query('organisationId') organisationId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!organisationId) throw new BadRequestException('organisationId is required');
    return this.analyticsService.getEngagementReport(organisationId, user);
  }

  @Get('health')
  getGovernanceHealth(
    @Query('organisationId') organisationId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!organisationId) throw new BadRequestException('organisationId is required');
    return this.analyticsService.getGovernanceHealth(organisationId, user);
  }
}
