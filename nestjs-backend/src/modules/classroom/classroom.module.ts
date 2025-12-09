import { Module } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { ClassroomController } from './classroom.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Classroom, ClassroomSchema } from './entities/classroom.entity';
import { Slot, SlotSchema } from '../slot/entities/slot.entity';
import { Post, PostSchema } from '../post/entities/post.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Classroom.name, schema: ClassroomSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [ClassroomController],
  providers: [ClassroomService],
})
export class ClassroomModule {}
