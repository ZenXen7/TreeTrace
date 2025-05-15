import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HealthCondition, HealthConditionDocument } from './health-condition.schema';

export type FamilyMemberDocument = FamilyMember & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class FamilyMember {
  // Remove explicit id field, Mongoose will handle it automatically
  // @Prop({ type: Types.ObjectId, required: true, unique: true, auto: true })
  // id: Types.ObjectId; // Primary Key

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

  @Prop({ default: true })
  isPublic: boolean;
}

export const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMember);

FamilyMemberSchema.virtual('healthConditions', {
  ref: 'HealthCondition',
  localField: '_id',
  foreignField: 'familyMemberId',
});

FamilyMemberSchema.methods.addHealthCondition = async function(healthCondition: Partial<HealthCondition>): Promise<void> {
  const HealthConditionModel = this.model('HealthCondition');
  await HealthConditionModel.create({
    ...healthCondition,
    familyMemberId: this._id,
  });
};

FamilyMemberSchema.methods.getHealthConditions = async function(): Promise<HealthConditionDocument[]> {
  return await this.populate('healthConditions').execPopulate().then(doc => doc.healthConditions);
};

FamilyMemberSchema.methods.updateDetails = async function(): Promise<void> {
  await this.save();
};

FamilyMemberSchema.methods.removeHealthCondition = async function(id: string): Promise<void> {
  const HealthConditionModel = this.model('HealthCondition');
  await HealthConditionModel.findByIdAndDelete(id);
};
