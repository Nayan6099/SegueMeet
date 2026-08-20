import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/common/database/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { OrganisationsService } from '../src/organisations/organisations.service';
import { MailService } from '../src/mail/mail.service';
import { ConfigModule } from '@nestjs/config';

describe('Audit Reliability & Transaction Integrity (e2e)', () => {
  let prisma: PrismaService;
  let auditService: AuditService;
  let organisationsService: OrganisationsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        PrismaService,
        AuditService,
        OrganisationsService,
        {
          provide: MailService,
          useValue: { sendMemberAddedEmail: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    auditService = moduleFixture.get<AuditService>(AuditService);
    organisationsService = moduleFixture.get<OrganisationsService>(OrganisationsService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should rollback the database transaction if audit log fails', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-audit-${Date.now()}@example.com`,
        name: 'Audit Test User',
        passwordHash: 'dummy',
      },
    });

    const mockUser = { id: user.id, email: user.email, name: user.name };

    // Mock auditService.logTx to deliberately throw an error
    const originalLogTx = auditService.logTx;
    jest.spyOn(auditService, 'logTx').mockRejectedValue(new Error('Simulated Audit Failure'));

    const orgName = `Test Org ${Date.now()}`;

    // Attempt to create an organisation (which uses $transaction and calls logTx)
    await expect(
      organisationsService.create({ name: orgName }, mockUser as any)
    ).rejects.toThrow('Simulated Audit Failure');

    // Verify the transaction was rolled back: the organisation should NOT exist
    const org = await prisma.organisation.findFirst({
      where: { name: orgName },
    });

    expect(org).toBeNull(); // Must be null because of rollback

    // Restore the mock
    jest.restoreAllMocks();

    // Now test success case
    const org2Name = `Test Org Success ${Date.now()}`;
    const newOrg = await organisationsService.create({ name: org2Name }, mockUser as any);
    
    expect(newOrg).toBeDefined();
    expect(newOrg.name).toBe(org2Name);

    // Verify audit log was created
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: newOrg.id, action: 'organisation.created' },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog.organisationId).toBe(newOrg.id);
  });

  it('should not rollback if an external side effect fails outside the transaction', async () => {
    // In OrganisationsService.addMember, the email is sent AFTER the transaction.
    // If the email fails, the transaction should still be committed.
    
    const user1 = await prisma.user.create({
      data: {
        email: `test-org-admin-${Date.now()}@example.com`,
        name: 'Admin User',
        passwordHash: 'dummy',
      },
    });
    const user2 = await prisma.user.create({
      data: {
        email: `test-member-${Date.now()}@example.com`,
        name: 'Member User',
        passwordHash: 'dummy',
      },
    });

    const org = await organisationsService.create({ name: `Org for external failure test` }, user1 as any);

    // Mock MailService to throw an error
    const mailService = (organisationsService as any).mailService;
    jest.spyOn(mailService, 'sendMemberAddedEmail').mockRejectedValue(new Error('External Email Failure'));

    // Try to add user2 as a member
    const membership = await organisationsService.addMember(org.id, { email: user2.email, role: 'BOARD_MEMBER' as any }, user1 as any);

    expect(membership).toBeDefined();
    expect(membership.user.id).toBe(user2.id);

    // Verify membership actually exists in the DB (was not rolled back)
    const dbMembership = await prisma.organisationMember.findUnique({
      where: { organisationId_userId: { organisationId: org.id, userId: user2.id } },
    });

    expect(dbMembership).toBeDefined();
    
    // Verify audit log also exists
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: membership.id, action: 'organisation.member_added' },
    });
    expect(auditLog).toBeDefined();
    
    jest.restoreAllMocks();
  });
});
