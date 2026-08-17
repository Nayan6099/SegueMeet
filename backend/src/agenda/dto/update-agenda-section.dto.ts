import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateAgendaSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
