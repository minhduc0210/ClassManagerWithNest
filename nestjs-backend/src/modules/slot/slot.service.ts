import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

@Injectable()
export class SlotService {
  constructor(
    @InjectModel(Slot.name) private readonly slotModel: Model<SlotDocument>,
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
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
    const slot = await this.slotModel
      .findByIdAndUpdate(id, updateSlotDto, { new: true })
      .exec();
    if (!slot) {
      throw new NotFoundException(`Slot with ID "${id}" not found`);
    }
    return slot;
  }

  remove(id: number) {
    return `This action removes a #${id} slot`;
  }
}
