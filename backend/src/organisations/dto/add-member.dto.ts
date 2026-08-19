import { IsEmail, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { OrganisationRole } from '@prisma/client';

export class AddMemberDto {
  /**
   * The email address of the existing user to add.
   * The user must already have an account in the system.
   */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  /**
   * The name of the user. Used to create the user on the fly if they don't exist.
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The role to assign. Must be a valid OrganisationRole enum value.
   */
  @IsEnum(OrganisationRole, {
    message: `Role must be one of: ${Object.values(OrganisationRole).join(', ')}`,
  })
  role: OrganisationRole;
}
