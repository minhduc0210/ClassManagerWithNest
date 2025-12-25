import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './entities/post.entity';
import {
  Classroom,
  ClassroomSchema,
} from '../classroom/entities/classroom.entity';
import { Slot, SlotSchema } from '../slot/entities/slot.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Classroom.name, schema: ClassroomSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
