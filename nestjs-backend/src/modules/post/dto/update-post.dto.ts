import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string.' })
  @MinLength(1, { message: 'Title must have at least 1 characters.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Content must be a string.' })
  @MinLength(1, { message: 'Content must have at least 1 characters.' })
  content?: string;
}
