import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ActionItemStatus } from '@prisma/client';

export class UpdateActionItemDto {
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * UUID of an existing User to (re-)assign the action item to.
   * Must belong to the same organisation as the meeting.
   * Set to null in JSON to explicitly unassign.
   */
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  /**
   * ISO date string YYYY-MM-DD.
   */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dueDate must be in YYYY-MM-DD format',
  })
  dueDate?: string;

  @IsOptional()
  @IsEnum(ActionItemStatus)
  status?: ActionItemStatus;
}
