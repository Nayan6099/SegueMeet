import { IsInt, IsOptional, IsString, IsUUID, Min, IsBoolean } from 'class-validator';

/**
 * UpdateDocumentDto — only exposes fields that make sense to change after creation.
 *
 * IMPORTANT: organisationId is intentionally OMITTED — a document cannot be
 * moved between organisations.
 *
 * meetingId and agendaItemId CAN be reassigned (or set to null to unlink),
 * but the new target must belong to the same organisation.
 */
export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  storagePath?: string;

  /**
   * Re-link to a different meeting within the same organisation,
   * or set to null to detach from any meeting.
   */
  @IsOptional()
  @IsUUID()
  meetingId?: string | null;

  /**
   * Re-link to a different agenda item within the same organisation,
   * or set to null to detach from any agenda item.
   */
  @IsOptional()
  @IsUUID()
  agendaItemId?: string | null;

  @IsOptional()
  @IsUUID()
  committeeId?: string | null;

  @IsOptional()
  @IsBoolean()
  committeeVisible?: boolean;
}
