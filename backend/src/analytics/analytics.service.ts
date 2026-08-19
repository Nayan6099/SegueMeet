import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CAN_VIEW_ANALYTICS } from '../common/auth/roles.constants';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async getDashboardMetrics(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireRole(organisationId, user.id, CAN_VIEW_ANALYTICS);

    const [totalMeetings, meetingsWithPacks, totalActionItems, completedActionItems, totalDecisions] = await Promise.all([
      this.prisma.meeting.count({ where: { organisationId } }),
      this.prisma.meeting.count({ 
        where: { organisationId, boardPacks: { some: {} } }
      }),
      this.prisma.minutesActionItem.count({
        where: { minutes: { meeting: { organisationId } } }
      }),
      this.prisma.minutesActionItem.count({
        where: { minutes: { meeting: { organisationId } }, status: 'COMPLETED' }
      }),
      this.prisma.decision.count({
        where: { meeting: { organisationId } }
      })
    ]);

    const boardPackPublicationRate = totalMeetings > 0 ? (meetingsWithPacks / totalMeetings) * 100 : 0;
    const actionItemCompletionRate = totalActionItems > 0 ? (completedActionItems / totalActionItems) * 100 : 0;

    return {
      totalMeetings,
      boardPackPublicationRate,
      actionItemCompletionRate,
      totalDecisions
    };
  }

  async getEngagementReport(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireRole(organisationId, user.id, CAN_VIEW_ANALYTICS);

    const attendees = await this.prisma.meetingAttendee.groupBy({
      by: ['rsvp'],
      where: { meeting: { organisationId } },
      _count: true
    });

    const engagement = {
      ATTENDING: 0,
      DECLINED: 0,
      TENTATIVE: 0,
      PENDING: 0
    };

    for (const group of attendees) {
      if (group.rsvp) {
        engagement[group.rsvp] = group._count;
      }
    }

    return engagement;
  }

  async getGovernanceHealth(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireRole(organisationId, user.id, CAN_VIEW_ANALYTICS);

    const now = new Date();

    const nowIsoStr = now.toISOString().split('T')[0];

    const [overdueActionItems, pendingMinutes, openConflicts] = await Promise.all([
      this.prisma.minutesActionItem.count({
        where: { 
          minutes: { meeting: { organisationId } },
          status: { not: 'COMPLETED' },
          dueDate: { lt: nowIsoStr }
        }
      }),
      this.prisma.minutes.count({
        where: {
          meeting: { organisationId },
          status: 'DRAFT'
        }
      }),
      this.prisma.meetingConflict.count({
        where: {
          meeting: { organisationId },
          actionTaken: 'NOTED' // Simple heuristic for open/unmitigated
        }
      })
    ]);

    return {
      overdueActionItems,
      pendingMinutes,
      openConflicts
    };
  }
}
