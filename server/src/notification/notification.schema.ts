import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // User who will receive the notification

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  fromUserId: Types.ObjectId; // User who sent the notification (for suggestion requests)

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  toUserId: Types.ObjectId; // User who will receive the notification (for suggestion requests)

  @Prop({ required: true })
  message: string;

  @Prop({ required: false })
  title: string;

  @Prop({ required: true, enum: ['surname_similarity', 'system', 'user_action', 'suggestion_request'] })
  type: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: 'pending', enum: ['pending', 'accepted', 'rejected'] })
  status: string;

  @Prop({ type: Number, required: false })
  suggestionCount: number;

  @Prop({ type: Object, required: false })
  metadata: Record<string, any>; // For storing additional data like similar surnames

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FamilyMember' }] })
  relatedFamilyMembers: Types.ObjectId[]; // Family members with similar surnames
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);