import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty({ message: 'Organisation name is required' })
  @MinLength(2, { message: 'Organisation name must be at least 2 characters' })
  @MaxLength(200, { message: 'Organisation name cannot exceed 200 characters' })
  name: string;
}
