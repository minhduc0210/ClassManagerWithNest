import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  })
  lastname: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    minlength: 6,
  })
  password: string;

  @Prop({
    type: String,
    minlength: 6,
  })
  tempPassword: string;

  @Prop({
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
