import { Module } from '@nestjs/common';
import { SlotService } from './slot.service';
import { SlotController } from './slot.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Slot, SlotSchema } from './entities/slot.entity';
import {
  Classroom,
  ClassroomSchema,
} from '../classroom/entities/classroom.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Slot.name, schema: SlotSchema },
      { name: Classroom.name, schema: ClassroomSchema },
    ]),
  ],
  controllers: [SlotController],
  providers: [SlotService],
})
export class SlotModule {}
