import { Module } from '@nestjs/common';
import { AnnualPlanService } from './annual-plan.service';
import { AnnualPlanController } from './annual-plan.controller';
import { OrganisationsModule } from '../organisations/organisations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [OrganisationsModule, AuditModule],
  controllers: [AnnualPlanController],
  providers: [AnnualPlanService],
  exports: [AnnualPlanService],
})
export class AnnualPlanModule {}
