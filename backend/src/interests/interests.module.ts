import { Module } from '@nestjs/common';
import { InterestsService } from './interests.service';
import { InterestsController, MeetingConflictsController } from './interests.controller';
import { OrganisationsModule } from '../organisations/organisations.module';

@Module({
  imports: [OrganisationsModule],
  controllers: [InterestsController, MeetingConflictsController],
  providers: [InterestsService],
  exports: [InterestsService],
})
export class InterestsModule {}
