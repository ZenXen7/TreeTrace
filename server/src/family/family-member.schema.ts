import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

export type FamilyMemberDocument = FamilyMember & Document;

@Schema({ timestamps: true })
export class FamilyMember {
  @Prop({ required: true })
  name: string;

  @Prop()
  birthDate: Date;

  @Prop()
  medicalConditions: string[];

  @Prop({ required: true })
  relationship: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  _id: string;
}

export const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMember);
