import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SlotDocument = HydratedDocument<Slot>;

@Schema({ timestamps: true })
export class Slot {
  @Prop({
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  })
  title: string;

  @Prop({
    type: Date,
    required: true,
  })
  startTime: Date;

  @Prop({
    type: Date,
    required: true,
  })
  endTime: Date;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'Post' }],
    default: [],
  })
  posts: [mongoose.Types.ObjectId];
}

export const SlotSchema = SchemaFactory.createForClass(Slot);
