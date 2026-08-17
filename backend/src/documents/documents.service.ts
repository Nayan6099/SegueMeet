import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrganisationRole } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';

/** Roles allowed to create, update, or delete documents. */
const EDIT_ROLES: OrganisationRole[] = [
  OrganisationRole.BOARD_ADMIN,
  OrganisationRole.CHAIR,
  OrganisationRole.SECRETARY,
];

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Resolves a Document by ID, throws 404 if missing.
   * NOTE: the Document model has no updatedAt — only createdAt.
   */
  private async resolveDocument(documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  /**
   * Validates that a meetingId belongs to the specified organisation.
   * Throws 404 if meeting is not found, 403 if it belongs to another org.
   */
  private async validateMeetingBelongsToOrg(
    meetingId: string,
    organisationId: string,
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, organisationId: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.organisationId !== organisationId) {
      throw new ForbiddenException(
        'The specified meeting does not belong to this organisation',
      );
    }
  }

  /**
   * Validates that an agendaItemId traces back to the specified organisation.
   * Chain: AgendaItem → AgendaSection → Meeting → Organisation
   * Throws 404 if any segment is missing, 403 if cross-tenant.
   */
  private async validateAgendaItemBelongsToOrg(
    agendaItemId: string,
    organisationId: string,
  ) {
    const item = await this.prisma.agendaItem.findUnique({
      where: { id: agendaItemId },
      include: {
        section: {
          include: {
            meeting: { select: { organisationId: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Agenda item not found');
    if (item.section.meeting.organisationId !== organisationId) {
      throw new ForbiddenException(
        'The specified agenda item does not belong to this organisation',
      );
    }
  }

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────

  /**
   * POST /documents
   *
   * Tenant isolation:
   *   1. requireMembership validates organisationId against the authenticated user.
   *   2. If meetingId is provided, its meeting.organisationId must match.
   *   3. If agendaItemId is provided, its chain must resolve to the same org.
   */
  async createDocument(dto: CreateDocumentDto, user: AuthenticatedUser) {
    const membership = await this.organisationsService.requireMembership(
      dto.organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to upload documents',
      );
    }

    // Validate optional parent associations belong to the same tenant
    if (dto.meetingId) {
      await this.validateMeetingBelongsToOrg(dto.meetingId, dto.organisationId);
    }
    if (dto.agendaItemId) {
      await this.validateAgendaItemBelongsToOrg(
        dto.agendaItemId,
        dto.organisationId,
      );
    }

    try {
      return await this.prisma.document.create({
        data: {
          organisationId: dto.organisationId,
          fileName: dto.fileName,
          originalName: dto.originalName,
          mimeType: dto.mimeType,
          sizeBytes: dto.sizeBytes,
          storagePath: dto.storagePath,
          meetingId: dto.meetingId ?? null,
          agendaItemId: dto.agendaItemId ?? null,
          uploadedById: user.id,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create document for org ${dto.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create document');
    }
  }

  // ─────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────

  /**
   * GET /documents
   *
   * Tenant isolation: organisationId in query is validated against membership.
   * Optional meetingId/agendaItemId filters are passed through to Prisma —
   * cross-tenant records cannot appear because the WHERE clause is always
   * scoped to the verified organisationId.
   */
  async getDocuments(query: QueryDocumentsDto, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(
      query.organisationId,
      user.id,
    );

    try {
      return await this.prisma.document.findMany({
        where: {
          organisationId: query.organisationId,
          // Optional additional filters — safe because they sit inside the
          // already-tenant-scoped organisationId clause
          ...(query.meetingId && { meetingId: query.meetingId }),
          ...(query.agendaItemId && { agendaItemId: query.agendaItemId }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to list documents for org ${query.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to list documents');
    }
  }

  // ─────────────────────────────────────────────
  // GET BY ID
  // ─────────────────────────────────────────────

  /**
   * GET /documents/:id
   *
   * Tenant isolation: organisationId is read from the actual DB record,
   * not supplied by the client.
   */
  async getDocumentById(id: string, user: AuthenticatedUser) {
    const doc = await this.resolveDocument(id);

    await this.organisationsService.requireMembership(
      doc.organisationId,
      user.id,
    );

    return doc;
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────

  /**
   * PATCH /documents/:id
   *
   * organisationId is immutable — sourced from the DB record, never from DTO.
   * If meetingId or agendaItemId is being changed, the new target is validated
   * to belong to the same organisation.
   */
  async updateDocument(
    id: string,
    dto: UpdateDocumentDto,
    user: AuthenticatedUser,
  ) {
    const doc = await this.resolveDocument(id);

    const membership = await this.organisationsService.requireMembership(
      doc.organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to update documents',
      );
    }

    // Validate new parent associations stay within the same tenant
    if (dto.meetingId) {
      await this.validateMeetingBelongsToOrg(dto.meetingId, doc.organisationId);
    }
    if (dto.agendaItemId) {
      await this.validateAgendaItemBelongsToOrg(
        dto.agendaItemId,
        doc.organisationId,
      );
    }

    try {
      return await this.prisma.document.update({
        where: { id },
        data: {
          ...(dto.fileName !== undefined && { fileName: dto.fileName }),
          ...(dto.originalName !== undefined && { originalName: dto.originalName }),
          ...(dto.mimeType !== undefined && { mimeType: dto.mimeType }),
          ...(dto.sizeBytes !== undefined && { sizeBytes: dto.sizeBytes }),
          ...(dto.storagePath !== undefined && { storagePath: dto.storagePath }),
          // meetingId and agendaItemId may be explicitly nulled to unlink
          ...(dto.meetingId !== undefined && { meetingId: dto.meetingId }),
          ...(dto.agendaItemId !== undefined && {
            agendaItemId: dto.agendaItemId,
          }),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update document ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update document');
    }
  }

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────

  /**
   * DELETE /documents/:id
   *
   * Deletes only the Document record.
   * Does NOT delete the associated Meeting, AgendaItem, or Organisation.
   */
  async deleteDocument(id: string, user: AuthenticatedUser) {
    const doc = await this.resolveDocument(id);

    const membership = await this.organisationsService.requireMembership(
      doc.organisationId,
      user.id,
    );

    if (!EDIT_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to delete documents',
      );
    }

    try {
      await this.prisma.document.delete({ where: { id } });
      return { message: 'Document deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete document ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete document');
    }
  }
}
