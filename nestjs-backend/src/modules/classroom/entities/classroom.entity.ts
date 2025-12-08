import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Slot } from 'src/modules/slot/entities/slot.entity';
import { User } from 'src/modules/user/entities/user.entity';

export type ClassroomDocument = HydratedDocument<Classroom>;

@Schema({ timestamps: true })
export class Classroom {
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
  subtitle: string;

  @Prop({
    type: String,
    unique: true,
  })
  accessCode: string;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  students: User[];

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'Slot' }],
    default: [],
  })
  slots: Slot[];

  @Prop({
    type: { type: mongoose.Types.ObjectId, ref: 'Slot' },
  })
  teacher: User;
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom);




