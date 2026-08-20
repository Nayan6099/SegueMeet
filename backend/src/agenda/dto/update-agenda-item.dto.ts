import { IsString, IsOptional, IsEnum, IsInt, Min, IsUUID } from 'class-validator';
import { AgendaItemPurpose } from '@prisma/client';

export class UpdateAgendaItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(AgendaItemPurpose)
  purpose?: AgendaItemPurpose;

  @IsOptional()
  @IsString()
  presenter?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsUUID()
  planItemId?: string | null;
}
