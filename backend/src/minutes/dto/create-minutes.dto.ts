import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MinutesStatus } from '@prisma/client';

export class CreateMinutesDto {
  /**
   * Optional initial status — defaults to NOT_STARTED if omitted.
   */
  @IsOptional()
  @IsEnum(MinutesStatus)
  status?: MinutesStatus;

  /**
   * Free-form content field (rich text / plain text / JSON from editor).
   * Optional at creation time.
   */
  @IsOptional()
  @IsString()
  content?: string;
}
