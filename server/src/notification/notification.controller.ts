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
import { FamilyMember, FamilyMemberDocument } from '../family/family-member.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Define interfaces for the cross-user similarities
interface CrossUserSimilarity {
  currentUserSurname: string;
  otherUserSurname: string;
  otherUserName: string;
  similarity: number;
}

interface UserSimilarities {
  otherUserId: string;
  similarities: CrossUserSimilarity[];
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly surnameSimilarityService: SurnameSimilarityService,
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
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
  
  @Get('cross-user-similarities')
  async getCrossUserSimilarities(@Request() req) {
    try {
      const userId = req.user.id;
      const userObjectId = new Types.ObjectId(userId);
      
      // Get the current user's family members
      const currentUserMembers = await this.familyMemberModel
        .find({ userId: userObjectId })
        .exec();
      
      // Get all the current user's surnames
      const currentUserSurnames = new Set<string>();
      for (const member of currentUserMembers) {
        if (member.surname) {
          currentUserSurnames.add(member.surname.toLowerCase());
        } else if (member.name) {
          // Extract surname from full name if necessary
          const nameParts = member.name.trim().split(' ');
          if (nameParts.length > 1) {
            const surname = nameParts[nameParts.length - 1].toLowerCase();
            currentUserSurnames.add(surname);
          }
        }
      }
      
      // Get all family members from other users
      const otherUserMembers = await this.familyMemberModel
        .find({ userId: { $ne: userObjectId } })
        .exec();
      
      // Group the other users' family members by userId
      const otherUserMembersByUserId = new Map<string, any[]>();
      for (const member of otherUserMembers) {
        const userId = member.userId.toString();
        if (!otherUserMembersByUserId.has(userId)) {
          otherUserMembersByUserId.set(userId, []);
        }
        const userMembers = otherUserMembersByUserId.get(userId);
        if (userMembers) {
          userMembers.push(member);
        }
      }
      
      // Find similar surnames between current user and other users
      const similarSurnames: UserSimilarities[] = [];
      
      for (const [otherUserId, members] of otherUserMembersByUserId.entries()) {
        const userSimilarities: CrossUserSimilarity[] = [];
        
        for (const member of members) {
          let otherSurname = '';
          if (member.surname) {
            otherSurname = member.surname.toLowerCase();
          } else if (member.name) {
            const nameParts = member.name.trim().split(' ');
            if (nameParts.length > 1) {
              otherSurname = nameParts[nameParts.length - 1].toLowerCase();
            }
          }
          
          if (!otherSurname) continue;
          
          // Compare with current user's surnames
          for (const currentSurname of currentUserSurnames) {
            const similarity = this.surnameSimilarityService.calculateSimilarityPublic(
              currentSurname,
              otherSurname
            );
            
            // If similarity is above threshold (0.7) but not exact match (1.0)
            if (similarity > 0.7 && similarity < 1.0) {
              userSimilarities.push({
                currentUserSurname: currentSurname,
                otherUserSurname: otherSurname,
                otherUserName: member.name,
                similarity: similarity
              });
            }
          }
        }
        
        if (userSimilarities.length > 0) {
          similarSurnames.push({
            otherUserId,
            similarities: userSimilarities
          });
        }
      }
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Cross-user surname similarities retrieved successfully',
        data: {
          currentUserSurnames: Array.from(currentUserSurnames),
          similarSurnames,
          totalSimilarities: similarSurnames.reduce(
            (count, user) => count + user.similarities.length, 
            0
          )
        }
      };
    } catch (error) {
      console.error('Error retrieving cross-user similarities:', error);
      throw new HttpException(
        error.message || 'Error retrieving cross-user similarities',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}