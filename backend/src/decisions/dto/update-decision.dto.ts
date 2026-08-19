import { IsOptional, IsString, IsDateString } from 'class-validator';

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
}
