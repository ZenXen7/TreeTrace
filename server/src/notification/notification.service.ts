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

  /**
   * Unmark suggestions that match any of the provided patterns for any of the specified members
   * @param userId User ID
   * @param memberIds Array of member IDs
   * @param patterns Array of text patterns to match against suggestion texts
   * @returns Result of the deletion operation
   */
  async unmarkSuggestions(
    userId: string,
    memberIds: string[],
    patterns: string[],
  ): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const memberObjectIds = memberIds.map(id => new Types.ObjectId(id));

    // Create a filter that matches any pattern for any of the specified members
    const orConditions: Array<{
      userId: Types.ObjectId;
      memberId: Types.ObjectId;
      suggestionText: { $regex: string; $options: string };
    }> = [];

    // For each member, add conditions for each pattern
    for (const memberId of memberObjectIds) {
      for (const pattern of patterns) {
        orConditions.push({
          userId: userObjectId,
          memberId: memberId,
          suggestionText: { $regex: pattern, $options: 'i' } // Case-insensitive partial match
        });
      }
    }
    
    // Delete all matching records
    const result = await this.processedSuggestionModel.deleteMany({
      $or: orConditions
    }).exec();

    return {
      deletedCount: result.deletedCount,
      memberIds: memberIds,
      patterns: patterns
    };
  }

  /**
   * Get suggestion requests for a user (both sent and received)
   * @param userId User ID
   * @returns List of suggestion requests
   */
  async getSuggestionRequests(userId: Types.ObjectId): Promise<any[]> {
    const requests = await this.notificationModel.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ],
      type: 'suggestion_request'
    }).populate('fromUserId', 'firstName lastName').populate('toUserId', 'firstName lastName').exec();

    return requests.map(request => {
      const fromUser = request.fromUserId as any;
      const toUser = request.toUserId as any;
      
      return {
        id: (request._id as any).toString(),
        fromUserId: fromUser._id.toString(),
        fromUserName: `${fromUser.firstName} ${fromUser.lastName}`,
        toUserId: toUser._id.toString(),
        toUserName: `${toUser.firstName} ${toUser.lastName}`,
        status: request.status,
        createdAt: (request as any).createdAt,
        suggestionCount: request.suggestionCount,
        isIncoming: toUser._id.toString() === userId.toString(), // True if this is an incoming request
        isOutgoing: fromUser._id.toString() === userId.toString() // True if this is an outgoing request
      };
    });
  }

  /**
   * Create a new suggestion request
   * @param fromUserId Sender user ID
   * @param toUserId Receiver user ID
   * @param suggestionCount Number of suggestions
   * @returns Created suggestion request
   */
  async createSuggestionRequest(
    fromUserId: Types.ObjectId,
    toUserId: Types.ObjectId,
    suggestionCount: number
  ): Promise<any> {
    // Check if there's already a pending request
    const existingPendingRequest = await this.notificationModel.findOne({
      fromUserId,
      toUserId,
      type: 'suggestion_request',
      status: 'pending'
    }).exec();

    if (existingPendingRequest) {
      throw new Error('A pending request already exists');
    }

    // Check if there's a rejected request and delete it to create a fresh one
    const existingRejectedRequest = await this.notificationModel.findOne({
      fromUserId,
      toUserId,
      type: 'suggestion_request',
      status: 'rejected'
    }).exec();

    if (existingRejectedRequest) {
      // Delete the rejected request to create a fresh one
      await this.notificationModel.deleteOne({
        _id: existingRejectedRequest._id
      }).exec();
    }

    const request = new this.notificationModel({
      userId: toUserId, // The user who will receive the notification
      fromUserId,
      toUserId,
      type: 'suggestion_request',
      status: 'pending',
      suggestionCount,
      title: 'Suggestion Access Request',
      message: `A user wants to see detailed suggestions from your family tree (${suggestionCount} suggestions available)`,
      read: false
    });

    return request.save();
  }

  /**
   * Respond to a suggestion request
   * @param requestId Request ID
   * @param userId User ID (must be the receiver)
   * @param status Response status ('accepted' or 'rejected')
   * @returns Updated request
   */
  async respondToSuggestionRequest(
    requestId: string,
    userId: Types.ObjectId,
    status: 'accepted' | 'rejected'
  ): Promise<any> {
    const request = await this.notificationModel.findOne({
      _id: requestId,
      toUserId: userId,
      type: 'suggestion_request',
      status: 'pending'
    }).exec();

    if (!request) {
      throw new Error('Request not found or already processed');
    }

    request.status = status;
    request.read = true;
    return request.save();
  }
}