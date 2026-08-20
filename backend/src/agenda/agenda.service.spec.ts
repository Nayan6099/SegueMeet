import { Test, TestingModule } from '@nestjs/testing';
import { AgendaService } from './agenda.service';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AgendaItemPurpose } from '@prisma/client';

describe('AgendaService', () => {
  let service: AgendaService;
  let prismaService: any;
  let organisationsService: any;
  let auditService: any;

  beforeEach(async () => {
    prismaService = {
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prismaService)),
      agendaSection: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      agendaItem: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      meeting: { findUnique: jest.fn() },
      planItem: { findUnique: jest.fn(), delete: jest.fn(), update: jest.fn() },
      agendaItemAccess: { deleteMany: jest.fn(), createMany: jest.fn() }
    };

    organisationsService = {
      requireRole: jest.fn(),
      requireMembership: jest.fn(),
    };

    auditService = {
      log: jest.fn(),
      logTx: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaService,
        { provide: PrismaService, useValue: prismaService },
        { provide: OrganisationsService, useValue: organisationsService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AgendaService>(AgendaService);
  });

  describe('createItem (PlanItem Linking)', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const section = {
      id: 'section-1',
      meetingId: 'meeting-1',
      meeting: { id: 'meeting-1', organisationId: 'org-1', agendaStatus: 'DRAFT' }
    };

    beforeEach(() => {
      prismaService.agendaSection.findUnique.mockResolvedValue(section);
      organisationsService.requireRole.mockResolvedValue({ id: 'member-1' });
    });

    it('should successfully link a valid PlanItem', async () => {
      prismaService.planItem.findUnique.mockResolvedValue({
        id: 'plan-item-1',
        annualPlan: { organisationId: 'org-1' }
      });
      prismaService.agendaItem.findFirst.mockResolvedValue(null);
      prismaService.agendaItem.create.mockResolvedValue({ id: 'item-1', planItemId: 'plan-item-1' });

      const result = await service.createItem('section-1', { title: 'Test', planItemId: 'plan-item-1' }, mockUser);
      expect(result).toBeDefined();
      expect(prismaService.agendaItem.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ planItemId: 'plan-item-1' })
      }));
    });

    it('should allow linking the same PlanItem in a different meeting', async () => {
      prismaService.planItem.findUnique.mockResolvedValue({
        id: 'plan-item-1',
        annualPlan: { organisationId: 'org-1' }
      });
      prismaService.agendaItem.findFirst.mockResolvedValue(null);
      prismaService.agendaItem.create.mockResolvedValue({ id: 'item-1', planItemId: 'plan-item-1' });

      const result = await service.createItem('section-1', { title: 'Test', planItemId: 'plan-item-1' }, mockUser);
      expect(result).toBeDefined();
    });

    it('should reject a duplicate link within the same meeting', async () => {
      prismaService.planItem.findUnique.mockResolvedValue({
        id: 'plan-item-1',
        annualPlan: { organisationId: 'org-1' }
      });
      prismaService.agendaItem.findFirst.mockResolvedValue({ id: 'existing-item-1' });

      await expect(service.createItem('section-1', { title: 'Test', planItemId: 'plan-item-1' }, mockUser))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject cross-tenant link', async () => {
      prismaService.planItem.findUnique.mockResolvedValue({
        id: 'plan-item-1',
        annualPlan: { organisationId: 'diff-org-2' }
      });

      await expect(service.createItem('section-1', { title: 'Test', planItemId: 'plan-item-1' }, mockUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should enforce unauthorized link rejection (via requireRole)', async () => {
      organisationsService.requireRole.mockRejectedValue(new ForbiddenException());
      
      await expect(service.createItem('section-1', { title: 'Test', planItemId: 'plan-item-1' }, mockUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateItem (PlanItem Unlinking)', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const item = {
      id: 'item-1',
      planItemId: 'plan-item-1',
      section: {
        meeting: { id: 'meeting-1', organisationId: 'org-1', agendaStatus: 'DRAFT' }
      }
    };

    beforeEach(() => {
      prismaService.agendaItem.findUnique.mockResolvedValue(item);
      organisationsService.requireRole.mockResolvedValue({ id: 'member-1' });
    });

    it('should unlink successfully by passing planItemId: null', async () => {
      prismaService.agendaItem.update.mockResolvedValue({ id: 'item-1', planItemId: null });

      const result = await service.updateItem('item-1', { planItemId: null }, mockUser);
      expect(result).toBeDefined();
      expect(prismaService.agendaItem.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ planItemId: null })
      }));
      expect(prismaService.planItem.delete).not.toHaveBeenCalled();
      expect(prismaService.planItem.update).not.toHaveBeenCalled();
    });
  });
});
