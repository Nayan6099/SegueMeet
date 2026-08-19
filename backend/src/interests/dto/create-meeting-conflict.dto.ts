import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ConflictAction } from '@prisma/client';

export class CreateMeetingConflictDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  agendaItemId?: string;

  @IsOptional()
  @IsUUID()
  interestId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ConflictAction)
  actionTaken?: ConflictAction;
}
