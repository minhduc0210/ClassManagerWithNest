import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  })
  title: string;

  @Prop({
    type: String,
    required: false,
    minlength: 1,
    trim: true,
  })
  content: string;

  @Prop({
    type: String,
  })
  file: string;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
  })
  author: mongoose.Types.ObjectId;
}

export const PostSchema = SchemaFactory.createForClass(Post);
