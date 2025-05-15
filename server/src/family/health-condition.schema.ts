import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HealthConditionDocument = HealthCondition & Document;

@Schema({ timestamps: true })
export class HealthCondition {
  @Prop({ type: Types.ObjectId, ref: 'FamilyMember', required: true })
  familyMemberId: Types.ObjectId;

  @Prop({ required: true })
  conditionName: string;

  @Prop()
  diagnosisDate: Date;

  @Prop()
  notes: string;
}

export const HealthConditionSchema = SchemaFactory.createForClass(HealthCondition); 