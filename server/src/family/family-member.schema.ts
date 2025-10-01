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
  
  @Prop({ type: Types.ObjectId, ref: 'FamilyMember' })
  fatherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FamilyMember' })
  motherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FamilyMember' })
  partnerId: Types.ObjectId[]; // Partner ID

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FamilyMember' }] })
  childId: Types.ObjectId[]; // Array of child IDs

  @Prop({ required: true })
  relationship: string;

  @Prop()
  notes: string;

  @Prop({ default: true })
  isPublic: boolean;
}

export const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMember);

// Add performance-optimized indexes
FamilyMemberSchema.index({ userId: 1 }); // For finding all members by user
FamilyMemberSchema.index({ userId: 1, name: 1 }); // For user-specific name searches
FamilyMemberSchema.index({ userId: 1, surname: 1 }); // For surname-based queries
FamilyMemberSchema.index({ userId: 1, status: 1 }); // For status filtering
FamilyMemberSchema.index({ userId: 1, gender: 1 }); // For gender filtering
FamilyMemberSchema.index({ userId: 1, country: 1 }); // For country filtering
FamilyMemberSchema.index({ fatherId: 1 }); // For family tree queries
FamilyMemberSchema.index({ motherId: 1 }); // For family tree queries
FamilyMemberSchema.index({ partnerId: 1 }); // For partner relationships
FamilyMemberSchema.index({ childId: 1 }); // For reverse parent-child relationships
FamilyMemberSchema.index({ name: 'text', surname: 'text' }); // For text search capabilities
FamilyMemberSchema.index({ createdAt: -1 }); // For recent members queries
FamilyMemberSchema.index({ updatedAt: -1 }); // For recently updated members

FamilyMemberSchema.methods.updateDetails = async function(): Promise<void> {
  await this.save();
};
