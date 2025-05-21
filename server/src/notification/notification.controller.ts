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
    
    // Get first names and surnames (trimmed, lowercased)
    const firstName1 = currentMember.name ? currentMember.name.split(' ')[0].trim().toLowerCase() : '';
    const firstName2 = otherMember.name ? otherMember.name.split(' ')[0].trim().toLowerCase() : '';
    
    // Get surnames properly - use the last part of the name
    const surname1 = this.extractSurnameFromName(currentMember.name).trim().toLowerCase();
    const surname2 = this.extractSurnameFromName(otherMember.name).trim().toLowerCase();

    // Check if basic name components match - relax requirements to allow for matching on first name if needed
    const hasSameFirstName = firstName1 === firstName2 && firstName1 !== '';
    const hasSameSurname = surname1 === surname2 && surname1 !== '';
    
    // RELAXED CHECK: Use either exact name match OR similarity check result to generate suggestions
    const shouldGenerateSuggestions = 
      // Either same first name AND surname
      (hasSameFirstName && hasSameSurname) || 
      // OR high name similarity as calculated by the similarity service
      (similarFields.includes('firstName') && similarFields.includes('surname')) ||
      similarFields.includes('fullName');
    
    // Log name comparison for debugging
    // console.log(`Name comparison: "${firstName1} ${surname1}" vs "${firstName2} ${surname2}"`);
    // console.log(`Same first name: ${hasSameFirstName}, Same surname: ${hasSameSurname}`);
    // console.log(`Should generate suggestions: ${shouldGenerateSuggestions}`);

    // Only generate suggestions if there's a good name match
    if (!shouldGenerateSuggestions) {
      // console.log("Names don't match well enough - no suggestions generated");
      return suggestions;
    }
    
    // console.log("Names match well enough - generating suggestions");
    
    // Check for parent relationship suggestions
    suggestions = await this.addParentRelationshipSuggestions(currentMember, otherMember, suggestions);
    // console.log(`After parent check, have ${suggestions.length} suggestions`);
    
    // Status differences
    if (currentMember.status && otherMember.status) {
      // console.log(`Checking status: ${currentMember.status} vs ${otherMember.status}`);
      if (currentMember.status !== otherMember.status) {
        if (currentMember.status === 'alive' && otherMember.status === 'dead') {
          suggestions.push(
            `Consider updating status to "dead" for "${currentMember.name}". Another user has recorded this person as dead.`
          );
          // console.log("Added suggestion for updating status to dead");
        } else if (currentMember.status === 'dead' && otherMember.status === 'alive') {
          suggestions.push(
            `Verify status of "${currentMember.name}". Another user has recorded this person as alive.`
          );
          // console.log("Added suggestion for verifying alive status");
        }
      } else {
        // Even for matching status, suggest confirming
        if (currentMember.status === 'dead') {
          suggestions.push(
            `Confirm dead status for "${currentMember.name}". Another user has also recorded this person as dead.`
          );
          // console.log("Added suggestion for confirming dead status");
        }
      }
    }
    
    // Birth date
    if (currentMember.birthDate && otherMember.birthDate) {
      const date1 = new Date(currentMember.birthDate);
      const date2 = new Date(otherMember.birthDate);
      
      // console.log(`Comparing birth dates: ${date1.toISOString()} vs ${date2.toISOString()}`);
      
      if (Math.abs(date1.getTime() - date2.getTime()) > 86400000) {
        const date1Str = date1.toISOString().split('T')[0];
        const date2Str = date2.toISOString().split('T')[0];
        
        suggestions.push(
          `Consider updating birth date from ${date1Str} to ${date2Str} for "${currentMember.name}". Another user has recorded a different birth date.`
        );
        // console.log("Added suggestion for updating birth date");
      } else {
        const date1Str = date1.toISOString().split('T')[0];
        suggestions.push(
          `Confirm birth date ${date1Str} for "${currentMember.name}". Another user has recorded the same birth date.`
        );
        // console.log("Added suggestion for confirming birth date");
      }
    } else if (!currentMember.birthDate && otherMember.birthDate) {
      const dateStr = new Date(otherMember.birthDate).toISOString().split('T')[0];
      suggestions.push(
        `Consider adding birth date (${dateStr}) for "${currentMember.name}". Another user has recorded this birth date.`
      );
      // console.log("Added suggestion for adding birth date");
    }
    
    // Death date
    if (currentMember.deathDate && otherMember.deathDate) {
      const date1 = new Date(currentMember.deathDate);
      const date2 = new Date(otherMember.deathDate);
      
      // console.log(`Comparing death dates: ${date1.toISOString()} vs ${date2.toISOString()}`);
      
      if (Math.abs(date1.getTime() - date2.getTime()) > 86400000) {
        const date1Str = date1.toISOString().split('T')[0];
        const date2Str = date2.toISOString().split('T')[0];
        
        suggestions.push(
          `Consider updating death date from ${date1Str} to ${date2Str} for "${currentMember.name}". Another user has recorded a different death date.`
        );
        // console.log("Added suggestion for updating death date");
      } else {
        const date1Str = date1.toISOString().split('T')[0];
        suggestions.push(
          `Confirm death date ${date1Str} for "${currentMember.name}". Another user has recorded the same death date.`
        );
        // console.log("Added suggestion for confirming death date");
      }
    } else if (!currentMember.deathDate && otherMember.deathDate) {
      const dateStr = new Date(otherMember.deathDate).toISOString().split('T')[0];
      suggestions.push(
        `Consider adding death date (${dateStr}) for "${currentMember.name}". Another user has recorded this death date.`
      );
      // console.log("Added suggestion for adding death date");
    }
    
    // Country
    if (currentMember.country && otherMember.country) {
      // console.log(`Comparing countries: "${currentMember.country}" vs "${otherMember.country}"`);
      if (currentMember.country !== otherMember.country) {
        suggestions.push(
          `Consider updating country from "${currentMember.country}" to "${otherMember.country}" for "${currentMember.name}". Another user has recorded a different country.`
        );
        // console.log("Added suggestion for updating country");
      } else {
        suggestions.push(
          `Confirm country "${currentMember.country}" for "${currentMember.name}". Another user has recorded the same country.`
        );
        // console.log("Added suggestion for confirming country");
      }
    } else if (!currentMember.country && otherMember.country) {
      suggestions.push(
        `Consider adding country "${otherMember.country}" for "${currentMember.name}". Another user has recorded this country.`
      );
      // console.log("Added suggestion for adding country");
    }
    
    // console.log(`Final suggestion count: ${suggestions.length}`);
    return suggestions;
  }

  // Add parent relationship suggestions - directly check for parent data regardless of other similarities
  private async addParentRelationshipSuggestions(
    currentMember: FamilyMemberWithId,
    otherMember: FamilyMemberWithId,
    suggestions: string[]
  ): Promise<string[]> {
    const newSuggestions = [...suggestions]; // Create a new array to hold suggestions
    
    // Since we're only calling this method after strict name matching,
    // the members have the same name and surname and are likely the same person in different trees
    
    try {
      // console.log(`Checking parent data for ${currentMember.name} (current) vs ${otherMember.name} (other)`);
      // console.log(`Current member parents: fatherId=${currentMember.fatherId}, motherId=${currentMember.motherId}`);
      // console.log(`Other member parents: fatherId=${otherMember.fatherId}, motherId=${otherMember.motherId}`);
      
      // Check father information - simpler check: if other member has a father and current doesn't
      if (otherMember.fatherId && !currentMember.fatherId) {
        try {
          // Try to find the father's name
          const father = await this.familyMemberModel.findById(otherMember.fatherId).exec();
          if (father) {
            newSuggestions.push(
              `Consider adding father "${father.name}" to "${currentMember.name}". Another user has recorded this father for this person.`
            );
            // console.log(`Added father suggestion for ${currentMember.name}`);
          } else {
            newSuggestions.push(
              `Consider adding father information to "${currentMember.name}". Another user has recorded a father for this person.`
            );
            // console.log(`Added generic father suggestion for ${currentMember.name}`);
          }
        } catch (err) {
          // console.error("Error finding father:", err);
          newSuggestions.push(
            `Consider adding father information to "${currentMember.name}". Another user has recorded a father for this person.`
          );
          // console.log(`Added generic father suggestion after error for ${currentMember.name}`);
        }
      }
      
      // Check mother information - simpler check: if other member has a mother and current doesn't
      if (otherMember.motherId && !currentMember.motherId) {
        try {
          // Try to find the mother's name
          const mother = await this.familyMemberModel.findById(otherMember.motherId).exec();
          if (mother) {
            newSuggestions.push(
              `Consider adding mother "${mother.name}" to "${currentMember.name}". Another user has recorded this mother for this person.`
            );
            // console.log(`Added mother suggestion for ${currentMember.name}`);
          } else {
            newSuggestions.push(
              `Consider adding mother information to "${currentMember.name}". Another user has recorded a mother for this person.`
            );
            // console.log(`Added generic mother suggestion for ${currentMember.name}`);
          }
        } catch (err) {
          // console.error("Error finding mother:", err);
          newSuggestions.push(
            `Consider adding mother information to "${currentMember.name}". Another user has recorded a mother for this person.`
          );
          // console.log(`Added generic mother suggestion after error for ${currentMember.name}`);
        }
      }
      
      return newSuggestions;
    } catch (error) {
      // console.error("Error in addParentRelationshipSuggestions:", error);
      return newSuggestions;
    }
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
      // console.log(`Getting suggestions for member ID ${memberId} and user ID ${userId}`);
      
      // Find the member and ensure it belongs to the current user
      const member = await this.familyMemberModel.findOne({
        _id: memberId,
        userId: new Types.ObjectId(userId),
      }).exec() as unknown as FamilyMemberWithId;
      
      if (!member) {
        // console.log(`Member ${memberId} not found or user doesn't have access`);
        throw new HttpException(
          'Family member not found or you do not have permission to access it',
          HttpStatus.NOT_FOUND,
        );
      }
      
      // console.log(`Found member: ${member.name}${member.surname ? ' ' + member.surname : ''}`);
      // console.log(`Member details: status=${member.status}, country=${member.country}, birthDate=${member.birthDate}, deathDate=${member.deathDate}`);
      // console.log(`Member parent info: fatherId=${member.fatherId}, motherId=${member.motherId}`);
      
      // Get all family members from other users
      const otherUserMembers = await this.familyMemberModel
        .find({ userId: { $ne: new Types.ObjectId(userId) } })
        .exec() as unknown as FamilyMemberWithId[];
      
      // console.log(`Found ${otherUserMembers.length} members from other users`);
      // console.log('Other users family members:');
      // otherUserMembers.forEach((m, i) => {
      //     if (i < 10) { // Limit logging to first 10 members
      //         console.log(`  ${i+1}. ${m.name} (User ID: ${m.userId}, status=${m.status}, country=${m.country})`);
      //         console.log(`     Parent info: fatherId=${m.fatherId}, motherId=${m.motherId}`);
      //     }
      // });
      
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
      
      // Process each member from other users
      for (const otherMember of otherUserMembers) {
        // console.log(`\nComparing with: ${otherMember.name} (country=${otherMember.country}, status=${otherMember.status})`);
        
        // Extract first names and surnames for comparison
        const firstName1 = member.name ? member.name.split(' ')[0].toLowerCase().trim() : '';
        const firstName2 = otherMember.name ? otherMember.name.split(' ')[0].toLowerCase().trim() : '';
        const surname1 = this.extractSurnameFromName(member.name).toLowerCase().trim();
        const surname2 = this.extractSurnameFromName(otherMember.name).toLowerCase().trim();
        
        // console.log(`Name comparison: "${firstName1} ${surname1}" vs "${firstName2} ${surname2}"`);
        // console.log(`Same first name: ${firstName1 === firstName2}, Same surname: ${surname1 === surname2}`);
        
        // Check for exact name match
        const exactNameMatch = firstName1 === firstName2 && surname1 === surname2 && surname1 !== '' && surname2 !== '';
        // console.log(`Exact name match: ${exactNameMatch}`);
        
        // Continue with similarity calculation regardless of exact name match
        const { similarity, similarFields } = this.familyMemberSimilarityService.calculateMemberSimilarity(
          member,
          otherMember
        );
        
        // console.log(`Similarity score: ${similarity.toFixed(2)}, similar fields: ${similarFields.join(', ')}`);
        
        // Generate suggestions if either we have high similarity OR exact name match
        if ((similarity > 0.6 && similarFields.length > 0) || exactNameMatch) {
          similarityCount++;
          // console.log(`Found similar member: ${otherMember.name} (similarity: ${similarity.toFixed(2)})`);
          // console.log(`Similar fields: ${similarFields.join(', ')}`);
          
          // Generate suggestions based on differences
          // console.log(`Generating suggestions for ${member.name} vs ${otherMember.name}...`);
          const suggestions = await this.generateSuggestions(member, otherMember, similarFields);
          
          // console.log(`Generated ${suggestions.length} suggestions:`);
          // suggestions.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
          
          suggestionCount += suggestions.length;
          
          // Only add to similar members list if we have suggestions
          if (suggestions.length > 0) {
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
        } else {
          // console.log(`Not similar enough or no similar fields - skipping suggestions`);
        }
      }
      
      // console.log(`Total: ${similarityCount} similar members, ${suggestionCount} suggestions`);
      
      // Always return a valid structure even if no suggestions or similar members are found
      const responseData = { 
        count: similarityCount,
        suggestionCount,
        similarMembers: similarMembers, // Return all similar members without limiting
        hasMore: false // Since we're not limiting, there are never more items
      };
      
      // console.log("Response data:", JSON.stringify(responseData, null, 2));
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Member similarities count retrieved successfully',
        data: responseData
      };
    } catch (error) {
      // console.error("Error in getMemberSimilaritiesCount:", error);
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
      
      // console.log(`Marking suggestion as processed for member ${memberId}: "${suggestionText}"`);
      
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
      // console.error("Error marking suggestion as processed:", error);
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
      
      // console.log(`Getting processed suggestions for member ${memberId} and user ${userId}`);
      
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
      // console.error("Error retrieving processed suggestions:", error);
      throw new HttpException(
        error.message || 'Error retrieving processed suggestions',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}