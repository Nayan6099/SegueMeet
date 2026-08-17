import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { OrganisationsModule } from '../organisations/organisations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [OrganisationsModule, AuditModule],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
