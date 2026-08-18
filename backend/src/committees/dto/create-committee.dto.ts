import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommitteeDto {
  @IsString()
  @IsNotEmpty({ message: 'Organisation ID is required' })
  organisationId: string;

  @IsString()
  @IsNotEmpty({ message: 'Committee name is required' })
  @MinLength(2, { message: 'Committee name must be at least 2 characters' })
  @MaxLength(200, { message: 'Committee name cannot exceed 200 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;
}
