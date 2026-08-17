import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateOrganisationDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Organisation name must be at least 2 characters' })
  @MaxLength(200, { message: 'Organisation name cannot exceed 200 characters' })
  name?: string;

  /**
   * Arbitrary JSON settings blob — corresponds to the `settings` Json field
   * on the Organisation model.
   *
   * Validated as a plain object; keys/values are application-defined and not
   * further validated at this layer so the schema can evolve without migrations.
   */
  @IsOptional()
  settings?: Record<string, unknown>;
}
