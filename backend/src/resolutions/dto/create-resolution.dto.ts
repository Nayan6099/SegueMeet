import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateResolutionDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  closeDate: string; // ISO date format expected e.g., 'YYYY-MM-DD'
}
