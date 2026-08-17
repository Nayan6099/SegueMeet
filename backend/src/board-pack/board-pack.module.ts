import { Module } from '@nestjs/common';
import { BoardPackController } from './board-pack.controller';
import { BoardPackService } from './board-pack.service';
import { OrganisationsModule } from '../organisations/organisations.module';

/**
 * BoardPackModule — generates meeting board packs (JSON + PDF).
 *
 * Aggregates data from existing Meeting, AgendaSection, AgendaItem,
 * Minutes, MinutesActionItem, and Document Prisma models.
 * NO schema changes were required for this feature.
 *
 * Depends on:
 *  - DatabaseModule (global) for PrismaService
 *  - OrganisationsModule for requireMembership() tenant isolation
 */
@Module({
  imports: [OrganisationsModule],
  controllers: [BoardPackController],
  providers: [BoardPackService],
})
export class BoardPackModule {}
