import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  InternalServerErrorException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@Controller('classroom')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  async create(@Body() createClassroomDto: CreateClassroomDto) {
    try {
      return await this.classroomService.create(createClassroomDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message:
            'Dữ liệu trùng lặp. Mã truy cập hoặc trường duy nhất khác đã tồn tại.',
        });
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Không thể tạo lớp học do lỗi server nội bộ.',
      );
    }
  }

  @Get()
  findAll() {
    return this.classroomService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classroomService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
  ) {
    return this.classroomService.update(+id, updateClassroomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classroomService.remove(+id);
  }
}
