import { IsString, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';

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

  @IsOptional()
  @IsUUID()
  committeeId?: string;

  @IsOptional()
  @IsBoolean()
  committeeVisible?: boolean;
}
