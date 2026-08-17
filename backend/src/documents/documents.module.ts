import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { OrganisationsModule } from '../organisations/organisations.module';
import { AuditModule } from '../audit/audit.module';

/**
 * DocumentsModule — handles document metadata CRUD.
 *
 * Note: this module stores document metadata only.
 * Actual file upload/storage is handled externally (e.g. S3, local disk);
 * the storagePath field records the reference.
 *
 * Depends on:
 *  - DatabaseModule (global) for PrismaService
 *  - OrganisationsModule for requireMembership() tenant isolation
 */
@Module({
  imports: [OrganisationsModule, AuditModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
