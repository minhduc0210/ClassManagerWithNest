/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Classroom, ClassroomDocument } from './entities/classroom.entity';
import { Model, Types } from 'mongoose';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { Slot, SlotDocument } from '../slot/entities/slot.entity';
import { Post, PostDocument } from '../post/entities/post.entity';

@Injectable()
export class ClassroomService {
  constructor(
    @InjectModel(Classroom.name) private classModel: Model<ClassroomDocument>,
    @InjectModel(Slot.name) private slotModel: Model<SlotDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async create(
    createClassroomDto: CreateClassroomDto,
    teacherID: string,
  ): Promise<ClassroomDocument> {
    const { nanoid } = await import('nanoid');

    const teacherMongooseID = new Types.ObjectId(teacherID);
    const createdClassroom = await this.classModel.create({
      ...createClassroomDto,
      teacher: teacherMongooseID,
    });
    createdClassroom.accessCode = nanoid(5).toUpperCase().trim();
    const existingClassroom = await this.classModel
      .findOne({ accessCode: createdClassroom.accessCode })
      .exec();

    if (existingClassroom) {
      throw new ConflictException('Mã truy cập đã bị trùng, vui lòng thử lại.');
    }
    return createdClassroom.save();
  }

  async joinClassroom(accessCode: string, studentID: string): Promise<void> {
    const studentMongooseID = new Types.ObjectId(studentID);
    const classroom = await this.classModel.findOne({ accessCode });
    if (!classroom) throw new NotFoundException('Not found this classroom!');
    if (classroom.students.includes(studentMongooseID))
      throw new ConflictException('You are already in this class!');
    classroom.students.push(studentMongooseID);
    await classroom.save();
  }

  async getClassroomInfo(classroomID: string): Promise<ClassroomDocument> {
    if (!Types.ObjectId.isValid(classroomID)) {
      throw new BadRequestException('ID không hợp lệ.');
    }
    const classroomMongooseID = new Types.ObjectId(classroomID);

    const classroom = await this.classModel
      .findById(classroomMongooseID)
      .populate({
        path: 'teacher',
        select: 'name lastname',
      })
      .populate({
        path: 'students',
        select: 'name lastname email',
      })
      .populate({
        path: 'slots',
        populate: {
          path: 'posts',
          populate: {
            path: 'author',
            select: 'name lastname',
          },
        },
      });
    if (!classroom) throw new NotFoundException('Classroom not found!');
    return classroom;
  }

  async removeStudent(classroomID: string, studentID: string): Promise<void> {
    if (
      !Types.ObjectId.isValid(classroomID) ||
      !Types.ObjectId.isValid(studentID)
    ) {
      throw new BadRequestException('ID không hợp lệ.');
    }
    const classroomMongooseID = new Types.ObjectId(classroomID);
    const studentMongooseID = new Types.ObjectId(studentID);
    const classroom = await this.classModel.findById(classroomMongooseID);

    if (classroom) {
      const studentIndex = classroom.students.indexOf(studentMongooseID);
      if (studentIndex === -1) {
        throw new NotFoundException('Not found this student in the class.');
      }
      classroom.students.splice(
        classroom.students.indexOf(studentMongooseID),
        1,
      );
      await classroom.save();
    } else {
      throw new NotFoundException('Not found this class.');
    }
  }

  async changeInformation(
    classroomID: string,
    teacherID: string,
    updateDto: UpdateClassroomDto,
  ): Promise<ClassroomDocument> {
    if (
      !Types.ObjectId.isValid(classroomID) ||
      !Types.ObjectId.isValid(teacherID)
    ) {
      throw new BadRequestException('ID không hợp lệ.');
    }

    const classroomMongooseID = new Types.ObjectId(classroomID);
    const teacherMongooseID = new Types.ObjectId(teacherID);
    const updatedClassroom = await this.classModel
      .findOneAndUpdate(
        {
          _id: classroomMongooseID,
          teacher: teacherMongooseID,
        },
        { $set: updateDto },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
    if (!updatedClassroom) {
      const foundOnly = await this.classModel
        .findById(classroomMongooseID)
        .exec();

      if (!foundOnly) {
        throw new NotFoundException('Không tìm thấy lớp học này.');
      } else {
        // Lớp học tồn tại, nhưng teacherID không khớp
        throw new UnauthorizedException('Unauthorized request.');
      }
    }
    return updatedClassroom;
  }

  async deleteClassroom(classroomID: string, teacherID: string): Promise<void> {
    if (
      !Types.ObjectId.isValid(classroomID) ||
      !Types.ObjectId.isValid(teacherID)
    ) {
      throw new BadRequestException(
        'ID lớp học hoặc ID người dùng không hợp lệ.',
      );
    }

    const classroomMongooseID = new Types.ObjectId(classroomID);
    const classroom = await this.classModel
      .findById(classroomMongooseID)
      .exec();

    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học này.');
    }

    if (classroom.teacher.toString() !== teacherID) {
      throw new UnauthorizedException(
        'Bạn không được ủy quyền để xóa lớp học này.',
      );
    }

    try {
      const slots = await this.slotModel
        .find({ _id: { $in: classroom.slots } })
        .exec();

      const allPostIds = slots.flatMap((slot) => slot.posts);
      await this.postModel.deleteMany({ _id: { $in: allPostIds } }).exec();
      await this.slotModel.deleteMany({ _id: { $in: classroom.slots } }).exec();

      await this.classModel.findByIdAndDelete(classroomMongooseID).exec();
    } catch (error) {
      console.error('Lỗi khi thực hiện xóa classroom:', error);
      throw new InternalServerErrorException(
        'Xảy ra lỗi trong quá trình xóa lớp học và các tài nguyên liên quan.',
      );
    }
  }

  async getClassroomAndSlotNames(
    classroomId: string,
    slotId: string,
  ): Promise<{ classroomName: string; slotTitle: string }> {
    const classroom = await this.classModel.findById(classroomId);
    const slot = await this.slotModel.findById(slotId).exec();

    if (!classroom || !slot) {
      throw new Error('Classroom or Slot not found.');
    }

    return {
      classroomName: classroom.title,
      slotTitle: slot.title,
    };
  }
}
