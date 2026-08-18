import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeetingStatus } from '@prisma/client';

export class QueryMeetingsDto {
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  // Optional: date range filtering
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  take?: number;
}
