import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { OrganisationsModule } from '../organisations/organisations.module';

/**
 * NotificationsModule — handles reading and managing user notification records.
 *
 * Notification CREATION is deferred to a later integration phase.
 * This module provides the storage and user-facing read/manage API only.
 *
 * Depends on:
 *  - DatabaseModule (global) for PrismaService
 *  - OrganisationsModule for requireMembership() tenant isolation
 */
@Module({
  imports: [OrganisationsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
