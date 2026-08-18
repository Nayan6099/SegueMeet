import { Module, forwardRef } from '@nestjs/common';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';
import { AuditModule } from '../audit/audit.module';

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
  imports: [forwardRef(() => AuditModule)],
  controllers: [OrganisationsController],
  providers: [OrganisationsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
