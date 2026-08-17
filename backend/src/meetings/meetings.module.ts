import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { OrganisationsModule } from '../organisations/organisations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [OrganisationsModule, AuditModule],
  controllers: [MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
