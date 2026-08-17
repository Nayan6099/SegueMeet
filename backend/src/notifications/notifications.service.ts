import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Finds a notification by ID and verifies that it belongs to the
   * requesting user. Throws 404 if not found, 403 if owned by another user.
   */
  private async resolveOwnNotification(
    notificationId: string,
    userId: string,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    if (notification.recipientId !== userId) {
      // Return 403 — do not expose that the notification exists but belongs
      // to another user (avoids resource discovery).
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    return notification;
  }

  // ─────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────

  /**
   * GET /notifications
   *
   * Returns only notifications where recipientId === currentUser.id.
   * recipientId is sourced entirely from @CurrentUser() — never from the client.
   *
   * If organisationId is provided, membership is validated before filtering.
   */
  async getNotifications(
    query: QueryNotificationsDto,
    user: AuthenticatedUser,
  ) {
    // If org scope is requested, validate membership before using it in the query
    if (query.organisationId) {
      await this.organisationsService.requireMembership(
        query.organisationId,
        user.id,
      );
    }

    try {
      return await this.prisma.notification.findMany({
        where: {
          // User ownership — always enforced from server-side identity
          recipientId: user.id,
          // Optional filters — only applied after ownership is locked in
          ...(query.organisationId && {
            organisationId: query.organisationId,
          }),
          ...(query.isRead !== undefined && { isRead: query.isRead }),
          ...(query.type && { type: query.type }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch notifications for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to fetch notifications',
      );
    }
  }

  // ─────────────────────────────────────────────
  // GET SINGLE
  // ─────────────────────────────────────────────

  /**
   * GET /notifications/:id
   *
   * Ownership enforced: notification.recipientId must match currentUser.id.
   * Organisation membership also validated for org-scoped isolation.
   */
  async getNotificationById(id: string, user: AuthenticatedUser) {
    const notification = await this.resolveOwnNotification(id, user.id);

    // Validate organisation membership even for read access
    await this.organisationsService.requireMembership(
      notification.organisationId,
      user.id,
    );

    return notification;
  }

  // ─────────────────────────────────────────────
  // MARK AS READ
  // ─────────────────────────────────────────────

  /**
   * PATCH /notifications/:id/read
   *
   * Sets isRead = true for a single notification.
   * Only the recipient can perform this action.
   * Only isRead is updated — all other fields remain immutable through this endpoint.
   */
  async markAsRead(id: string, user: AuthenticatedUser) {
    const notification = await this.resolveOwnNotification(id, user.id);

    await this.organisationsService.requireMembership(
      notification.organisationId,
      user.id,
    );

    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${id} as read for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to mark notification as read',
      );
    }
  }

  // ─────────────────────────────────────────────
  // MARK ALL AS READ
  // ─────────────────────────────────────────────

  /**
   * PATCH /notifications/read-all
   *
   * Sets isRead = true for all notifications belonging to the current user.
   * If organisationId is provided in query, only affects that org's notifications
   * (membership is validated before use).
   *
   * Returns the count of updated records.
   */
  async markAllAsRead(
    user: AuthenticatedUser,
    organisationId?: string,
  ): Promise<{ updated: number }> {
    if (organisationId) {
      await this.organisationsService.requireMembership(
        organisationId,
        user.id,
      );
    }

    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          // User ownership is the primary constraint — always enforced
          recipientId: user.id,
          isRead: false,
          ...(organisationId && { organisationId }),
        },
        data: { isRead: true },
      });
      return { updated: result.count };
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to mark all notifications as read',
      );
    }
  }
}
