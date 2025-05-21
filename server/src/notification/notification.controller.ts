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
import { FamilyMemberSimilarityService } from './family-member-similarity.service';
import { Types } from 'mongoose';
import { FamilyMember, FamilyMemberDocument } from '../family/family-member.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FamilyMemberWithId } from './similar-member.interface';

// Define interfaces for the cross-user similarities
interface CrossUserSimilarity {
  currentMember: {
    id: string;
    name: string;
    surname: string;
    status?: string;
    birthDate?: Date;
    deathDate?: Date;
    country?: string;
  };
  otherMember: {
    id: string;
    name: string;
    surname: string;
    status?: string;
    birthDate?: Date;
    deathDate?: Date;
    country?: string;
  };
  similarity: number;
  similarFields: string[];
  suggestions: string[];
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
    private readonly familyMemberSimilarityService: FamilyMemberSimilarityService,
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
      await this.familyMemberSimilarityService.analyzeFamilyTreeForSimilarMembers(userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Family tree analyzed for similar family members successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error analyzing family tree for similar family members',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Post('check-similar-family-members/:familyMemberId')
  async checkSimilarFamilyMembers(
    @Request() req,
    @Param('familyMemberId') familyMemberId: string,
  ) {
    try {
      const userId = req.user.id;
      await this.familyMemberSimilarityService.checkForSimilarFamilyMembers(familyMemberId, userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Checked for similar family members successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error checking for similar family members',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Post('analyze-cross-user-similarities')
  async analyzeCrossUserSimilarities(@Request() req) {
    try {
      const userId = req.user.id;
      await this.familyMemberSimilarityService.analyzeFamilyTreeForSimilarMembers(userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Cross-user family member similarity analysis completed successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error analyzing cross-user family member similarities',
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
        .exec() as unknown as FamilyMemberWithId[];
      
      // Get all family members from other users
      const otherUserMembers = await this.familyMemberModel
        .find({ userId: { $ne: userObjectId } })
        .exec() as unknown as FamilyMemberWithId[];
      
      // Group the other users' family members by userId
      const otherUserMembersByUserId = new Map<string, FamilyMemberWithId[]>();
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
      
      // Find similar family members between current user and other users
      const similarMembers: UserSimilarities[] = [];
      let totalSuggestionCount = 0;
      
      for (const [otherUserId, members] of otherUserMembersByUserId.entries()) {
        const userSimilarities: CrossUserSimilarity[] = [];
        
        // Compare each current user's member with each other user's member
        for (const currentMember of currentUserMembers) {
          for (const otherMember of members) {
            // Use the family member similarity service to calculate similarity
            const { similarity, similarFields } = 
              this.familyMemberSimilarityService.calculateMemberSimilarity(
                currentMember, 
                otherMember
              );
            
            // If similarity is above threshold and we have at least one similar field
            if (similarity > 0.7 && similarFields.length > 0) {
              // Generate suggestions based on differences
              const suggestions = await this.generateSuggestions(currentMember, otherMember, similarFields);
              totalSuggestionCount += suggestions.length;
              
              userSimilarities.push({
                currentMember: {
                  id: currentMember._id.toString(),
                  name: currentMember.name,
                  surname: currentMember.surname || this.extractSurnameFromName(currentMember.name),
                  status: currentMember.status,
                  birthDate: currentMember.birthDate,
                  deathDate: currentMember.deathDate,
                  country: currentMember.country
                },
                otherMember: {
                  id: otherMember._id.toString(),
                  name: otherMember.name,
                  surname: otherMember.surname || this.extractSurnameFromName(otherMember.name),
                  status: otherMember.status,
                  birthDate: otherMember.birthDate,
                  deathDate: otherMember.deathDate,
                  country: otherMember.country
                },
                similarity,
                similarFields,
                suggestions // Add suggestions to the response
              });
            }
          }
        }
        
        if (userSimilarities.length > 0) {
          similarMembers.push({
            otherUserId,
            similarities: userSimilarities
          });
        }
      }
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Cross-user family member similarities retrieved successfully',
        data: {
          currentUserCount: currentUserMembers.length,
          similarMembers,
          totalSimilarities: similarMembers.reduce(
            (count, user) => count + user.similarities.length, 
            0
          ),
          totalSuggestions: totalSuggestionCount
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

  // Generate suggestions for differences between family members
  private async generateSuggestions(
    currentMember: FamilyMemberWithId,
    otherMember: FamilyMemberWithId,
    similarFields: string[]
  ): Promise<string[]> {
    let suggestions: string[] = [];
    
    // Now we only compare full normalized names
    const currentFullName = this.normalizeNameForComparison(currentMember.name);
    const otherFullName = this.normalizeNameForComparison(otherMember.name);

    // Only generate suggestions if there's an exact name match
    const exactNameMatch = currentFullName === otherFullName && currentFullName !== '';
    
    if (!exactNameMatch) {
      return suggestions;
    }
    
    console.log(`Generating suggestions for matched members: "${currentMember.name}" and "${otherMember.name}"`);
    
    // Check for parent relationship suggestions
    suggestions = await this.addParentRelationshipSuggestions(currentMember, otherMember, suggestions);
    
    // Check for partner relationship suggestions
    suggestions = await this.addPartnerRelationshipSuggestions(currentMember, otherMember, suggestions);
    
    // Status differences
    if (currentMember.status && otherMember.status) {
      if (currentMember.status !== otherMember.status) {
        if (currentMember.status === 'alive' && otherMember.status === 'dead') {
          suggestions.push(
            `Consider updating status to "dead" for "${currentMember.name}". Another user has recorded this person as dead.`
          );
        } else if (currentMember.status === 'dead' && otherMember.status === 'alive') {
          suggestions.push(
            `Verify status of "${currentMember.name}". Another user has recorded this person as alive.`
          );
        }
      } else {
        // Even for matching status, suggest confirming
        if (currentMember.status === 'dead') {
          suggestions.push(
            `Confirm dead status for "${currentMember.name}". Another user has also recorded this person as dead.`
          );
        }
      }
    }
    
    // Birth date
    if (currentMember.birthDate && otherMember.birthDate) {
      const date1 = new Date(currentMember.birthDate);
      const date2 = new Date(otherMember.birthDate);
      
      if (Math.abs(date1.getTime() - date2.getTime()) > 86400000) {
        const date1Str = date1.toISOString().split('T')[0];
        const date2Str = date2.toISOString().split('T')[0];
        
        suggestions.push(
          `Consider updating birth date from ${date1Str} to ${date2Str} for "${currentMember.name}". Another user has recorded a different birth date.`
        );
      } else {
        const date1Str = date1.toISOString().split('T')[0];
        suggestions.push(
          `Confirm birth date ${date1Str} for "${currentMember.name}". Another user has recorded the same birth date.`
        );
      }
    } else if (!currentMember.birthDate && otherMember.birthDate) {
      const dateStr = new Date(otherMember.birthDate).toISOString().split('T')[0];
      suggestions.push(
        `Consider adding birth date (${dateStr}) for "${currentMember.name}". Another user has recorded this birth date.`
      );
    }
    
    // Death date
    if (currentMember.deathDate && otherMember.deathDate) {
      const date1 = new Date(currentMember.deathDate);
      const date2 = new Date(otherMember.deathDate);
      
      if (Math.abs(date1.getTime() - date2.getTime()) > 86400000) {
        const date1Str = date1.toISOString().split('T')[0];
        const date2Str = date2.toISOString().split('T')[0];
        
        suggestions.push(
          `Consider updating death date from ${date1Str} to ${date2Str} for "${currentMember.name}". Another user has recorded a different death date.`
        );
      } else {
        const date1Str = date1.toISOString().split('T')[0];
        suggestions.push(
          `Confirm death date ${date1Str} for "${currentMember.name}". Another user has recorded the same death date.`
        );
      }
    } else if (!currentMember.deathDate && otherMember.deathDate) {
      const dateStr = new Date(otherMember.deathDate).toISOString().split('T')[0];
      suggestions.push(
        `Consider adding death date (${dateStr}) for "${currentMember.name}". Another user has recorded this death date.`
      );
    }
    
    // Country
    if (currentMember.country && otherMember.country) {
      if (currentMember.country !== otherMember.country) {
        suggestions.push(
          `Consider updating country from "${currentMember.country}" to "${otherMember.country}" for "${currentMember.name}". Another user has recorded a different country.`
        );
      } else {
        suggestions.push(
          `Confirm country "${currentMember.country}" for "${currentMember.name}". Another user has recorded the same country.`
        );
      }
    } else if (!currentMember.country && otherMember.country) {
      suggestions.push(
        `Consider adding country "${otherMember.country}" for "${currentMember.name}". Another user has recorded this country.`
      );
    }
    
    // Child information
    if (otherMember.childId && otherMember.childId.length > 0) {
      const currentChildIds = currentMember.childId || [];
      const otherChildIds = otherMember.childId || [];
      
      if (currentChildIds.length < otherChildIds.length) {
        try {
          const missingChildrenCount = otherChildIds.length - currentChildIds.length;
          
          interface ChildDetail {
            id: Types.ObjectId;
            name: string;
            gender: string;
          }
          
          let childrenDetails: ChildDetail[] = [];
          for (const childId of otherChildIds) {
            try {
              const child = await this.familyMemberModel.findById(childId).exec();
              if (child) {
                const isSameName = child.name.toLowerCase().trim() === currentMember.name.toLowerCase().trim();
                if (!isSameName) {
                  childrenDetails.push({
                    id: childId,
                    name: child.name,
                    gender: child.gender || 'unknown'
                  });
                }
              }
            } catch (err) {
              // Skip this child if there's an error
            }
          }
          
          // Generate individual suggestions for each child
          if (childrenDetails.length > 0) {
            // Create a separate suggestion for each child instead of bundling them
            for (const child of childrenDetails) {
              suggestions.push(
                `Consider adding child "${child.name}" to "${currentMember.name}". Another user has recorded this child for this person.`
              );
            }
          } else if (missingChildrenCount > 0) {
            suggestions.push(
              `Consider adding ${missingChildrenCount} more children to "${currentMember.name}". Another user has recorded more children for this person.`
            );
          }
        } catch (err) {
          suggestions.push(
            `Consider adding more children to "${currentMember.name}". Another user has recorded more children for this person.`
          );
        }
      }
    }
    
    return suggestions;
  }

  // Add parent relationship suggestions - directly check for parent data regardless of other similarities
  private async addParentRelationshipSuggestions(
    currentMember: FamilyMemberWithId,
    otherMember: FamilyMemberWithId,
    suggestions: string[]
  ): Promise<string[]> {
    const newSuggestions = [...suggestions]; // Create a new array to hold suggestions
    
    try {
      if (otherMember.fatherId && !currentMember.fatherId) {
        try {
          const father = await this.familyMemberModel.findById(otherMember.fatherId).exec();
          if (father) {
            const isSameName = father.name.toLowerCase().trim() === currentMember.name.toLowerCase().trim();
            if (!isSameName) {
              newSuggestions.push(
                `Consider adding father "${father.name}" to "${currentMember.name}". Another user has recorded this father for this person.`
              );
            }
          } else {
            newSuggestions.push(
              `Consider adding father information to "${currentMember.name}". Another user has recorded a father for this person.`
            );
          }
        } catch (err) {
          newSuggestions.push(
            `Consider adding father information to "${currentMember.name}". Another user has recorded a father for this person.`
          );
        }
      }
      
      if (otherMember.motherId && !currentMember.motherId) {
        try {
          const mother = await this.familyMemberModel.findById(otherMember.motherId).exec();
          if (mother) {
            const isSameName = mother.name.toLowerCase().trim() === currentMember.name.toLowerCase().trim();
            if (!isSameName) {
              newSuggestions.push(
                `Consider adding mother "${mother.name}" to "${currentMember.name}". Another user has recorded this mother for this person.`
              );
            }
          } else {
            newSuggestions.push(
              `Consider adding mother information to "${currentMember.name}". Another user has recorded a mother for this person.`
            );
          }
        } catch (err) {
          newSuggestions.push(
            `Consider adding mother information to "${currentMember.name}". Another user has recorded a mother for this person.`
          );
        }
      }
      
      return newSuggestions;
    } catch (error) {
      return newSuggestions;
    }
  }

  // Add partner relationship suggestions - directly check for partner data regardless of other similarities
  private async addPartnerRelationshipSuggestions(
    currentMember: FamilyMemberWithId,
    otherMember: FamilyMemberWithId,
    suggestions: string[]
  ): Promise<string[]> {
    const newSuggestions = [...suggestions]; // Create a new array to hold suggestions
    
    try {
      // Check if other member has partners that current member doesn't have
      if (otherMember.partnerId && Array.isArray(otherMember.partnerId) && otherMember.partnerId.length > 0) {
        // Get current member's partners if any
        const currentPartnerIds = Array.isArray(currentMember.partnerId) 
          ? currentMember.partnerId.map(id => id.toString()) 
          : [];
        
        // Check each partner in other member that's not in current member
        for (const partnerId of otherMember.partnerId) {
          // Skip if this partner is already in current member's partners
          if (currentPartnerIds.includes(partnerId.toString())) {
            continue;
          }
          
          try {
            const partner = await this.familyMemberModel.findById(partnerId).exec() as FamilyMemberWithId;
            if (partner) {
              // Prevent circular references - don't suggest adding yourself as your own partner
              const isSamePerson = partner._id.toString() === currentMember._id.toString();
              // Also prevent suggesting the same name (likely the same person)
              const isSameName = partner.name.toLowerCase().trim() === currentMember.name.toLowerCase().trim();
              
              if (!isSamePerson && !isSameName) {
                newSuggestions.push(
                  `Consider adding partner "${partner.name}" to "${currentMember.name}". Another user has recorded this partnership.`
                );
              }
            }
          } catch (err) {
            // Skip this partner if there's an error
          }
        }
      }
      
      return newSuggestions;
    } catch (error) {
      return newSuggestions;
    }
  }

  // Helper method to extract surname from full name
  private extractSurnameFromName(name: string): string {
    if (!name) return '';
    const nameParts = name.trim().split(' ');
    return nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  }

  // Helper method to normalize name for comparison
  private normalizeNameForComparison(name: string): string {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  @Get('member-similarities/:memberId')
  async getMemberSimilaritiesCount(
    @Request() req,
    @Param('memberId') memberId: string,
  ) {
    try {
      const userId = req.user.id;
      console.log(`Getting suggestions for member ID ${memberId} and user ID ${userId}`);
      
      // Find the member and ensure it belongs to the current user
      const member = await this.familyMemberModel.findOne({
        _id: memberId,
        userId: new Types.ObjectId(userId),
      }).exec() as unknown as FamilyMemberWithId;
      
      if (!member) {
        console.log(`Member ${memberId} not found or user doesn't have access`);
        throw new HttpException(
          'Family member not found or you do not have permission to access it',
          HttpStatus.NOT_FOUND,
        );
      }
      
      console.log(`Found member: ${member.name}`);
      
      // Get all family members from other users
      const otherUserMembers = await this.familyMemberModel
        .find({ userId: { $ne: new Types.ObjectId(userId) } })
        .exec() as unknown as FamilyMemberWithId[];
      
      console.log(`Found ${otherUserMembers.length} members from other users`);
      
      let similarityCount = 0;
      let suggestionCount = 0;
      const similarMembers: Array<{
        memberId: string;
        name: string;
        similarity: number;
        similarFields: string[];
        userId: string;
        suggestions: string[];
      }> = [];
      
      // Get member's normalized full name
      const memberFullName = this.normalizeNameForComparison(member.name);
      console.log(`Current member normalized name: "${memberFullName}"`);
      
      // Process each member from other users
      for (const otherMember of otherUserMembers) {
        // Get other member's normalized full name
        const otherFullName = this.normalizeNameForComparison(otherMember.name);
        
        // Check for EXACT full name match (normalized)
        const exactNameMatch = memberFullName === otherFullName && memberFullName !== '';
        
        if (exactNameMatch) {
          console.log(`Found exact match: "${member.name}" matches "${otherMember.name}"`);
          similarityCount++;
          
          // Get similar fields for backward compatibility
          const { similarFields } = this.familyMemberSimilarityService.calculateMemberSimilarity(
            member,
            otherMember
          );
          
          // Generate suggestions based on differences
          const suggestions = await this.generateSuggestions(member, otherMember, similarFields);
          console.log(`Generated ${suggestions.length} suggestions for match between "${member.name}" and "${otherMember.name}"`);
          
          suggestionCount += suggestions.length;
          
          // Only add to similar members list if we have suggestions
          if (suggestions.length > 0) {
            // Add to similar members list for detailed info
            similarMembers.push({
              memberId: otherMember._id.toString(),
              name: otherMember.name,
              similarity: 1.0, // We only use exact matches now, so similarity is always 1.0
              similarFields,
              userId: otherMember.userId.toString(),
              suggestions
            });
          }
        }
      }
      
      // Always return a valid structure even if no suggestions or similar members are found
      const responseData = { 
        count: similarityCount,
        suggestionCount,
        similarMembers: similarMembers,
        hasMore: false
      };
      
      console.log(`Total: ${similarityCount} similar members found, ${suggestionCount} total suggestions`);
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Member similarities count retrieved successfully',
        data: responseData
      };
    } catch (error) {
      console.error("Error in getMemberSimilaritiesCount:", error);
      throw new HttpException(
        error.message || 'Error retrieving member similarities count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mark a suggestion as processed for a specific member
   */
  @Post('mark-suggestion-processed')
  async markSuggestionProcessed(
    @Request() req,
    @Body() body: { memberId: string; suggestionText: string },
  ) {
    try {
      const userId = req.user.id;
      const { memberId, suggestionText } = body;
      
      if (!memberId || !suggestionText) {
        throw new HttpException(
          'Member ID and suggestion text are required',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      const result = await this.notificationService.markSuggestionAsProcessed(
        userId,
        memberId,
        suggestionText,
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Suggestion marked as processed successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error marking suggestion as processed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get processed suggestions for a specific member
   */
  @Get('processed-suggestions/:memberId')
  async getProcessedSuggestions(
    @Request() req,
    @Param('memberId') memberId: string,
  ) {
    try {
      const userId = req.user.id;
      
      if (!memberId) {
        throw new HttpException(
          'Member ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      const processedSuggestions = await this.notificationService.getProcessedSuggestions(
        userId,
        memberId,
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Processed suggestions retrieved successfully',
        data: processedSuggestions,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error retrieving processed suggestions',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}