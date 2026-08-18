import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';

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
  ) {}

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

  // ─────────────────────────────────────────────
  // PRIVATE: build PDF buffer
  // ─────────────────────────────────────────────

  private buildPdfBuffer(data: BoardPackData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderPdf(doc, data);

      doc.end();
    });
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
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor(COLORS.text)
          .text(`${idx + 1}.  ${d.originalName}`, 72, doc.y, {
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
