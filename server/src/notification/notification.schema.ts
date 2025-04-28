import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // User who will receive the notification

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['surname_similarity', 'system', 'user_action'] })
  type: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Object, required: false })
  metadata: Record<string, any>; // For storing additional data like similar surnames

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FamilyMember' }] })
  relatedFamilyMembers: Types.ObjectId[]; // Family members with similar surnames
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);