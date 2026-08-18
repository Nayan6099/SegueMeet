import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInterestDto {
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  guestName?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notificationDate?: string;

  @IsBoolean()
  @IsOptional()
  isResolved?: boolean;
}
