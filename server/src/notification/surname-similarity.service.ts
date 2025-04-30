import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FamilyMember, FamilyMemberDocument } from '../family/family-member.schema';
import { Notification, NotificationDocument } from './notification.schema';
import { SimilarMember, SimilarSurnameGroup, SimilarityCluster, FamilyMemberWithId } from './similar-member.interface';

@Injectable()
export class SurnameSimilarityService {
  constructor(
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Calculate similarity between two surnames using Levenshtein distance
   * @param surname1 First surname
   * @param surname2 Second surname
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(surname1: string, surname2: string): number {
    if (!surname1 || !surname2) return 0;
    
    // Convert to lowercase for case-insensitive comparison
    const s1 = surname1.toLowerCase();
    const s2 = surname2.toLowerCase();
    
    // If surnames are identical, return 1
    if (s1 === s2) return 1;
    
    // Calculate Levenshtein distance
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];
    
    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1.charAt(i - 1) === s2.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    // Calculate similarity score (0 to 1)
    const maxLen = Math.max(len1, len2);
    const distance = matrix[len1][len2];
    return 1 - distance / maxLen;
  }

  /**
   * Get surname from family member
   * @param member Family member object
   * @returns Surname of the family member
   */
  private getSurname(member: FamilyMember | FamilyMemberWithId): string {
    // If surname field exists and has value, use it
    if (member.surname) return member.surname;
    
    // Fallback to extracting from full name if surname field is not available
    if (!member.name) return '';
    const nameParts = member.name.trim().split(' ');
    return nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  }

  /**
   * Check for similar surnames when a new family member is added
   * Compares within the user's own family tree and across all users
   * @param newMemberId ID of the newly added family member
   * @param userId ID of the user who owns the family tree
   */
  async checkForSimilarSurnames(newMemberId: string, userId: string): Promise<void> {
    try {
      // Get the new family member
      const newMember = await this.familyMemberModel.findById(newMemberId).exec();
      if (!newMember) return;

      const newMemberSurname = this.getSurname(newMember);
      if (!newMemberSurname) return;

      const userObjectId = new Types.ObjectId(userId);
      
      // First check within the user's own family tree
      await this.checkSimilarSurnamesWithinUser(newMemberId, newMemberSurname, userObjectId);
      
      // Then check across all other users' family trees
      await this.checkSimilarSurnamesAcrossUsers(newMemberSurname, userObjectId);
      
    } catch (error) {
      console.error('Error checking for similar surnames:', error);
    }
  }

  /**
   * Check for similar surnames within a user's own family tree
   * @param newMemberId ID of the newly added family member
   * @param newMemberSurname Surname of the new family member
   * @param userObjectId ObjectId of the user
   */
  private async checkSimilarSurnamesWithinUser(
    newMemberId: string, 
    newMemberSurname: string, 
    userObjectId: Types.ObjectId
  ): Promise<void> {
    try {
      // Get all family members for this user except the new member
      const allFamilyMembers = await this.familyMemberModel
        .find({ userId: userObjectId, _id: { $ne: newMemberId } })
        .exec() as FamilyMemberWithId[];

      const similarMembers: SimilarMember[] = [];

      // Compare surnames
      for (const member of allFamilyMembers) {
        const memberSurname = this.getSurname(member);
        if (!memberSurname) continue;

        const similarity = this.calculateSimilarity(newMemberSurname, memberSurname);
        
        // If similarity is above threshold (0.7 = 70% similar)
        if (similarity > 0.7 && similarity < 1) {
          similarMembers.push({
            memberId: member._id,
            name: member.name,
            surname: memberSurname,
            similarity: similarity
          });
        }
      }

      // If similar surnames found, create notification
      if (similarMembers.length > 0) {
        const message = `We found ${similarMembers.length} family member(s) with surnames similar to "${newMemberSurname}" in your family tree. They might be related.`;
        
        await this.notificationModel.create({
          userId: userObjectId,
          message,
          type: 'surname_similarity',
          read: false,
          metadata: {
            newMemberSurname,
            similarMembers
          },
          relatedFamilyMembers: similarMembers.map(m => m.memberId)
        });
      }
    } catch (error) {
      console.error('Error checking for similar surnames within user:', error);
    }
  }

  /**
   * Check for similar surnames across all other users' family trees
   * @param surname Surname to compare
   * @param currentUserId ObjectId of the current user
   */
  private async checkSimilarSurnamesAcrossUsers(
    surname: string,
    currentUserId: Types.ObjectId
  ): Promise<void> {
    try {
      // Get all family members from other users
      const otherUsersFamilyMembers = await this.familyMemberModel
        .find({ userId: { $ne: currentUserId } })
        .exec() as FamilyMemberWithId[];

      const similarMembersByUser = new Map<string, SimilarMember[]>();

      // Compare surnames
      for (const member of otherUsersFamilyMembers) {
        const memberSurname = this.getSurname(member);
        if (!memberSurname) continue;

        const similarity = this.calculateSimilarity(surname, memberSurname);
        
        // If similarity is above threshold (0.7 = 70% similar)
        if (similarity > 0.7 && similarity < 1) {
          const userId = member.userId.toString();
          
          if (!similarMembersByUser.has(userId)) {
            similarMembersByUser.set(userId, []);
          }
          
          const membersList = similarMembersByUser.get(userId);
          if (membersList) {
            membersList.push({
              memberId: member._id,
              name: member.name,
              surname: memberSurname,
              similarity: similarity
            });
          }
        }
      }

      // Create notification for each user that has similar surnames
      if (similarMembersByUser.size > 0) {
        const totalSimilarMembers = Array.from(similarMembersByUser.values())
          .reduce((total, members) => total + members.length, 0);
        
        const message = `We found ${totalSimilarMembers} family member(s) with surnames similar to "${surname}" in other users' family trees. They might be related to your family.`;
        
        await this.notificationModel.create({
          userId: currentUserId,
          message,
          type: 'cross_user_surname_similarity',
          read: false,
          metadata: {
            surname,
            similarMembersByUser: Object.fromEntries(similarMembersByUser)
          },
          relatedFamilyMembers: []
        });
      }
    } catch (error) {
      console.error('Error checking for similar surnames across users:', error);
    }
  }

  /**
   * Analyze all family members for a user to find similar surnames
   * within their own family tree and across all other users
   * @param userId ID of the user
   */
  async analyzeFamilyTreeForSimilarSurnames(userId: string): Promise<void> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      
      // First analyze within the user's own family tree
      await this.analyzeSimilaritiesWithinUser(userObjectId);
      
      // Then analyze across all users
      await this.analyzeSimilaritiesAcrossUsers(userObjectId);
      
    } catch (error) {
      console.error('Error analyzing family tree for similar surnames:', error);
    }
  }

  /**
   * Analyze similarities within a user's own family tree
   * @param userObjectId ObjectId of the user
   */
  private async analyzeSimilaritiesWithinUser(userObjectId: Types.ObjectId): Promise<void> {
    try {
      const allFamilyMembers = await this.familyMemberModel
        .find({ userId: userObjectId })
        .exec() as FamilyMemberWithId[];

      const surnameGroups = new Map<string, FamilyMemberWithId[]>();

      // Group family members by surname
      for (const member of allFamilyMembers) {
        const surname = this.getSurname(member);
        if (!surname) continue;

        if (!surnameGroups.has(surname)) {
          surnameGroups.set(surname, []);
        }
        const group = surnameGroups.get(surname);
        if (group) {
          group.push(member);
        }
      }

      // Find similar surname groups
      const processedSurnames = new Set<string>();
      const similarityClusters: SimilarityCluster[] = [];

      for (const [surname1, members1] of surnameGroups.entries()) {
        if (processedSurnames.has(surname1)) continue;
        processedSurnames.add(surname1);

        const similarGroup: SimilarityCluster = {
          baseSurname: surname1,
          members: [...members1],
          similarSurnames: []
        };

        for (const [surname2, members2] of surnameGroups.entries()) {
          if (surname1 === surname2 || processedSurnames.has(surname2)) continue;

          const similarity = this.calculateSimilarity(surname1, surname2);
          if (similarity > 0.7) {
            similarGroup.members.push(...members2);
            similarGroup.similarSurnames.push({
              surname: surname2,
              similarity,
              members: members2
            });
            processedSurnames.add(surname2);
          }
        }

        if (similarGroup.similarSurnames.length > 0) {
          similarityClusters.push(similarGroup);
        }
      }

      // Create notifications for each cluster
      for (const cluster of similarityClusters) {
        const surnameList = [cluster.baseSurname, ...cluster.similarSurnames.map(s => s.surname)].join('", "');
        const message = `We found similar surnames in your family tree: "${surnameList}". These family members might be related.`;
        
        await this.notificationModel.create({
          userId: userObjectId,
          message,
          type: 'surname_similarity',
          read: false,
          metadata: {
            similarityCluster: cluster
          },
          relatedFamilyMembers: cluster.members.map(m => m._id)
        });
      }
    } catch (error) {
      console.error('Error analyzing similarities within user:', error);
    }
  }

  /**
   * Analyze similarities across all users' family trees
   * @param currentUserId ObjectId of the current user
   */
  public async analyzeSimilaritiesAcrossUsers(currentUserId: Types.ObjectId): Promise<void> {
    try {
      console.log(`Analyzing cross-user similarities for user ${currentUserId}`);
      
      // Get all family members for the current user
      const currentUserMembers = await this.familyMemberModel
        .find({ userId: currentUserId })
        .exec() as FamilyMemberWithId[];
      
      console.log(`Found ${currentUserMembers.length} family members for current user`);
      
      // Get all family members from other users
      const otherUsersFamilyMembers = await this.familyMemberModel
        .find({ userId: { $ne: currentUserId } })
        .exec() as FamilyMemberWithId[];
      
      console.log(`Found ${otherUsersFamilyMembers.length} family members from other users`);
      
      if (currentUserMembers.length === 0 || otherUsersFamilyMembers.length === 0) {
        console.log('No family members to compare.');
        return;
      }

      // Create a map of all similarities to avoid duplicate notifications
      const foundSimilarities = new Map<string, {
        currentMember: FamilyMemberWithId,
        otherMember: FamilyMemberWithId,
        similarity: number
      }[]>();

      // Directly compare each current member with each other user's members
      for (const currentMember of currentUserMembers) {
        const currentSurname = this.getSurname(currentMember);
        if (!currentSurname) continue;
        
        console.log(`Checking current user surname: ${currentSurname}`);
        
        for (const otherMember of otherUsersFamilyMembers) {
          const otherSurname = this.getSurname(otherMember);
          if (!otherSurname) continue;
          
          const similarity = this.calculateSimilarity(currentSurname, otherSurname);
          
          // If similarity is above threshold (0.7 = 70% similar) but not exact match
          if (similarity > 0.7 && similarity < 1) {
            console.log(`Found similar surname: ${currentSurname} vs ${otherSurname} = ${similarity}`);
            
            const key = `${currentSurname}|${otherSurname}`;
            if (!foundSimilarities.has(key)) {
              foundSimilarities.set(key, []);
            }
            
            const similarities = foundSimilarities.get(key);
            if (similarities) {
              similarities.push({
                currentMember,
                otherMember,
                similarity
              });
            }
          }
        }
      }
      
      // Create notifications for each distinct surname similarity
      for (const [key, similarities] of foundSimilarities.entries()) {
        if (similarities.length === 0) continue;
        
        const [currentSurname, otherSurname] = key.split('|');
        const firstSimilarity = similarities[0];
        
        // Group by user ID for better organization
        const similarMembersByUser = new Map<string, SimilarMember[]>();
        
        for (const similarity of similarities) {
          const userId = similarity.otherMember.userId.toString();
          
          if (!similarMembersByUser.has(userId)) {
            similarMembersByUser.set(userId, []);
          }
          
          const membersList = similarMembersByUser.get(userId);
          if (membersList) {
            membersList.push({
              memberId: similarity.otherMember._id,
              name: similarity.otherMember.name,
              surname: this.getSurname(similarity.otherMember),
              similarity: similarity.similarity
            });
          }
        }
        
        // Create a notification
        const totalSimilarMembers = similarities.length;
        const message = `We found ${totalSimilarMembers} family member(s) with surnames similar to "${currentSurname}" (${otherSurname}) in other users' family trees. They might be related to your family.`;
        
        console.log(`Creating notification: ${message}`);
        
        try {
          await this.notificationModel.create({
            userId: currentUserId,
            message,
            type: 'cross_user_surname_similarity',
            read: false,
            metadata: {
              currentMemberName: firstSimilarity.currentMember.name,
              currentMemberSurname: currentSurname,
              otherSurname: otherSurname,
              similarity: firstSimilarity.similarity,
              similarMembersByUser: Object.fromEntries(similarMembersByUser)
            },
            relatedFamilyMembers: [firstSimilarity.currentMember._id]
          });
          
          console.log('Notification created successfully');
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
      
    } catch (error) {
      console.error('Error analyzing similarities across users:', error);
    }
  }
  
  /**
   * Debug method to check for cross-user surname similarities
   * @param userId ID of the current user
   * @returns Debug information
   */
  async debugCrossUserSimilarities(userId: string): Promise<any> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      
      // Get all family members for the current user
      const currentUserMembers = await this.familyMemberModel
        .find({ userId: userObjectId })
        .exec() as FamilyMemberWithId[];
      
      // Get all family members from other users
      const otherUsersFamilyMembers = await this.familyMemberModel
        .find({ userId: { $ne: userObjectId } })
        .exec() as FamilyMemberWithId[];
      
      // Get the count of family members by userId
      const userCounts = new Map<string, number>();
      const allFamilyMembers = await this.familyMemberModel.find().exec();
      for (const member of allFamilyMembers) {
        const userId = member.userId.toString();
        if (!userCounts.has(userId)) {
          userCounts.set(userId, 0);
        }
        const currentCount = userCounts.get(userId);
        if (currentCount !== undefined) {
          userCounts.set(userId, currentCount + 1);
        }
      }
      
      // Extract all the surnames from current user and other users
      const currentUserSurnames = currentUserMembers.map(member => ({
        name: member.name,
        surname: this.getSurname(member)
      }));
      
      const otherUsersSurnames = otherUsersFamilyMembers.map(member => ({
        name: member.name,
        surname: this.getSurname(member),
        userId: member.userId.toString()
      }));
      
      // Check similarities between current user and other users' surnames
      interface SimilarityInfo {
        currentUserSurname: string;
        currentUserName: string;
        otherUserSurname: string;
        otherUserName: string;
        otherUserId: string;
        similarity: number;
      }
      
      const similarities: SimilarityInfo[] = [];
      
      for (const current of currentUserSurnames) {
        if (!current.surname) continue;
        
        for (const other of otherUsersSurnames) {
          if (!other.surname) continue;
          
          const similarity = this.calculateSimilarity(current.surname, other.surname);
          if (similarity > 0.5) { // Lower threshold for debugging
            similarities.push({
              currentUserSurname: current.surname,
              currentUserName: current.name,
              otherUserSurname: other.surname,
              otherUserName: other.name,
              otherUserId: other.userId,
              similarity
            });
          }
        }
      }
      
      return {
        currentUserId: userId,
        totalUsers: userCounts.size,
        userCounts: Object.fromEntries(userCounts),
        currentUserMembersCount: currentUserMembers.length,
        otherUsersMembersCount: otherUsersFamilyMembers.length,
        currentUserSurnames,
        otherUsersSurnames: otherUsersSurnames.slice(0, 10), // Limit the output
        similarities,
        allOtherUsers: Array.from(new Set(otherUsersFamilyMembers.map(m => m.userId.toString())))
      };
      
    } catch (error) {
      console.error('Error debugging cross-user similarities:', error);
      throw error;
    }
  }
}