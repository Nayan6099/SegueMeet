import { Module } from '@nestjs/common';
import { MinutesController } from './minutes.controller';
import { MinutesService } from './minutes.service';
import { OrganisationsModule } from '../organisations/organisations.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * MinutesModule — handles Meeting Minutes and MinutesActionItems.
 *
 * Depends on:
 *  - DatabaseModule (global) for PrismaService
 *  - OrganisationsModule for the tenant-isolation helper (requireMembership)
 */
@Module({
  imports: [OrganisationsModule, AuditModule, NotificationsModule],
  controllers: [MinutesController],
  providers: [MinutesService],
})
export class MinutesModule {}
