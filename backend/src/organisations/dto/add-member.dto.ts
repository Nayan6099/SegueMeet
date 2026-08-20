import { IsEmail, IsEnum, IsString, IsOptional } from 'class-validator';
import { OrganisationRole } from '@prisma/client';

export class AddMemberDto {
  /**
   * The email address of the existing user to add.
   * The user must already have an account in the system.
   */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  /**
   * The designation or position title (e.g. "Director", "Advisor").
   */
  @IsString()
  @IsOptional()
  designation?: string;

  /**
   * The role to assign. Must be a valid OrganisationRole enum value.
   */
  @IsEnum(OrganisationRole, {
    message: 'Role must be a valid OrganisationRole',
  })
  role: OrganisationRole;
}
