import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditService } from '../audit/audit.service';
import { CAN_MANAGE_COMMITTEES } from '../common/auth/roles.constants';

@Injectable()
export class CommitteesService {
  private readonly logger = new Logger(CommitteesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
  ) {}

  async getCommittees(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      return await this.prisma.committee.findMany({
        where: { organisationId },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch committees for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch committees');
    }
  }

  async createCommittee(dto: CreateCommitteeDto, user: AuthenticatedUser) {
    await this.organisationsService.requireRole(
      dto.organisationId,
      user.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const committee = await this.prisma.committee.create({
        data: {
          name: dto.name,
          description: dto.description,
          organisationId: dto.organisationId,
          members: {
            create: {
              userId: user.id,
              role: 'CHAIR',
            }
          }
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      this.auditService.log({
        organisationId: dto.organisationId,
        actorId: user.id,
        action: 'committee.created',
        entityType: 'Committee',
        entityId: committee.id,
        payload: { name: dto.name },
      });

      return committee;
    } catch (error) {
      this.logger.error(
        `Failed to create committee in organisation ${dto.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create committee');
    }
  }

  async updateCommittee(
    id: string,
    data: { name?: string; description?: string },
    user: AuthenticatedUser
  ) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      user.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const updated = await this.prisma.committee.update({
        where: { id },
        data,
      });

      this.auditService.log({
        organisationId: committee.organisationId,
        actorId: user.id,
        action: 'committee.updated',
        entityType: 'Committee',
        entityId: id,
        payload: data,
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update committee ${id}`, error);
      throw new InternalServerErrorException('Failed to update committee');
    }
  }

  async deleteCommittee(id: string, user: AuthenticatedUser) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      user.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      await this.prisma.committee.delete({ where: { id } });

      this.auditService.log({
        organisationId: committee.organisationId,
        actorId: user.id,
        action: 'committee.deleted',
        entityType: 'Committee',
        entityId: id,
        payload: { name: committee.name },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete committee ${id}`, error);
      throw new InternalServerErrorException('Failed to delete committee');
    }
  }

  async addCommitteeMember(
    id: string,
    userId: string,
    role: string,
    currentUser: AuthenticatedUser
  ) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      currentUser.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const member = await this.prisma.committeeMember.create({
        data: {
          committeeId: id,
          userId,
          role,
        },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      });

      this.auditService.log({
        organisationId: committee.organisationId,
        actorId: currentUser.id,
        action: 'committee.member_added',
        entityType: 'Committee',
        entityId: id,
        payload: { addedUserId: userId, role },
      });

      return member;
    } catch (error) {
      this.logger.error(`Failed to add member to committee ${id}`, error);
      throw new InternalServerErrorException('Failed to add member to committee');
    }
  }

  async updateCommitteeMemberRole(
    id: string,
    userId: string,
    role: string,
    currentUser: AuthenticatedUser
  ) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      currentUser.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const member = await this.prisma.committeeMember.update({
        where: { committeeId_userId: { committeeId: id, userId } },
        data: { role },
      });

      this.auditService.log({
        organisationId: committee.organisationId,
        actorId: currentUser.id,
        action: 'committee.member_role_updated',
        entityType: 'Committee',
        entityId: id,
        payload: { updatedUserId: userId, role },
      });

      return member;
    } catch (error) {
      this.logger.error(`Failed to update member role in committee ${id}`, error);
      throw new InternalServerErrorException('Failed to update member role');
    }
  }

  async removeCommitteeMember(
    id: string,
    userId: string,
    currentUser: AuthenticatedUser
  ) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      currentUser.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      await this.prisma.committeeMember.delete({
        where: { committeeId_userId: { committeeId: id, userId } },
      });

      this.auditService.log({
        organisationId: committee.organisationId,
        actorId: currentUser.id,
        action: 'committee.member_removed',
        entityType: 'Committee',
        entityId: id,
        payload: { removedUserId: userId },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to remove member from committee ${id}`, error);
      throw new InternalServerErrorException('Failed to remove member from committee');
    }
  }
}
