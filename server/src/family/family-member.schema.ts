import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FamilyMemberDocument = FamilyMember & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class FamilyMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Foreign Key to User

  @Prop({ required: true })
  name: string;

  @Prop()
  surname: string;

  @Prop({ enum: ['alive', 'dead', 'unknown'], default: 'unknown' })
  status: string; // Status: alive, dead, or unknown

  @Prop()
  birthDate: Date;

  @Prop()
  deathDate: Date;

  @Prop()
  gender: string;

  @Prop({ required: false, default: null })
  occupation: string;

  @Prop({ required: false, default: null })
  country: string;
  
  @Prop({ required: false, default: null })
  imageUrl: string; 
  
  @Prop({ type: Types.ObjectId, ref: 'FamilyMember' })
  fatherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FamilyMember' })
  motherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FamilyMember' })
  partnerId: Types.ObjectId[]; // Partner ID

  @Prop({ required: true })
  relationship: string;

  @Prop()
  notes: string;

  @Prop({ default: true })
  isPublic: boolean;
}

export const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMember);

FamilyMemberSchema.methods.updateDetails = async function(): Promise<void> {
  await this.save();
};
