import { PartialType } from '@nestjs/mapped-types';
import { CreateMeetingConflictDto } from './create-meeting-conflict.dto';

export class UpdateMeetingConflictDto extends PartialType(CreateMeetingConflictDto) {}
