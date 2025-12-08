import { ConflictException, Injectable } from '@nestjs/common';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Classroom } from './entities/classroom.entity';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';

@Injectable()
export class ClassroomService {
  constructor(
    @InjectModel(Classroom.name) private classModel: Model<Classroom>,
  ) {}

  async create(createClassroomDto: CreateClassroomDto): Promise<Classroom> {
    const createdClassroom = new this.classModel(createClassroomDto);
    createdClassroom.accessCode = nanoid(5).toUpperCase().trim();
    const existingClassroom = await this.classModel
      .findOne({ accessCode: createdClassroom.accessCode })
      .exec();

    if (existingClassroom) {
      throw new ConflictException('Mã truy cập đã bị trùng, vui lòng thử lại.');
    }
    return createdClassroom.save();
  }

  findAll() {
    return `This action returns all classroom`;
  }

  findOne(id: number) {
    return `This action returns a #${id} classroom`;
  }

  update(id: number, updateClassroomDto: UpdateClassroomDto) {
    return `This action updates a #${id} classroom`;
  }

  remove(id: number) {
    return `This action removes a #${id} classroom`;
  }
}
