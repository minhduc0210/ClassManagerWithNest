import { Module } from '@nestjs/common';
import { SlotService } from './slot.service';
import { SlotController } from './slot.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Slot, SlotSchema } from './entities/slot.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }]),
  ],
  controllers: [SlotController],
  providers: [SlotService],
})
export class SlotModule {}
