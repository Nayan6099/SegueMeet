import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class QueryDocumentsDto {
  /**
   * Organisation scope — required for listing. Validated against the
   * authenticated user's membership before any query is executed.
   */
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  /** Optional: filter by a specific meeting. */
  @IsOptional()
  @IsUUID()
  meetingId?: string;

  /** Optional: filter by a specific agenda item. */
  @IsOptional()
  @IsUUID()
  agendaItemId?: string;
}
