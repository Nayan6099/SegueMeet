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
import { validateDocumentUpload, sanitizeFilename } from './documents.validator';

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
      const document = await this.prisma.$transaction(async (tx) => {
        const d = await tx.document.create({
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
            committeeId: dto.committeeId ?? null,
            committeeVisible: dto.committeeVisible ?? false,
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

        await this.auditService.logTx(tx, {
          organisationId: dto.organisationId,
          actorId: user.id,
          action: 'document.created',
          entityType: 'Document',
          entityId: d.id,
          payload: { fileName: dto.fileName, originalName: dto.originalName },
        });

        return d;
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
    validateDocumentUpload(file);
    file.originalname = sanitizeFilename(file.originalname);

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
            await this.deleteFromCloudinaryByUrl(result.secure_url);
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
    validateDocumentUpload(file);
    file.originalname = sanitizeFilename(file.originalname);

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
            const updatedDoc = await this.prisma.$transaction(async (tx) => {
              const d = await tx.document.update({
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

              await this.auditService.logTx(tx, {
                organisationId: document.organisationId,
                actorId: user.id,
                action: 'document.version_created',
                entityType: 'Document',
                entityId: document.id,
                payload: { version: nextVersionNum, originalName: file.originalname },
              });

              return d;
            });

            resolve(updatedDoc);
          } catch (dbError) {
            await this.deleteFromCloudinaryByUrl(result.secure_url);
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
    const folder = await this.prisma.$transaction(async (tx) => {
      const f = await tx.documentFolder.create({
        data: { organisationId, name },
      });

      await this.auditService.logTx(tx, {
        organisationId,
        actorId: user.id,
        action: 'document_folder.created',
        entityType: 'DocumentFolder',
        entityId: f.id,
        payload: { name },
      });

      return f;
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

    const isManager = await this.organisationsService.hasAnyRole(
      query.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS,
    );

    try {
      const baseWhere: any = {
        organisationId: query.organisationId,
        ...(query.meetingId && { meetingId: query.meetingId }),
        ...(query.agendaItemId && { agendaItemId: query.agendaItemId }),
        ...(query.committeeId && { committeeId: query.committeeId }),
      };

      // Non-managers can only see documents they uploaded, were explicitly granted access to,
      // or belong to meetings they are attendees of, or organisation-wide documents.
      if (!isManager) {
        baseWhere.OR = [
          { uploadedById: user.id },
          { accessRules: { some: { userId: user.id } } },
          // Organisation-wide: no explicit access rules, no meeting, no agenda item
          {
            accessRules: { none: {} },
            meetingId: null,
            agendaItemId: null,
          },
          // Meeting attendees can see the meeting's documents (assuming no explicit access rules to override)
          {
            accessRules: { none: {} },
            meeting: {
              attendees: { some: { userId: user.id } }
            }
          },
          // Agenda item attendees can see agenda item docs
          {
            accessRules: { none: {} },
            agendaItem: {
              section: {
                meeting: {
                  attendees: { some: { userId: user.id } }
                }
              }
            }
          },
          // Committee visibility
          {
            accessRules: { none: {} },
            committeeVisible: true,
            committee: {
              members: { some: { userId: user.id } }
            }
          }
        ];
      }

      return await this.prisma.document.findMany({
        where: baseWhere,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } }
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

    const isManager = await this.organisationsService.hasAnyRole(
      doc.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS,
    );

    if (!isManager) {
      const baseWhere: any = { id };
      baseWhere.OR = [
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
        },
        {
          accessRules: { none: {} },
          committeeVisible: true,
          committee: {
            members: { some: { userId: user.id } }
          }
        }
      ];

      const authorizedDoc = await this.prisma.document.findFirst({
        where: baseWhere,
      });

      if (!authorizedDoc) {
        throw new ForbiddenException('You do not have permission to access this document');
      }
    }

    // Re-fetch to include uploadedBy
    const finalDoc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!finalDoc) {
      throw new NotFoundException('Document not found');
    }

    return finalDoc;
  }

  // ─────────────────────────────────────────────
  // DOWNLOAD (PROXY)
  // ─────────────────────────────────────────────

  /**
   * Retrieves the document and streams it securely through the backend.
   * This ensures Cloudinary URLs are not exposed, and P2 authorization is strictly enforced.
   */
  async downloadDocument(id: string, user: AuthenticatedUser): Promise<{ stream: NodeJS.ReadableStream, mimeType: string, originalName: string }> {
    const doc = await this.getDocumentById(id, user);

    return new Promise((resolve, reject) => {
      // Use native Node https module to proxy the stream
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const https = require('https');
      
      https.get(doc.storagePath, (response: any) => {
        if (response.statusCode !== 200) {
          return reject(new InternalServerErrorException('Failed to fetch file from remote storage'));
        }
        resolve({
          stream: response,
          mimeType: doc.mimeType,
          originalName: doc.originalName,
        });
      }).on('error', (err: any) => {
        this.logger.error(`Error downloading file ${id}`, err);
        reject(new InternalServerErrorException('Error downloading file'));
      });
    });
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
      const updated = await this.prisma.$transaction(async (tx) => {
        const u = await tx.document.update({
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
            ...(dto.committeeId !== undefined && { committeeId: dto.committeeId }),
            ...(dto.committeeVisible !== undefined && { committeeVisible: dto.committeeVisible }),
          },
        });

        await this.auditService.logTx(tx, {
          organisationId: doc.organisationId,
          actorId: user.id,
          action: 'document.updated',
          entityType: 'Document',
          entityId: id,
          payload: { fileName: dto.fileName, originalName: dto.originalName },
        });

        return u;
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
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { versions: true }
    });
    if (!doc) throw new NotFoundException('Document not found');

    const membership = await this.organisationsService.requireRole(
      doc.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.document.delete({ where: { id } });

        await this.auditService.logTx(tx, {
          organisationId: doc.organisationId,
          actorId: user.id,
          action: 'document.deleted',
          entityType: 'Document',
          entityId: id,
        });
      });

      // Cleanup Cloudinary storage to prevent orphans
      for (const version of doc.versions) {
        if (version.storagePath) {
          await this.deleteFromCloudinaryByUrl(version.storagePath);
        }
      }

      return { message: 'Document deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete document ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete document');
    }
  }

  // ─────────────────────────────────────────────
  // SHARING
  // ─────────────────────────────────────────────

  async shareDocument(id: string, targetUserId: string, user: AuthenticatedUser) {
    const doc = await this.getDocumentById(id, user);

    const isManager = await this.organisationsService.hasAnyRole(
      doc.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS
    );

    if (!isManager && doc.uploadedById !== user.id) {
      throw new ForbiddenException('Only the uploader or an admin can share this document');
    }

    // Verify target user is in the organisation
    await this.organisationsService.requireMembership(doc.organisationId, targetUserId);

    const access = await this.prisma.$transaction(async (tx) => {
      const a = await tx.documentAccess.upsert({
        where: {
          documentId_userId: { documentId: id, userId: targetUserId }
        },
        update: {},
        create: {
          documentId: id,
          userId: targetUserId
        }
      });

      await this.auditService.logTx(tx, {
        organisationId: doc.organisationId,
        actorId: user.id,
        action: 'document.shared',
        entityType: 'Document',
        entityId: id,
        payload: { targetUserId }
      });

      return a;
    });

    return access;
  }

  async revokeDocumentAccess(id: string, targetUserId: string, user: AuthenticatedUser) {
    const doc = await this.getDocumentById(id, user);

    const isManager = await this.organisationsService.hasAnyRole(
      doc.organisationId,
      user.id,
      CAN_MANAGE_DOCUMENTS
    );

    if (!isManager && doc.uploadedById !== user.id) {
      throw new ForbiddenException('Only the uploader or an admin can revoke access to this document');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.documentAccess.delete({
          where: {
            documentId_userId: { documentId: id, userId: targetUserId }
          }
        });

        await this.auditService.logTx(tx, {
          organisationId: doc.organisationId,
          actorId: user.id,
          action: 'document.access_revoked',
          entityType: 'Document',
          entityId: id,
          payload: { targetUserId }
        });
      });
    } catch (e) {
      // Ignore if not found
    }

    return { message: 'Access revoked' };
  }

  // ─────────────────────────────────────────────
  // CLOUDINARY UTILS
  // ─────────────────────────────────────────────

  private extractPublicIdFromUrl(url: string): string | null {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
      const parts = url.split('/upload/');
      if (parts.length !== 2) return null;
      const pathPart = parts[1];
      const pathWithoutVersion = pathPart.replace(/^v\d+\//, '');
      const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
      if (lastDotIndex === -1) return pathWithoutVersion;
      return pathWithoutVersion.substring(0, lastDotIndex);
    } catch {
      return null;
    }
  }

  private async deleteFromCloudinaryByUrl(url: string) {
    const publicId = this.extractPublicIdFromUrl(url);
    if (!publicId) return;
    try {
      await new Promise((resolve) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) this.logger.warn(`Failed to delete from Cloudinary: ${publicId}`);
          resolve(result);
        });
      });
    } catch (e) {
      this.logger.warn(`Error deleting from Cloudinary: ${publicId}`);
    }
  }
}
