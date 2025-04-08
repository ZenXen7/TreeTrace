import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FamilyMemberDocument = FamilyMember & Document;

@Schema({ timestamps: true })
export class FamilyMember {
  @Prop({ required: true })
  name: string;

  @Prop()
  birthDate: Date;

  @Prop()
  deathDate: Date;

  @Prop()
  medicalConditions: string[];

  @Prop({ required: true })
  relationship: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FamilyMember' })
  fatherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FamilyMember' })
  motherId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FamilyMember' }] })
  children: Types.ObjectId[];

  @Prop()
  gender: string;
}

export const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMember);
