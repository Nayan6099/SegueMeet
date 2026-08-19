import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { differenceInDays } from 'date-fns';

@Injectable()
export class TenureCronService {
  private readonly logger = new Logger(TenureCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Runs daily at midnight to check for upcoming tenure end dates.
   * Sends notifications to the organisation's nominated tenure administrator
   * for members whose tenure is expiring in exactly 56 days (8 weeks) or 1 day.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkTenureExpirations() {
    this.logger.log('Running daily tenure expiration check...');
    const today = new Date();

    try {
      // Temporarily disabled since tenureEndDate was removed from schema
      return;
    } catch (error) {
      this.logger.error('Failed to run tenure expiration check', error);
    }
  }
}
