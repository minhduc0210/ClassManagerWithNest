import { IsString, MinLength, IsOptional } from 'class-validator';

export class ChangeInformationDto {
  @IsString({ message: 'Name must be a string.' })
  @IsOptional()
  @MinLength(1, { message: 'Name must contain at least 1 character.' })
  name?: string;

  @IsString({ message: 'Last name must be a string.' })
  @IsOptional()
  @MinLength(1, { message: 'Last name must contain at least 1 character.' })
  lastname?: string;
}
