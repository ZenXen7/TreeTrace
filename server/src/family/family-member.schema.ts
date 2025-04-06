import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FamilyMemberDocument = FamilyMember & Document;

@Schema()
export class FamilyMember {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  relation: string;

  @Prop({ type: String, default: null })
  parentId: string | null;
}

export const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMember);