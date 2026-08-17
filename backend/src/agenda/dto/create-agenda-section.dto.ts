import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateAgendaSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
