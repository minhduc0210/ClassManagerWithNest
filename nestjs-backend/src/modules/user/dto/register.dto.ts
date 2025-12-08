import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  /**
   * Tên (First Name) của người dùng. (required: true, minlength: 1)
   */
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name must not be empty.' })
  @MinLength(1, { message: 'Name must contain at least 1 character.' })
  name: string;

  /**
   * Họ (Last Name) của người dùng. (required: true, minlength: 1)
   */
  @IsString({ message: 'Last name must be a string.' })
  @IsNotEmpty({ message: 'Last name must not be empty.' })
  @MinLength(1, { message: 'Last name must contain at least 1 character.' })
  lastname: string;

  /**
   * Địa chỉ email của người dùng. (required: true, unique, format check)
   */
  @IsEmail({}, { message: 'Email must be valid.' })
  @IsNotEmpty({ message: 'Email must not be empty.' })
  email: string;

  /**
   * Mật khẩu của người dùng. (required: true, minlength: 6)
   */
  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password must not be empty.' })
  @MinLength(6, { message: 'Password must contain at least 6 characters.' })
  password: string;

  /**
   * Vai trò của người dùng ('student' hoặc 'teacher'). (default: 'student')
   * Mặc dù có giá trị mặc định, bạn có thể cho phép client ghi đè.
   * Nếu không gửi, nó sẽ sử dụng default trong Mongoose Schema.
   */
  @IsOptional()
  @IsString()
  @IsEnum(['student', 'teacher'], {
    message: 'Role must be student or teacher.',
  })
  role?: string;
}
