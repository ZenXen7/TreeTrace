import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ProcessedSuggestionDocument = ProcessedSuggestion & Document;

@Schema({ timestamps: true })
export class ProcessedSuggestion {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FamilyMember', required: true })
  memberId: Types.ObjectId;
  
  @Prop({ type: String, required: true })
  suggestionText: string;
  
  @Prop({ type: Date, default: Date.now })
  processedAt: Date;
}

export const ProcessedSuggestionSchema = SchemaFactory.createForClass(ProcessedSuggestion);

// Create a compound index on userId and memberId for faster lookups
ProcessedSuggestionSchema.index({ userId: 1, memberId: 1 });

// Create a text index on suggestionText for potential text searches
ProcessedSuggestionSchema.index({ suggestionText: 'text' }); 