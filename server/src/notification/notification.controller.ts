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
              const suggestions = this.generateSuggestions(currentMember, otherMember, similarFields);
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
  private generateSuggestions(
    currentMember: FamilyMemberWithId,
    otherMember: FamilyMemberWithId,
    similarFields: string[]
  ): string[] {
    const suggestions: string[] = [];
    
    // Get surnames for comparison
    const surname1 = this.extractSurnameFromName(currentMember.name);
    const surname2 = this.extractSurnameFromName(otherMember.name);
    
    // Get first names for comparison
    const firstName1 = currentMember.name ? currentMember.name.split(' ')[0] : '';
    const firstName2 = otherMember.name ? otherMember.name.split(' ')[0] : '';
    
    // Check if they have the same name components
    const hasSameFirstName = firstName1 && firstName2 && firstName1.toLowerCase() === firstName2.toLowerCase();
    const hasSameSurname = surname1 && surname2 && surname1.toLowerCase() === surname2.toLowerCase();
    
    // Check for high similarity in name components
    const hasSimilarFirstName = similarFields.includes('firstName');
    const hasSimilarSurname = similarFields.includes('surname');
    const hasSimilarFullName = similarFields.includes('fullName');
    
    // We can generate suggestions in various cases:
    // 1. Exact match on both first name and surname (strict equality)
    // 2. Exact match on full name (which might not be caught by the components)
    // 3. High similarity on name components with at least 3 similar fields total
    
    // First, check for exact name matches
    const hasExactNameMatch = hasSameFirstName && hasSameSurname; 
    
    // Then check for full name equality (as a fallback)
    const hasFullNameEquality = currentMember.name && otherMember.name && 
                              currentMember.name.toLowerCase() === otherMember.name.toLowerCase();
    
    // Finally, check for high similarity in multiple fields
    const hasHighSimilarity = similarFields.length >= 3 && 
                             (hasSimilarFirstName || hasSimilarSurname || hasSimilarFullName);
    
    // We will generate suggestions if any of the conditions are met
    const shouldGenerateSuggestions = hasExactNameMatch || hasFullNameEquality || hasHighSimilarity;
    
    console.log(`Same first name: ${hasSameFirstName}, Same surname: ${hasSameSurname}`);
    console.log(`Full name equality: ${hasFullNameEquality}, High similarity: ${hasHighSimilarity}`);
    console.log(`Should generate suggestions: ${shouldGenerateSuggestions}`);
    
    // For identical names that might not be caught by the similarity algorithm
    if (!shouldGenerateSuggestions && currentMember.name && otherMember.name) {
      if (currentMember.name.toLowerCase() === otherMember.name.toLowerCase()) {
        // This is the same person between different users, add suggestions
        
        // Status differences
        if (currentMember.status && otherMember.status) {
          if (currentMember.status !== otherMember.status) {
            if (currentMember.status === 'alive' && otherMember.status === 'dead') {
              suggestions.push(
                `Consider updating status to "deceased" for "${currentMember.name}". Another user has recorded this person as deceased.`
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
                `Confirm deceased status for "${currentMember.name}". Another user has also recorded this person as deceased.`
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
        if (currentMember.country && otherMember.country && currentMember.country !== otherMember.country) {
          suggestions.push(
            `Consider updating country from "${currentMember.country}" to "${otherMember.country}" for "${currentMember.name}". Another user has recorded a different country.`
          );
        } else if (!currentMember.country && otherMember.country) {
          suggestions.push(
            `Consider adding country "${otherMember.country}" for "${currentMember.name}". Another user has recorded this country.`
          );
        } else if (currentMember.country && otherMember.country && currentMember.country === otherMember.country) {
          suggestions.push(
            `Confirm country "${currentMember.country}" for "${currentMember.name}". Another user has recorded the same country.`
          );
        }
        
        // Return early since we've handled this special case
        return suggestions;
      }
    }
    
    // Skip name suggestions when we have exact matches
    if (shouldGenerateSuggestions && !(hasExactNameMatch || hasFullNameEquality)) {
      // First name difference suggestion
      if (hasSimilarFirstName && !hasSameFirstName) {
        suggestions.push(
          `Consider checking the first name "${firstName1}" vs "${firstName2}" for potential correction.`
        );
      }
      
      // Surname difference suggestion
      if (hasSimilarSurname && !hasSameSurname) {
        suggestions.push(
          `Consider checking the surname "${surname1}" vs "${surname2}" for potential correction.`
        );
      }
    }
    
    // Check status differences - only generate if we should based on name similarity
    if (shouldGenerateSuggestions && currentMember.status && otherMember.status && currentMember.status !== otherMember.status) {
      // Only make suggestions for actual status differences between alive/dead, not unknown
      if (currentMember.status !== 'unknown' && otherMember.status !== 'unknown') {
        // If current member is alive but other member is dead, suggest updating status
        if (currentMember.status === 'alive' && otherMember.status === 'dead') {
          suggestions.push(
            `Consider updating status to "deceased" for "${currentMember.name}". Another user has recorded "${otherMember.name}" as deceased.`
          );
        } 
        // If current member is dead but other member is alive, suggest verifying status
        else if (currentMember.status === 'dead' && otherMember.status === 'alive') {
          suggestions.push(
            `Verify status of "${currentMember.name}". Another user has recorded "${otherMember.name}" as alive.`
          );
        }
      }
    }
    
    // Add suggestions for identical information that might be useful to confirm
    // If members are extremely similar, suggest confirming the information
    if (shouldGenerateSuggestions && similarFields.length >= 3) {
      if (currentMember.status === otherMember.status && currentMember.status === 'dead') {
        suggestions.push(
          `Confirm deceased status for "${currentMember.name}". Another user has also recorded this person as deceased.`
        );
      }
      
      if (currentMember.birthDate && otherMember.birthDate && 
          new Date(currentMember.birthDate).toISOString().split('T')[0] === 
          new Date(otherMember.birthDate).toISOString().split('T')[0]) {
        suggestions.push(
          `Confirm birth date for "${currentMember.name}". Another user has recorded the same birth date.`
        );
      }
      
      if (currentMember.deathDate && otherMember.deathDate && 
          new Date(currentMember.deathDate).toISOString().split('T')[0] === 
          new Date(otherMember.deathDate).toISOString().split('T')[0]) {
        suggestions.push(
          `Confirm death date for "${currentMember.name}". Another user has recorded the same death date.`
        );
      }
      
      if (currentMember.country && otherMember.country && currentMember.country === otherMember.country) {
        suggestions.push(
          `Confirm country "${currentMember.country}" for "${currentMember.name}". Another user has recorded the same country.`
        );
      }
    }
    
    // Check for birth date differences - only if we should generate suggestions
    if (shouldGenerateSuggestions && currentMember.birthDate && otherMember.birthDate) {
      const date1 = new Date(currentMember.birthDate);
      const date2 = new Date(otherMember.birthDate);
      
      if (Math.abs(date1.getTime() - date2.getTime()) > 86400000) { // More than 1 day difference
        const date1Str = date1.toISOString().split('T')[0];
        const date2Str = date2.toISOString().split('T')[0];
        
        suggestions.push(
          `Consider updating birth date to ${date2Str} for "${currentMember.name}". Another user has recorded "${otherMember.name}" with this birth date.`
        );
      }
    } else if (shouldGenerateSuggestions && !currentMember.birthDate && otherMember.birthDate) {
      // First member is missing birth date
      const dateStr = new Date(otherMember.birthDate).toISOString().split('T')[0];
      suggestions.push(
        `Consider adding birth date (${dateStr}) for "${currentMember.name}". Another user has recorded this birth date for "${otherMember.name}".`
      );
    }
    
    // Check for death date differences - only if we should generate suggestions
    if (shouldGenerateSuggestions && currentMember.deathDate && otherMember.deathDate) {
      const date1 = new Date(currentMember.deathDate);
      const date2 = new Date(otherMember.deathDate);
      
      if (Math.abs(date1.getTime() - date2.getTime()) > 86400000) { // More than 1 day difference
        const date1Str = date1.toISOString().split('T')[0];
        const date2Str = date2.toISOString().split('T')[0];
        
        suggestions.push(
          `Consider updating death date to ${date2Str} for "${currentMember.name}". Another user has recorded "${otherMember.name}" with this death date.`
        );
      }
    } else if (shouldGenerateSuggestions && !currentMember.deathDate && otherMember.deathDate) {
      // First member is missing death date
      const dateStr = new Date(otherMember.deathDate).toISOString().split('T')[0];
      suggestions.push(
        `Consider adding death date (${dateStr}) for "${currentMember.name}". Another user has recorded this death date for "${otherMember.name}".`
      );
    }
    
    // Check for country differences - only if we should generate suggestions
    if (shouldGenerateSuggestions && currentMember.country && otherMember.country && currentMember.country !== otherMember.country) {
      suggestions.push(
        `Consider updating country to "${otherMember.country}" for "${currentMember.name}". Another user has recorded "${otherMember.name}" with this country.`
      );
    } else if (shouldGenerateSuggestions && !currentMember.country && otherMember.country) {
      // First member is missing country
      suggestions.push(
        `Consider adding country "${otherMember.country}" for "${currentMember.name}". Another user has recorded this country for "${otherMember.name}".`
      );
    }
    
    return suggestions;
  }

  // Helper method to extract surname from full name
  private extractSurnameFromName(name: string): string {
    if (!name) return '';
    const nameParts = name.trim().split(' ');
    return nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
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
      
      console.log(`Found member: ${member.name}${member.surname ? ' ' + member.surname : ''}`);
      
      // Get all family members from other users
      const otherUserMembers = await this.familyMemberModel
        .find({ userId: { $ne: new Types.ObjectId(userId) } })
        .exec() as unknown as FamilyMemberWithId[];
      
      console.log(`Found ${otherUserMembers.length} members from other users`);
      console.log('Other users family members:');
      otherUserMembers.forEach((m, i) => {
        console.log(`  ${i+1}. ${m.name} (User ID: ${m.userId})`);
      });
      
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
      
      for (const otherMember of otherUserMembers) {
        console.log(`\nComparing with: ${otherMember.name}`);
        const { similarity, similarFields } = this.familyMemberSimilarityService.calculateMemberSimilarity(
          member,
          otherMember
        );
        
        console.log(`Similarity score: ${similarity.toFixed(2)}, similar fields: ${similarFields.join(', ')}`);
        
        // If similarity is above threshold and we have at least one similar field
        if (similarity > 0.7 && similarFields.length > 0) {
          similarityCount++;
          console.log(`Found similar member: ${otherMember.name} (similarity: ${similarity.toFixed(2)})`);
          console.log(`Similar fields: ${similarFields.join(', ')}`);
          
          // Generate suggestions based on differences
          const suggestions = this.generateSuggestions(member, otherMember, similarFields);
          suggestionCount += suggestions.length;
          
          console.log(`Generated ${suggestions.length} suggestions:`);
          suggestions.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
          
          // Add to similar members list for detailed info
          similarMembers.push({
            memberId: otherMember._id.toString(),
            name: otherMember.name,
            similarity,
            similarFields,
            userId: otherMember.userId.toString(),
            suggestions
          });
        }
      }
      
      console.log(`Total: ${similarityCount} similar members, ${suggestionCount} suggestions`);
      
      const responseData = { 
        count: similarityCount,
        suggestionCount,
        similarMembers: similarMembers, // Return all similar members without limiting
        hasMore: false // Since we're not limiting, there are never more items
      };
      
      console.log("Response data:", JSON.stringify(responseData, null, 2));
      
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
}