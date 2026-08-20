import { Test, TestingModule } from '@nestjs/testing';
import { BoardPackService } from './board-pack.service';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('BoardPackService', () => {
  let service: BoardPackService;
  let prisma: PrismaService;
  let orgService: OrganisationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardPackService,
        {
          provide: PrismaService,
          useValue: {
            meeting: {
              findUnique: jest.fn(),
            },
            boardPack: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            meetingAttendee: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            organisation: {
              findUnique: jest.fn(),
            }
          },
        },
        {
          provide: OrganisationsService,
          useValue: {
            requireMembership: jest.fn(),
            requireRole: jest.fn(),
            hasAnyRole: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendBoardPackPublishedEmail: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<BoardPackService>(BoardPackService);
    prisma = module.get<PrismaService>(PrismaService);
    orgService = module.get<OrganisationsService>(OrganisationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('authorisedMeeting', () => {
    it('should throw NotFound if meeting does not exist', async () => {
      jest.spyOn(prisma.meeting, 'findUnique').mockResolvedValue(null);
      await expect(service['authorisedMeeting']('m1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw Forbidden if user is not a manager and not an attendee', async () => {
      jest.spyOn(prisma.meeting, 'findUnique').mockResolvedValue({ id: 'm1', organisationId: 'o1' } as any);
      jest.spyOn(orgService, 'requireMembership').mockResolvedValue(true as any);
      jest.spyOn(orgService, 'hasAnyRole').mockResolvedValue(false);
      jest.spyOn(prisma.meetingAttendee, 'findFirst').mockResolvedValue(null);

      await expect(service['authorisedMeeting']('m1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should return meeting if user is attendee', async () => {
      const mockMeeting = { id: 'm1', organisationId: 'o1' };
      jest.spyOn(prisma.meeting, 'findUnique').mockResolvedValue(mockMeeting as any);
      jest.spyOn(orgService, 'requireMembership').mockResolvedValue(true as any);
      jest.spyOn(orgService, 'hasAnyRole').mockResolvedValue(false);
      jest.spyOn(prisma.meetingAttendee, 'findFirst').mockResolvedValue({ id: 'a1' } as any);

      const result = await service['authorisedMeeting']('m1', 'u1');
      expect(result).toEqual(mockMeeting);
    });
  });

  describe('getBoardPackData', () => {
    it('should map data correctly and not throw if minutes/documents are missing', async () => {
      const mockMeeting = { 
        id: 'm1', 
        organisationId: 'o1',
        title: 'Test',
        agendaSections: [],
        documents: [],
        boardPacks: []
      };
      
      jest.spyOn(service as any, 'authorisedMeeting').mockResolvedValue(mockMeeting);
      jest.spyOn(prisma.meeting, 'findUnique').mockResolvedValue(mockMeeting as any);

      const result = await service.getBoardPackData('m1', { id: 'u1' } as any);
      
      expect(result.meeting.title).toBe('Test');
      expect(result.minutes).toBeNull();
      expect(result.documents).toEqual([]);
      expect(result.boardPack).toBeNull();
    });
  });
});
