import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateClassroomDto {
  @IsString({ message: 'Title must be a string!' })
  @IsNotEmpty({ message: 'Title must be required!' })
  @MinLength(1, { message: 'Title must have at least 1 character!' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Subtitle phải là chuỗi ký tự.' })
  @MinLength(1, { message: 'Subtitle phải có ít nhất 1 ký tự.' })
  subtitle?: string;

  @IsOptional()
  @IsMongoId({ message: 'Teacher ID phải là định dạng MongoId hợp lệ.' })
  teacher: string;
}
