import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FamilyMember } from 'src/family/family-member.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false }) 
  password: string;

  @Prop({ required: true, enum: ['male', 'female'] })
  gender: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FamilyMember' }] })
  familyTree: Types.Array<Types.ObjectId>;

  _id: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
