import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateDecisionDto {
  @IsUUID()
  organisationId: string;

  @IsOptional()
  @IsUUID()
  meetingId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string; // ISO date YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  votingEndsAt?: string; // ISO datetime
}
