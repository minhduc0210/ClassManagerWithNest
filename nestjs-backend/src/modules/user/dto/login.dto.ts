import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email must be valid.' })
  @IsNotEmpty({ message: 'Email must not be empty.' })
  email: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password must not be empty.' })
  @MinLength(6, { message: 'Password must contain at least 6 characters.' })
  password: string;
}
