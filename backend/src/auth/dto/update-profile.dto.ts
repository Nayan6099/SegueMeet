import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(16)
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  suffix?: string;
}
