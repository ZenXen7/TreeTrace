import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';
import { ProcessedSuggestion, ProcessedSuggestionDocument } from './processed-suggestion.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(ProcessedSuggestion.name)
    private processedSuggestionModel: Model<ProcessedSuggestionDocument>,
  ) {}

  /**
   * Create a new notification
   * @param notification Notification data to create
   * @returns Created notification
   */
  async create(notification: Partial<Notification>): Promise<Notification> {
    const newNotification = new this.notificationModel(notification);
    return newNotification.save();
  }

  /**
   * Get all notifications for a user
   * @param userId User ID
   * @param options Query options (limit, skip, etc.)
   * @returns List of notifications
   */
  async findAllForUser(userId: string, options: { limit?: number; skip?: number; unreadOnly?: boolean } = {}): Promise<Notification[]> {
    const userObjectId = new Types.ObjectId(userId.toString());
    const query: any = { userId: userObjectId };
    
    if (options.unreadOnly) {
      query.read = false;
    }
    
    let queryBuilder = this.notificationModel.find(query).sort({ createdAt: -1 });
    
    if (options.skip) {
      queryBuilder = queryBuilder.skip(options.skip);
    }
    
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }
    
    return queryBuilder.exec();
  }

  /**
   * Get unread notification count for a user
   * @param userId User ID
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId.toString());
    return this.notificationModel.countDocuments({ userId: userObjectId, read: false }).exec();
  }

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @returns Updated notification
   */
  async markAsRead(notificationId: string): Promise<Notification | null> {
    return this.notificationModel.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    ).exec();
  }

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Operation result
   */
  async markAllAsRead(userId: string): Promise<{ acknowledged: boolean; modifiedCount: number }> {
    const userObjectId = new Types.ObjectId(userId.toString());
    const result = await this.notificationModel.updateMany(
      { userId: userObjectId, read: false },
      { read: true }
    ).exec();
    
    return {
      acknowledged: result.acknowledged,
      modifiedCount: result.modifiedCount
    };
  }

  /**
   * Delete a notification
   * @param notificationId Notification ID
   * @returns Deleted notification
   */
  async delete(notificationId: string): Promise<Notification | null> {
    return this.notificationModel.findByIdAndDelete(notificationId).exec();
  }

  /**
   * Mark a suggestion as processed for a specific member and user
   * @param userId User ID
   * @param memberId Member ID
   * @param suggestionText The exact text of the suggestion that was processed
   * @returns The created processed suggestion record
   */
  async markSuggestionAsProcessed(
    userId: string,
    memberId: string,
    suggestionText: string,
  ): Promise<ProcessedSuggestion> {
    const userObjectId = new Types.ObjectId(userId);
    const memberObjectId = new Types.ObjectId(memberId);

    // Create a new processed suggestion record
    const processedSuggestion = new this.processedSuggestionModel({
      userId: userObjectId,
      memberId: memberObjectId,
      suggestionText,
      processedAt: new Date(),
    });

    return processedSuggestion.save();
  }

  /**
   * Get all processed suggestions for a specific member and user
   * @param userId User ID
   * @param memberId Member ID
   * @returns Array of processed suggestion texts
   */
  async getProcessedSuggestions(
    userId: string,
    memberId: string,
  ): Promise<string[]> {
    const userObjectId = new Types.ObjectId(userId);
    const memberObjectId = new Types.ObjectId(memberId);

    const processedSuggestions = await this.processedSuggestionModel.find({
      userId: userObjectId,
      memberId: memberObjectId,
    }).exec();

    return processedSuggestions.map(ps => ps.suggestionText);
  }
}