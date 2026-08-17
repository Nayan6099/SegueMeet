import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MinutesStatus } from '@prisma/client';

export class UpdateMinutesDto {
  /**
   * Transition the Minutes to a new workflow status.
   * Must be one of the existing MinutesStatus enum values.
   */
  @IsOptional()
  @IsEnum(MinutesStatus)
  status?: MinutesStatus;

  /**
   * Update the free-form content body.
   */
  @IsOptional()
  @IsString()
  content?: string;
}
