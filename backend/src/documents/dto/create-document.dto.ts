import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateDocumentDto {
  /**
   * The owning organisation. Validated against the authenticated user's
   * membership — client-supplied but verified server-side before use.
   */
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  /** Display filename (may differ from the file on disk/storage). */
  @IsString()
  @IsNotEmpty()
  fileName: string;

  /** Original filename as supplied by the uploader. */
  @IsString()
  @IsNotEmpty()
  originalName: string;

  /** MIME type, e.g. "application/pdf". */
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  /** File size in bytes. */
  @IsInt()
  @Min(0)
  sizeBytes: number;

  /**
   * Storage path — filesystem path or object-storage key (e.g. S3 key).
   * Managed externally; this API stores the reference only.
   */
  @IsString()
  @IsNotEmpty()
  storagePath: string;

  /**
   * Optional: attach this document to a specific meeting.
   * Must belong to the same organisation as organisationId.
   */
  @IsOptional()
  @IsUUID()
  meetingId?: string;

  /**
   * Optional: attach this document to a specific agenda item.
   * Must trace back to the same organisation (agendaItem → section → meeting → org).
   */
  @IsOptional()
  @IsUUID()
  agendaItemId?: string;
}
