import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { OrganisationsModule } from '../organisations/organisations.module';

@Module({
  imports: [OrganisationsModule],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
