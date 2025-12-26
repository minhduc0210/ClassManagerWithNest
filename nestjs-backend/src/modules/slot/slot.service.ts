import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Slot, SlotDocument } from './entities/slot.entity';
import {
  Classroom,
  ClassroomDocument,
} from '../classroom/entities/classroom.entity';
import { PostService } from '../post/post.service';

@Injectable()
export class SlotService {
  constructor(
    @InjectModel(Slot.name) private readonly slotModel: Model<SlotDocument>,
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
    private readonly postService: PostService,
  ) {}

  async create(
    classroomID: string,
    createSlotDto: CreateSlotDto,
  ): Promise<Slot> {
    if (!Types.ObjectId.isValid(classroomID)) {
      throw new BadRequestException('ID không hợp lệ.');
    }
    const classroomMongooseID = new Types.ObjectId(classroomID);
    const { title, content, startTime, endTime } = createSlotDto;

    if (startTime > endTime) {
      throw new BadRequestException('Start time must before end time!');
    }

    const classroom = await this.classroomModel.findById(classroomMongooseID);
    if (!classroom) {
      throw new NotFoundException(
        `Classroom with ID "${classroomID}" not found`,
      );
    }

    const latestSlot = await this.slotModel
      .findOne()
      .sort({ startTime: -1 })
      .limit(1)
      .exec();

    if (
      latestSlot &&
      (new Date(latestSlot.startTime) > new Date(startTime) ||
        new Date(latestSlot.endTime) > new Date(endTime))
    ) {
      throw new BadRequestException(
        'Cannot create slot because a later slot already exists.',
      );
    }

    const newSlot = new this.slotModel({
      title,
      content,
      startTime,
      endTime,
    });

    const savedSlot = await newSlot.save();
    classroom.slots.push(savedSlot._id);
    await classroom.save();

    return savedSlot;
  }

  findAll() {
    return `This action returns all slot`;
  }

  findOne(id: number) {
    return `This action returns a #${id} slot`;
  }

  async update(id: string, updateSlotDto: UpdateSlotDto): Promise<Slot> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ.');
    }

    const existingSlot = await this.slotModel.findById(id).exec();
    if (!existingSlot) {
      throw new NotFoundException(`Slot với ID "${id}" không tồn tại`);
    }

    const updatedStartTime = updateSlotDto.startTime
      ? new Date(updateSlotDto.startTime)
      : existingSlot.startTime;
    const updatedEndTime = updateSlotDto.endTime
      ? new Date(updateSlotDto.endTime)
      : existingSlot.endTime;

    if (updatedStartTime > updatedEndTime) {
      throw new BadRequestException('Start time must be before end time!');
    }

    const prevSlot = await this.slotModel
      .findOne({ _id: { $ne: id }, startTime: { $lt: existingSlot.startTime } })
      .sort({ startTime: -1 })
      .exec();

    const nextSlot = await this.slotModel
      .findOne({ _id: { $ne: id }, startTime: { $gt: existingSlot.startTime } })
      .sort({ startTime: 1 })
      .exec();

    if (prevSlot && updatedStartTime < new Date(prevSlot.endTime)) {
      throw new BadRequestException(
        `Cập nhật thất bại. Thời gian bắt đầu xung đột với Slot trước đó (kết thúc lúc ${prevSlot.endTime.toISOString()}).`,
      );
    }

    if (nextSlot && updatedEndTime > new Date(nextSlot.startTime)) {
      throw new BadRequestException(
        `Cập nhật thất bại. Thời gian kết thúc xung đột với Slot sau đó (bắt đầu lúc ${nextSlot.startTime.toISOString()}).`,
      );
    }

    Object.assign(existingSlot, updateSlotDto);
    return await existingSlot.save();
  }

  async remove(id: string): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID Slot không hợp lệ.');
    }

    const slotMongooseID = new Types.ObjectId(id);
    const slot = await this.slotModel.findById(slotMongooseID).exec();
    if (!slot) {
      throw new NotFoundException(`Slot với ID "${id}" không tồn tại.`);
    }

    try {
      if (slot.posts && slot.posts.length > 0) {
        await this.postService.deleteManyPosts(
          slot.posts as unknown as Types.ObjectId[],
        );
      }
      const updateResult = await this.classroomModel.updateOne(
        { slots: slotMongooseID },
        { $pull: { slots: slotMongooseID } },
      );

      if (updateResult.matchedCount === 0) {
        console.warn(`Slot ${id} was not associated with any Classroom.`);
      }
      await this.slotModel.findByIdAndDelete(slotMongooseID);

      return { success: true };
    } catch (error) {
      console.error('Error during slot removal process:', error);
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi trong quá trình xóa Slot.',
      );
    }
  }
}
