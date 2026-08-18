import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { ActionItemStatus } from '@prisma/client';

export class CreateActionItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  /**
   * UUID of an existing User to assign the action item to.
   * Must belong to the same organisation as the meeting.
   * Leave null/undefined to create an unassigned action item.
   */
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  /**
   * ISO date string YYYY-MM-DD.
   */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dueDate must be in YYYY-MM-DD format',
  })
  dueDate?: string;

  /**
   * Initial status — defaults to OPEN if omitted.
   */
  @IsOptional()
  @IsEnum(ActionItemStatus)
  status?: ActionItemStatus;
}
