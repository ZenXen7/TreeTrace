import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicalHistoryDocument = MedicalHistory & Document;

@Schema({ timestamps: true })
export class MedicalHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'FamilyMember', required: true })
  familyMemberId: Types.ObjectId;

  @Prop({ type: Map, of: Boolean, default: {} })
  healthConditions: Map<string, boolean>;

  @Prop({ type: String, default: '' })
  allergies: string;

  @Prop({ type: String, default: '' })
  medications: string;

  @Prop({ type: String, default: '' })
  surgeries: string;

  @Prop({ type: String, default: '' })
  familyHistory: string;

  @Prop({ type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], default: '' })
  bloodType: string;

  @Prop({ type: String, default: '' })
  immunizations: string;

  @Prop({ type: Boolean, default: true })
  isPrivate: boolean; 
}

export const MedicalHistorySchema = SchemaFactory.createForClass(MedicalHistory); 