import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CAN_MANAGE_MEETINGS, CAN_MANAGE_DOCUMENTS } from '../common/auth/roles.constants';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async globalSearch(q: string, organisationId: string, user: AuthenticatedUser) {
    // 1. Verify tenant membership
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      const query = q.trim();

      if (!query) {
        return { meetings: [], documents: [], people: [] };
      }

      const isManagerForMeetings = await this.organisationsService.hasAnyRole(
        organisationId,
        user.id,
        CAN_MANAGE_MEETINGS
      );

      const isManagerForDocuments = await this.organisationsService.hasAnyRole(
        organisationId,
        user.id,
        CAN_MANAGE_DOCUMENTS
      );

      const meetingsWhere: any = {
        organisationId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
        ],
      };

      if (!isManagerForMeetings) {
        meetingsWhere.attendees = {
          some: { userId: user.id }
        };
      }

      const documentsWhere: any = {
        organisationId,
        OR: [
          { originalName: { contains: query, mode: 'insensitive' } },
        ],
      };

      if (!isManagerForDocuments) {
        documentsWhere.AND = [
          {
            OR: [
              { uploadedById: user.id },
              { accessRules: { some: { userId: user.id } } },
              {
                accessRules: { none: {} },
                meetingId: null,
                agendaItemId: null,
              },
              {
                accessRules: { none: {} },
                meeting: {
                  attendees: { some: { userId: user.id } }
                }
              },
              {
                accessRules: { none: {} },
                agendaItem: {
                  section: {
                    meeting: {
                      attendees: { some: { userId: user.id } }
                    }
                  }
                }
              }
            ]
          }
        ];
      }

      // 2. Perform concurrent queries
      const [meetings, documents, people] = await Promise.all([
        // Search Meetings
        this.prisma.meeting.findMany({
          where: meetingsWhere,
          orderBy: { date: 'desc' },
          take: 20,
        }),
        
        // Search Documents
        this.prisma.document.findMany({
          where: documentsWhere,
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        
        // Search People (Organisation Members joined with User)
        this.prisma.organisationMember.findMany({
          where: {
            organisationId,
            user: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          take: 20,
        }),
      ]);

      return {
        meetings,
        documents,
        people,
      };
    } catch (error) {
      this.logger.error(
        `Search failed for organisation ${organisationId} with query "${q}"`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to perform search');
    }
  }
}
