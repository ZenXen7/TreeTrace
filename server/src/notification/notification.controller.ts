import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { SurnameSimilarityService } from './surname-similarity.service';
import { Types } from 'mongoose';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly surnameSimilarityService: SurnameSimilarityService,
  ) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    try {
      const userId = req.user.id;
      const notifications = await this.notificationService.findAllForUser(
        userId,
        {
          limit: limit ? parseInt(limit.toString()) : undefined,
          skip: skip ? parseInt(skip.toString()) : undefined,
          unreadOnly: unreadOnly === true,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Notifications retrieved successfully',
        data: notifications,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error retrieving notifications',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    try {
      const userId = req.user.id;
      const count = await this.notificationService.getUnreadCount(userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Unread notification count retrieved successfully',
        data: { count },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error retrieving unread notification count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('notification')
  async getNotification(@Request() req) {
    try {
      const userId = req.user.id;
      const notifications = await this.notificationService.findAllForUser(userId);
  
      return {
        statusCode: HttpStatus.OK,
        message: 'Notification retrieved successfully',
        data: notifications,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error retrieving notification',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/mark-as-read')
  async markAsRead(@Param('id') id: string) {
    try {
      const notification = await this.notificationService.markAsRead(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Notification marked as read successfully',
        data: notification,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error marking notification as read',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('mark-all-as-read')
  async markAllAsRead(@Request() req) {
    try {
      const userId = req.user.id;
      const result = await this.notificationService.markAllAsRead(userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'All notifications marked as read successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error marking all notifications as read',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze-family-tree')
  async analyzeFamilyTree(@Request() req) {
    try {
      const userId = req.user.id;
      await this.surnameSimilarityService.analyzeFamilyTreeForSimilarSurnames(userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Family tree analyzed for similar surnames successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error analyzing family tree for similar surnames',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Post('check-similar-surnames/:familyMemberId')
  async checkSimilarSurnames(
    @Request() req,
    @Param('familyMemberId') familyMemberId: string,
  ) {
    try {
      const userId = req.user.id;
      await this.surnameSimilarityService.checkForSimilarSurnames(familyMemberId, userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Checked for similar surnames successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error checking for similar surnames',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Post('analyze-cross-user-surnames')
  async analyzeCrossUserSurnames(@Request() req) {
    try {
      const userId = req.user.id;
      await this.surnameSimilarityService.analyzeFamilyTreeForSimilarSurnames(userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Cross-user surname analysis completed successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error analyzing surnames across users',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Get('debug-cross-user')
  async debugCrossUserSimilarities(@Request() req) {
    try {
      const userId = req.user.id;
      const result = await this.surnameSimilarityService.debugCrossUserSimilarities(userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Debug cross-user similarities completed',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error debugging cross-user similarities',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Post('cross-user-only')
  async analyzeCrossUserOnly(@Request() req) {
    try {
      const userId = req.user.id;
      const userObjectId = new Types.ObjectId(userId);
      await this.surnameSimilarityService.analyzeSimilaritiesAcrossUsers(userObjectId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Cross-user only surname analysis completed successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error analyzing cross-user surnames',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Post('force-cross-user-notification')
  async forceCrossUserNotification(@Request() req) {
    try {
      const userId = req.user.id;
      const userObjectId = new Types.ObjectId(userId);
      
      // Create a direct notification for the Johnson/Johnssson similarity
      await this.notificationService.create({
        userId: userObjectId,
        message: 'We found family member(s) with surnames similar to "Johnson" (Johnssson) in other users\' family trees. They might be related to your family.',
        type: 'cross_user_surname_similarity',
        read: false,
        metadata: {
          currentMemberSurname: 'Johnson',
          otherSurname: 'Johnssson',
          similarity: 0.777,
          similarMembersByUser: {
            "680e093d2504fa0bc1e36112": [
              {
                name: "johnns2222",
                surname: "Johnssson",
                similarity: 0.777
              }
            ]
          }
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Force-created cross-user notification successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error creating cross-user notification',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}