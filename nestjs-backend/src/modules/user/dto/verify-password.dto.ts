import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VerifyPasswordDto {
  @IsString({ message: 'Temporary password must be a string' })
  @IsNotEmpty({ message: 'Temporary password không được để trống.' })
  tempPassword: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu phải chứa ít nhất 6 kí tự' })
  newPassword: string;
}
