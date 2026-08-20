import { IsOptional, IsString, IsDateString, IsUUID, IsBoolean, IsEnum } from 'class-validator';
import { DecisionStatus } from '@prisma/client';

export class UpdateDecisionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string; // ISO date YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  votingEndsAt?: string; // ISO datetime

  @IsOptional()
  @IsEnum(DecisionStatus)
  status?: DecisionStatus;

  @IsOptional()
  @IsUUID()
  committeeId?: string | null;

  @IsOptional()
  @IsBoolean()
  committeeVisible?: boolean;
}
