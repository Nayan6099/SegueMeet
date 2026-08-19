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
import { AuditService } from '../audit/audit.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

import { CAN_MANAGE_DOCUMENTS } from '../common/auth/roles.constants';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

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
    const membership = await this.organisationsService.requireRole(
      dto.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS
    );

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
      const document = await this.prisma.document.create({
        data: {
          organisationId: dto.organisationId,
          fileName: dto.fileName,
          originalName: dto.originalName,
          mimeType: dto.mimeType,
          sizeBytes: dto.sizeBytes,
          storagePath: dto.storagePath,
          meetingId: dto.meetingId ?? null,
          agendaItemId: dto.agendaItemId ?? null,
          folderId: dto.folderId ?? null,
          uploadedById: user.id,
          versions: {
            create: {
              version: 1,
              storagePath: dto.storagePath,
              sizeBytes: dto.sizeBytes,
              uploadedById: user.id,
            },
          },
        },
      });

      this.auditService.log({
        organisationId: dto.organisationId,
        actorId: user.id,
        action: 'document.created',
        entityType: 'Document',
        entityId: document.id,
        payload: { fileName: dto.fileName, originalName: dto.originalName },
      });

      return document;
    } catch (error) {
      this.logger.error(
        `Failed to create document for org ${dto.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create document');
    }
  }

  /**
   * Uploads a file to Cloudinary and creates a Document record.
   */
  async uploadAndCreateDocument(
    file: Express.Multer.File,
    organisationId: string,
    meetingId: string | undefined,
    agendaItemId: string | undefined,
    folderId: string | undefined,
    user: AuthenticatedUser,
  ) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'seguemeet_documents',
          resource_type: 'auto',
          // Cloudinary will automatically handle PDF, Word, Images, etc.
        },
        async (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(new InternalServerErrorException('Failed to upload file to cloud'));
          }

          if (!result) {
            return reject(new InternalServerErrorException('No result from Cloudinary'));
          }

          try {
            // Create the Document record using the secure URL
            const doc = await this.createDocument(
              {
                organisationId,
                fileName: file.originalname,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                storagePath: result.secure_url,
                meetingId,
                agendaItemId,
                folderId,
              },
              user,
            );
            resolve(doc);
          } catch (dbError) {
            reject(dbError);
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Uploads a new version of an existing document to Cloudinary and creates a DocumentVersion.
   */
  async uploadNewVersion(
    documentId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    const document = await this.resolveDocument(documentId);
    await this.organisationsService.requireRole(
      document.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS
    );

    const latestVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' },
    });

    const nextVersionNum = latestVersion ? latestVersion.version + 1 : 2;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'seguemeet_documents',
          resource_type: 'auto',
        },
        async (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(new InternalServerErrorException('Failed to upload file to cloud'));
          }
          if (!result) {
            return reject(new InternalServerErrorException('No result from Cloudinary'));
          }

          try {
            // Update document's main storagePath and sizeBytes, and create the new version
            const updatedDoc = await this.prisma.document.update({
              where: { id: documentId },
              data: {
                storagePath: result.secure_url,
                sizeBytes: file.size,
                originalName: file.originalname,
                mimeType: file.mimetype,
                versions: {
                  create: {
                    version: nextVersionNum,
                    storagePath: result.secure_url,
                    sizeBytes: file.size,
                    uploadedById: user.id,
                  },
                },
              },
              include: { versions: true },
            });

            this.auditService.log({
              organisationId: document.organisationId,
              actorId: user.id,
              action: 'document.version_created',
              entityType: 'Document',
              entityId: document.id,
              payload: { version: nextVersionNum, originalName: file.originalname },
            });

            resolve(updatedDoc);
          } catch (dbError) {
            reject(dbError);
          }
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // ─────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────

  async getFolders(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);
    return this.prisma.documentFolder.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createFolder(organisationId: string, name: string, user: AuthenticatedUser) {
    const membership = await this.organisationsService.requireRole(organisationId, user.id, CAN_MANAGE_DOCUMENTS);
    const folder = await this.prisma.documentFolder.create({
      data: { organisationId, name },
    });

    this.auditService.log({
      organisationId,
      actorId: user.id,
      action: 'document_folder.created',
      entityType: 'DocumentFolder',
      entityId: folder.id,
      payload: { name },
    });

    return folder;
  }

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

    const membership = await this.organisationsService.requireRole(
      doc.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS
    );

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
      const updated = await this.prisma.document.update({
        where: { id },
        data: {
          ...(dto.fileName !== undefined && { fileName: dto.fileName }),
          ...(dto.originalName !== undefined && {
            originalName: dto.originalName,
          }),
          ...(dto.mimeType !== undefined && { mimeType: dto.mimeType }),
          ...(dto.sizeBytes !== undefined && { sizeBytes: dto.sizeBytes }),
          ...(dto.storagePath !== undefined && {
            storagePath: dto.storagePath,
          }),
          // meetingId and agendaItemId may be explicitly nulled to unlink
          ...(dto.meetingId !== undefined && { meetingId: dto.meetingId }),
          ...(dto.agendaItemId !== undefined && {
            agendaItemId: dto.agendaItemId,
          }),
        },
      });

      this.auditService.log({
        organisationId: doc.organisationId,
        actorId: user.id,
        action: 'document.updated',
        entityType: 'Document',
        entityId: id,
        payload: { fileName: dto.fileName, originalName: dto.originalName },
      });

      return updated;
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

    const membership = await this.organisationsService.requireRole(
      doc.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS
    );

    try {
      await this.prisma.document.delete({ where: { id } });

      this.auditService.log({
        organisationId: doc.organisationId,
        actorId: user.id,
        action: 'document.deleted',
        entityType: 'Document',
        entityId: id,
      });

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
