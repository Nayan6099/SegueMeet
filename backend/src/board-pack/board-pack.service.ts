import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import axios from 'axios';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { CAN_MANAGE_BOARD_PACK } from '../common/auth/roles.constants';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Shape returned by getBoardPackData() and exposed on the JSON endpoint. */
export interface BoardPackData {
  meeting: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    isRemote: boolean;
    administrator: string | null;
    status: string;
    agendaStatus: string;
    notes: string | null;
    organisationId: string;
  };
  agenda: Array<{
    id: string;
    title: string;
    position: number;
    items: Array<{
      id: string;
      title: string;
      purpose: string;
      presenter: string | null;
      durationMinutes: number;
      position: number;
    }>;
  }>;
  minutes: {
    id: string;
    status: string;
    content: string | null;
    actionItems: Array<{
      id: string;
      description: string;
      assignee: { id: string; name: string; email: string } | null;
      dueDate: string | null;
      status: string;
    }>;
  } | null;
  documents: Array<{
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    meetingId: string | null;
    agendaItemId: string | null;
    createdAt: Date;
  }>;
  boardPack: {
    id: string;
    version: number;
    status: string;
    publishedAt: Date | null;
  } | null;
}

// ─────────────────────────────────────────────
// PDF helpers
// ─────────────────────────────────────────────

const COLORS = {
  primary: '#1a3c5e',
  secondary: '#4a7fad',
  accent: '#e8f0f8',
  text: '#2d2d2d',
  muted: '#6b6b6b',
  divider: '#cccccc',
} as const;

function pdfDivider(doc: InstanceType<typeof PDFDocument>): void {
  doc
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .strokeColor(COLORS.divider)
    .lineWidth(0.5)
    .stroke()
    .moveDown(0.4);
}

function pdfSectionHeader(
  doc: InstanceType<typeof PDFDocument>,
  title: string,
): void {
  doc
    .moveDown(0.6)
    .rect(50, doc.y, doc.page.width - 100, 22)
    .fill(COLORS.accent)
    .fillColor(COLORS.primary)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), 58, doc.y - 17)
    .moveDown(0.8);
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

@Injectable()
export class BoardPackService {
  private readonly logger = new Logger(BoardPackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // ─────────────────────────────────────────────
  // PRIVATE: resolve and authorise
  // ─────────────────────────────────────────────

  private async authorisedMeeting(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, organisationId: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    await this.organisationsService.requireMembership(
      meeting.organisationId,
      userId,
    );

    const isManager = await this.organisationsService.hasAnyRole(
      meeting.organisationId,
      userId,
      CAN_MANAGE_BOARD_PACK,
    );

    if (!isManager) {
      const attendee = await this.prisma.meetingAttendee.findFirst({
        where: { meetingId, userId },
      });
      if (!attendee) {
        throw new ForbiddenException('You do not have permission to access this meeting');
      }
    }

    return meeting;
  }

  // ─────────────────────────────────────────────
  // PUBLIC: collect board-pack data
  // ─────────────────────────────────────────────

  async getBoardPackData(
    meetingId: string,
    user: AuthenticatedUser,
  ): Promise<BoardPackData> {
    await this.authorisedMeeting(meetingId, user.id);

    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          agendaSections: {
            orderBy: { position: 'asc' },
            include: {
              items: { orderBy: { position: 'asc' } },
            },
          },
          minutes: {
            include: {
              actionItems: {
                orderBy: { createdAt: 'asc' },
                include: {
                  assignee: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
          },
          documents: {
            orderBy: { createdAt: 'asc' },
          },
          boardPacks: {
            orderBy: { version: 'desc' },
            take: 1,
          }
        },
      });

      if (!meeting) throw new NotFoundException('Meeting not found');

      return {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          location: meeting.location,
          isRemote: meeting.isRemote,
          administrator: meeting.administrator,
          status: meeting.status,
          agendaStatus: meeting.agendaStatus,
          notes: meeting.notes,
          organisationId: meeting.organisationId,
        },
        agenda: meeting.agendaSections.map((s) => ({
          id: s.id,
          title: s.title,
          position: s.position,
          items: s.items.map((i) => ({
            id: i.id,
            title: i.title,
            purpose: i.purpose,
            presenter: i.presenter,
            durationMinutes: i.durationMinutes,
            position: i.position,
          })),
        })),
        minutes: meeting.minutes
          ? {
              id: meeting.minutes.id,
              status: meeting.minutes.status,
              content: meeting.minutes.content,
              actionItems: meeting.minutes.actionItems.map((a) => ({
                id: a.id,
                description: a.description,
                assignee: a.assignee ?? null,
                dueDate: a.dueDate,
                status: a.status,
              })),
            }
          : null,
        documents: meeting.documents.map((d) => ({
          id: d.id,
          fileName: d.fileName,
          originalName: d.originalName,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          meetingId: d.meetingId,
          agendaItemId: d.agendaItemId,
          createdAt: d.createdAt,
        })),
        boardPack: meeting.boardPacks[0] ? {
          id: meeting.boardPacks[0].id,
          version: meeting.boardPacks[0].version,
          status: meeting.boardPacks[0].status,
          publishedAt: meeting.boardPacks[0].publishedAt,
        } : null,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to collect board-pack data for meeting ${meetingId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to collect board-pack data',
      );
    }
  }

  // ─────────────────────────────────────────────
  // PUBLIC: generate PDF
  // ─────────────────────────────────────────────

  async generatePdf(
    meetingId: string,
    user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const data = await this.getBoardPackData(meetingId, user);

    try {
      const buffer = await this.buildPdfBuffer(data);
      return new StreamableFile(buffer, {
        type: 'application/pdf',
        disposition: `attachment; filename="board-pack-${meetingId}.pdf"`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF for meeting ${meetingId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to generate PDF');
    }
  }

  async publishBoardPack(meetingId: string, user: AuthenticatedUser) {
    const meeting = await this.authorisedMeeting(meetingId, user.id);
    await this.organisationsService.requireRole(
      meeting.organisationId,
      user.id,
      CAN_MANAGE_BOARD_PACK
    );

    const data = await this.getBoardPackData(meetingId, user);
    
    // Check if there is already a published version
    const latestBoardPack = await this.prisma.boardPack.findFirst({
      where: { meetingId },
      orderBy: { version: 'desc' },
    });
    
    const version = latestBoardPack ? latestBoardPack.version + 1 : 1;

    try {
      const buffer = await this.buildPdfBuffer(data);

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'seguemeet_board_packs',
            resource_type: 'raw',
            format: 'pdf',
          },
          async (error, result) => {
            if (error || !result) {
              this.logger.error('Cloudinary upload failed for board pack', error);
              return reject(new InternalServerErrorException('Failed to upload board pack to cloud'));
            }

            try {
              const boardPack = await this.prisma.boardPack.create({
                data: {
                  organisationId: meeting.organisationId,
                  meetingId,
                  status: 'PUBLISHED',
                  version,
                  storagePath: result.secure_url,
                  publishedAt: new Date(),
                },
              });

              // Notify attendees
              const attendees = await this.prisma.meetingAttendee.findMany({
                where: { meetingId },
                include: { user: true }
              });

              const org = await this.prisma.organisation.findUnique({ where: { id: meeting.organisationId } });

              for (const attendee of attendees) {
                if (!attendee.user) continue;
                
                await this.notificationsService.createNotification({
                  organisationId: meeting.organisationId,
                  recipientId: attendee.userId,
                  type: 'DOCUMENT_UPLOADED',
                  title: 'Board Pack Published',
                  message: `The board pack for ${data.meeting.title} has been published.`,
                  entityType: 'BOARD_PACK',
                  entityId: boardPack.id,
                });
                
                this.mailService.sendBoardPackPublishedEmail(
                  attendee.user.email,
                  data.meeting.title,
                  org?.name || 'Your Organisation',
                  user.email || 'Admin',
                  meeting.id
                ).catch(err => {
                  this.logger.error(`Failed to send board pack email to ${attendee.user.email}`);
                });
              }

              resolve(boardPack);
            } catch (dbError) {
              reject(dbError);
            }
          }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    } catch (error) {
      this.logger.error(`Failed to publish Board Pack for meeting ${meetingId}`, error);
      throw new InternalServerErrorException('Failed to publish Board Pack');
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE: build PDF buffer
  // ─────────────────────────────────────────────

  private async buildPdfBuffer(data: BoardPackData): Promise<Buffer> {
    const basePdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this.renderPdf(doc, data);
      doc.end();
    });

    try {
      const pdfDoc = await PDFLibDocument.load(basePdfBuffer);

      for (const doc of data.documents) {
        if (doc.mimeType !== 'application/pdf') continue;

        try {
          const dbDoc = await this.prisma.document.findUnique({ where: { id: doc.id } });
          if (!dbDoc || !dbDoc.storagePath) continue;

          const response = await axios.get(dbDoc.storagePath, { responseType: 'arraybuffer' });
          const attachmentPdf = await PDFLibDocument.load(response.data);
          const copiedPages = await pdfDoc.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
          
          for (const page of copiedPages) {
            pdfDoc.addPage(page);
          }
        } catch (downloadError) {
          this.logger.error(`Failed to fetch/merge PDF attachment ${doc.id}`, downloadError);
        }
      }

      const mergedPdfBytes = await pdfDoc.save();
      return Buffer.from(mergedPdfBytes);
    } catch (error) {
      this.logger.error('Failed to merge PDFs with pdf-lib', error);
      throw error;
    }
  }

  private renderPdf(
    doc: InstanceType<typeof PDFDocument>,
    data: BoardPackData,
  ): void {
    const { meeting, agenda, minutes, documents } = data;
    const pageWidth = doc.page.width;

    // ── COVER ──────────────────────────────────

    doc
      .rect(0, 0, pageWidth, 160)
      .fill(COLORS.primary)
      .fillColor('#ffffff')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('BOARD PACK', 50, 50, { align: 'center' })
      .fontSize(15)
      .font('Helvetica')
      .text(meeting.title, 50, 85, { align: 'center' })
      .fontSize(11)
      .fillColor(COLORS.accent)
      .text(
        `${meeting.date}  ·  ${meeting.startTime} – ${meeting.endTime}`,
        50,
        115,
        { align: 'center' },
      );

    doc.fillColor(COLORS.text).moveDown(5);

    // ── MEETING DETAILS ─────────────────────────

    pdfSectionHeader(doc, 'Meeting Details');

    const details: [string, string][] = [
      ['Date', meeting.date],
      ['Time', `${meeting.startTime} – ${meeting.endTime}`],
      [
        'Location',
        meeting.isRemote ? `${meeting.location} (Remote)` : meeting.location,
      ],
      ['Status', meeting.status],
      ['Agenda Status', meeting.agendaStatus],
    ];
    if (meeting.administrator) {
      details.push(['Administrator', meeting.administrator]);
    }

    details.forEach(([label, value]) => {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(COLORS.muted)
        .text(`${label}:`, 58, doc.y, { continued: true, width: 120 })
        .font('Helvetica')
        .fillColor(COLORS.text)
        .text(value, { width: pageWidth - 230 })
        .moveDown(0.2);
    });

    if (meeting.notes) {
      doc
        .moveDown(0.3)
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text('Notes:', 58)
        .font('Helvetica')
        .fillColor(COLORS.text)
        .text(meeting.notes, 58, doc.y, { width: pageWidth - 106 })
        .moveDown(0.4);
    }

    // ── AGENDA ─────────────────────────────────

    if (agenda.length > 0) {
      pdfSectionHeader(doc, 'Agenda');

      agenda.forEach((section, si) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(COLORS.primary)
          .text(`${si + 1}.  ${section.title}`, 58)
          .moveDown(0.2);

        section.items.forEach((item, ii) => {
          const purposeTag =
            item.purpose !== 'NONE'
              ? ` [${item.purpose.replace(/_/g, ' ')}]`
              : '';
          const duration = `${item.durationMinutes} min`;
          doc
            .font('Helvetica')
            .fontSize(9.5)
            .fillColor(COLORS.text)
            .text(
              `${si + 1}.${ii + 1}  ${item.title}${purposeTag}`,
              72,
              doc.y,
              { continued: true, width: pageWidth - 200 },
            )
            .fillColor(COLORS.muted)
            .text(
              item.presenter ? `${item.presenter}  ·  ${duration}` : duration,
              { align: 'right', width: 110 },
            )
            .moveDown(0.2);
        });

        doc.moveDown(0.3);
      });
    }

    // ── MINUTES ────────────────────────────────

    if (minutes) {
      pdfSectionHeader(doc, `Minutes  [${minutes.status.replace(/_/g, ' ')}]`);

      if (minutes.content) {
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor(COLORS.text)
          .text(minutes.content, 58, doc.y, { width: pageWidth - 106 })
          .moveDown(0.5);
      } else {
        doc
          .font('Helvetica-Oblique')
          .fontSize(9.5)
          .fillColor(COLORS.muted)
          .text('No content recorded yet.', 58)
          .moveDown(0.4);
      }

      // Action items sub-section
      if (minutes.actionItems.length > 0) {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(COLORS.secondary)
          .text('Action Items', 58)
          .moveDown(0.3);

        minutes.actionItems.forEach((ai, idx) => {
          const assignee = ai.assignee ? ai.assignee.name : 'Unassigned';
          const due = ai.dueDate ? `Due: ${ai.dueDate}` : 'No due date';
          doc
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor(COLORS.text)
            .text(`${idx + 1}.  ${ai.description}`, 72, doc.y, {
              width: pageWidth - 106,
            })
            .font('Helvetica')
            .fontSize(9)
            .fillColor(COLORS.muted)
            .text(
              `Assignee: ${assignee}  ·  ${due}  ·  ${ai.status}`,
              72,
              doc.y,
              {
                width: pageWidth - 106,
              },
            )
            .moveDown(0.3);
        });
      }
    }

    // ── DOCUMENTS ──────────────────────────────

    if (documents.length > 0) {
      pdfSectionHeader(doc, 'Documents');

      documents.forEach((d, idx) => {
        const sizeKb = (d.sizeBytes / 1024).toFixed(1);
        const attachmentNote = d.mimeType === 'application/pdf' 
          ? '' 
          : ' (Not embedded - PDF conversion required)';
          
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor(COLORS.text)
          .text(`${idx + 1}.  ${d.originalName}${attachmentNote}`, 72, doc.y, {
            continued: true,
            width: pageWidth - 200,
          })
          .font('Helvetica')
          .fillColor(COLORS.muted)
          .text(`${sizeKb} KB  ·  ${d.mimeType}`, {
            align: 'right',
            width: 110,
          })
          .moveDown(0.25);
      });
    }

    // ── FOOTER ─────────────────────────────────

    pdfDivider(doc);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `Generated by SegueMeet  ·  ${new Date().toISOString()}`,
        50,
        doc.y,
        { align: 'center' },
      );
  }
}
