import { Module, forwardRef } from '@nestjs/common';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';
import { AuditModule } from '../audit/audit.module';

import { NotificationsModule } from '../notifications/notifications.module';
import { TenureCronService } from './tenure-cron.service';

/**
 * OrganisationsModule handles organisation CRUD and member management.
 *
 * Depends on:
 *  - DatabaseModule (global) for PrismaService
 *  - AuthModule (imported in AppModule) for JwtAuthGuard
 *
 * OrganisationsService.requireMembership() is the reusable tenant-isolation
 * helper that future feature modules (Meetings, Agenda, etc.) should call or
 * replicate before accessing any org-scoped resource.
 */
@Module({
  imports: [forwardRef(() => AuditModule), forwardRef(() => NotificationsModule)],
  controllers: [OrganisationsController],
  providers: [OrganisationsService, TenureCronService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
