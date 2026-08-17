import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  /**
   * Minimum 8 characters; max 72 matches the bcrypt input limit.
   */
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password cannot exceed 72 characters' })
  password: string;

  /**
   * The name of the organisation that will be created and owned by this user.
   * Every registered user becomes the BOARD_ADMIN of their own organisation.
   */
  @IsString()
  @IsNotEmpty({ message: 'Organisation name is required' })
  @MinLength(2, { message: 'Organisation name must be at least 2 characters' })
  @MaxLength(200, { message: 'Organisation name cannot exceed 200 characters' })
  organisationName: string;
}
