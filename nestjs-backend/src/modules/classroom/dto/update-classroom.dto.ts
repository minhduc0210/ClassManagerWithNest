import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;
}
