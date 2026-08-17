import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class QueryNotificationsDto {
  /**
   * Optional: scope notifications to a specific organisation.
   * When supplied, membership is verified via requireMembership().
   */
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  /**
   * Optional: filter by read state.
   * true  = only read notifications
   * false = only unread notifications
   */
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  /**
   * Optional: filter by notification type.
   */
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
