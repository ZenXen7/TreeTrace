import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FamilyMember, FamilyMemberDocument } from '../family/family-member.schema';
import { Notification, NotificationDocument } from './notification.schema';
import { SimilarMember, SimilarSurnameGroup, SimilarityCluster, FamilyMemberWithId } from './similar-member.interface';

@Injectable()
export class FamilyMemberSimilarityService {
  constructor(
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score between 0 and 1
   */
  private calculateStringSimilarity(str1: string | null | undefined, str2: string | null | undefined): number {
    if (!str1 || !str2) return 0;
    
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // If strings are identical, return 1
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
   * Calculate similarity between two dates
   * @param date1 First date
   * @param date2 Second date
   * @returns Similarity score (1 if same day, 0 if more than 10 years apart)
   */
  private calculateDateSimilarity(date1: Date | null | undefined, date2: Date | null | undefined): number {
    if (!date1 || !date2) return 0;
    
    // If dates are identical, return 1
    if (date1.getTime() === date2.getTime()) return 1;
    
    // Calculate difference in years (approximate)
    const diffYears = Math.abs(date1.getFullYear() - date2.getFullYear());
    
    // Use a threshold of 10 years - more than 10 years difference means 0 similarity
    if (diffYears > 10) return 0;
    
    // Linear scaling between 0 and 10 years
    return 1 - (diffYears / 10);
  }

  /**
   * Calculate overall similarity between two family members based on multiple fields
   * @param member1 First family member
   * @param member2 Second family member
   * @returns Object with overall similarity score and list of similar fields
   */
  public calculateMemberSimilarity(
    member1: FamilyMemberWithId,
    member2: FamilyMemberWithId
  ): { similarity: number; similarFields: string[] } {
    const similarFields: string[] = [];
    let totalSimilarity = 0;
    let fieldCount = 0;
    
    // Get basic name components
    const surname1 = this.getSurname(member1);
    const surname2 = this.getSurname(member2);
    const firstName1 = member1.name ? member1.name.split(' ')[0] : '';
    const firstName2 = member2.name ? member2.name.split(' ')[0] : '';
    
    console.log(`Comparing members: "${member1.name}" (${firstName1} ${surname1}) vs "${member2.name}" (${firstName2} ${surname2})`);
    
    // Check if they have the same last name
    const hasSameSurname = surname1 && surname2 && surname1.toLowerCase() === surname2.toLowerCase();
    
    // Check if they have the same first name
    const hasSameFirstName = firstName1 && firstName2 && firstName1.toLowerCase() === firstName2.toLowerCase();
    
    console.log(`Same first name: ${hasSameFirstName}, Same surname: ${hasSameSurname}`);
    
    // Compare surname
    const surnameSimilarity = this.calculateStringSimilarity(surname1, surname2);
    if (surnameSimilarity > 0.7) {
      similarFields.push('surname');
      totalSimilarity += surnameSimilarity;
      fieldCount++;
      console.log(`Surname similarity: ${surnameSimilarity.toFixed(2)}`);
    }
    
    // Compare first name (extracted from full name)
    const firstNameSimilarity = this.calculateStringSimilarity(firstName1, firstName2);
    if (firstNameSimilarity > 0.7) {
      similarFields.push('firstName');
      totalSimilarity += firstNameSimilarity;
      fieldCount++;
      console.log(`First name similarity: ${firstNameSimilarity.toFixed(2)}`);
    }
    
    // Compare full name
    const fullNameSimilarity = this.calculateStringSimilarity(member1.name, member2.name);
    if (fullNameSimilarity > 0.7) {
      similarFields.push('fullName');
      totalSimilarity += fullNameSimilarity;
      fieldCount++;
      console.log(`Full name similarity: ${fullNameSimilarity.toFixed(2)}`);
    }
    
    // Compare status (alive, dead, unknown)
    if (member1.status && member2.status) {
      // For status, we want exact matches or no match
      if (member1.status === member2.status) {
        similarFields.push('status');
        totalSimilarity += 1;
        fieldCount++;
      } else if (member1.status !== 'unknown' && member2.status !== 'unknown') {
        // Different statuses (alive vs dead) aren't similar but are important to note
        similarFields.push('status');
        // Don't add to similarity score
        fieldCount++;
      }
    }
    
    // Compare birth date
    if (member1.birthDate && member2.birthDate) {
      const birthDateSimilarity = this.calculateDateSimilarity(member1.birthDate, member2.birthDate);
      if (birthDateSimilarity > 0.7) {
        similarFields.push('birthDate');
        totalSimilarity += birthDateSimilarity;
        fieldCount++;
      }
    }
    
    // Compare death date
    if (member1.deathDate && member2.deathDate) {
      const deathDateSimilarity = this.calculateDateSimilarity(member1.deathDate, member2.deathDate);
      if (deathDateSimilarity > 0.7) {
        similarFields.push('deathDate');
        totalSimilarity += deathDateSimilarity;
        fieldCount++;
      }
    }
    
    // Compare country
    if (member1.country && member2.country) {
      const countrySimilarity = this.calculateStringSimilarity(member1.country, member2.country);
      if (countrySimilarity > 0.7) {
        similarFields.push('country');
        totalSimilarity += countrySimilarity;
        fieldCount++;
      }
    }
    
    // Calculate average similarity score
    const overallSimilarity = fieldCount > 0 ? totalSimilarity / fieldCount : 0;
    
    console.log(`Overall similarity: ${overallSimilarity.toFixed(2)}, Similar fields: ${similarFields.join(', ')}`);
    
    return {
      similarity: overallSimilarity,
      similarFields
    };
  }

  /**
   * Calculate similarity between two surnames
   * This is a compatibility method for backward compatibility
   * @param surname1 First surname
   * @param surname2 Second surname
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(surname1: string, surname2: string): number {
    return this.calculateStringSimilarity(surname1, surname2);
  }

  /**
   * Public method to calculate similarity between two surnames
   * This is used by the controller for direct comparisons
   * @param surname1 First surname
   * @param surname2 Second surname
   * @returns Similarity score between 0 and 1
   */
  public calculateSimilarityPublic(surname1: string, surname2: string): number {
    return this.calculateSimilarity(surname1, surname2);
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
   * Check for similar family members when a new family member is added
   * Compares within the user's own family tree and across all users
   * @param newMemberId ID of the newly added family member
   * @param userId ID of the user who owns the family tree
   */
  async checkForSimilarFamilyMembers(newMemberId: string, userId: string): Promise<void> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      
      // First check within the user's own family tree
      await this.checkSimilarMembersWithinUser(newMemberId, userObjectId);
      
      // Then check across all other users' family trees
      await this.checkSimilarMembersAcrossUsers(newMemberId, userObjectId);
      
    } catch (error) {
      console.error('Error checking for similar family members:', error);
    }
  }

  /**
   * Check for similar family members within a user's own family tree
   * @param newMemberId ID of the newly added family member
   * @param userObjectId ObjectId of the user
   */
  private async checkSimilarMembersWithinUser(
    newMemberId: string, 
    userObjectId: Types.ObjectId
  ): Promise<void> {
    try {
      // Get the new family member
      const newMember = await this.familyMemberModel.findById(newMemberId).exec() as FamilyMemberWithId;
      if (!newMember) return;

      // Get all family members for this user except the new member
      const allFamilyMembers = await this.familyMemberModel
        .find({ userId: userObjectId, _id: { $ne: newMemberId } })
        .exec() as FamilyMemberWithId[];

      const similarMembers: SimilarMember[] = [];

      // Compare members
      for (const member of allFamilyMembers) {
        const { similarity, similarFields } = this.calculateMemberSimilarity(newMember, member);
        
        // Minimum criteria: We need at least one similar field and an overall similarity above 0.7
        if (similarity > 0.7 && similarFields.length > 0) {
          // Check if we should skip this due to differing status
          // If they have the same surname and first name but different statuses (alive vs dead),
          // we want to highlight this
          const isSameNameDifferentStatus = 
            similarFields.includes('surname') && 
            similarFields.includes('firstName') &&
            newMember.status && 
            member.status && 
            newMember.status !== member.status && 
            newMember.status !== 'unknown' && 
            member.status !== 'unknown';
          
          similarMembers.push({
            memberId: member._id,
            name: member.name,
            surname: this.getSurname(member),
            status: member.status,
            birthDate: member.birthDate,
            deathDate: member.deathDate,
            country: member.country,
            similarity,
            similarFields
          });
        }
      }

      // If similar members found, create notification
      if (similarMembers.length > 0) {
        const newMemberName = `${newMember.name} ${this.getSurname(newMember)}`;
        const message = `We found ${similarMembers.length} family member(s) similar to "${newMemberName}" in your family tree. They might be related.`;
        
        await this.notificationModel.create({
          userId: userObjectId,
          message,
          type: 'family_member_similarity',
          read: false,
          metadata: {
            newMember: {
              name: newMember.name,
              surname: this.getSurname(newMember),
              status: newMember.status,
              birthDate: newMember.birthDate,
              deathDate: newMember.deathDate,
              country: newMember.country
            },
            similarMembers
          },
          relatedFamilyMembers: similarMembers.map(m => m.memberId)
        });
      }
    } catch (error) {
      console.error('Error checking for similar family members within user:', error);
    }
  }

  /**
   * Check for similar family members across all other users' family trees
   * @param newMemberId ID of the newly added family member
   * @param currentUserId ObjectId of the current user
   */
  private async checkSimilarMembersAcrossUsers(
    newMemberId: string,
    currentUserId: Types.ObjectId
  ): Promise<void> {
    try {
      // Get the new family member
      const newMember = await this.familyMemberModel.findById(newMemberId).exec() as FamilyMemberWithId;
      if (!newMember) return;

      // Get all family members from other users
      const otherUsersFamilyMembers = await this.familyMemberModel
        .find({ userId: { $ne: currentUserId } })
        .exec() as FamilyMemberWithId[];

      const similarMembersByUser = new Map<string, SimilarMember[]>();
      const suggestionsByUser = new Map<string, { 
        otherMemberId: string;
        suggestionsForCurrentUser: string[];
        suggestionsForOtherUser: string[];
      }[]>();
      let totalSuggestionCount = 0;

      // Compare the new member with other users' family members
      for (const otherMember of otherUsersFamilyMembers) {
        const { similarity, similarFields } = this.calculateMemberSimilarity(newMember, otherMember);
        
        // Minimum criteria: We need at least one similar field and an overall similarity above 0.7
        if (similarity > 0.7 && similarFields.length > 0) {
          const userId = otherMember.userId.toString();
          
          if (!similarMembersByUser.has(userId)) {
            similarMembersByUser.set(userId, []);
          }
          
          if (!suggestionsByUser.has(userId)) {
            suggestionsByUser.set(userId, []);
          }
          
          // Generate suggestions based on differences
          const { suggestionsForMember1: suggestionsForCurrentUser, 
                  suggestionsForMember2: suggestionsForOtherUser,
                  suggestionCount } = await this.generateSuggestions(newMember, otherMember, similarFields);
          
          totalSuggestionCount += suggestionCount;
          
          // Store suggestions if there are any
          if (suggestionCount > 0) {
            const suggestionsForUser = suggestionsByUser.get(userId);
            if (suggestionsForUser) {
              suggestionsForUser.push({
                otherMemberId: otherMember._id.toString(),
                suggestionsForCurrentUser,
                suggestionsForOtherUser
              });
            }
          }
          
          const membersList = similarMembersByUser.get(userId);
          if (membersList) {
            membersList.push({
              memberId: otherMember._id,
              name: otherMember.name,
              surname: this.getSurname(otherMember),
              status: otherMember.status,
              birthDate: otherMember.birthDate,
              deathDate: otherMember.deathDate,
              country: otherMember.country,
              similarity,
              similarFields
            });
          }
        }
      }

      // Create notification for the current user about similar members in other users' trees
      if (similarMembersByUser.size > 0) {
        const totalSimilarMembers = Array.from(similarMembersByUser.values())
          .reduce((total, members) => total + members.length, 0);
        
        const newMemberName = `${newMember.name} ${this.getSurname(newMember)}`;
        let message = `We found ${totalSimilarMembers} family member(s) similar to "${newMemberName}" in other users' family trees.`;
        
        // Add suggestion count to the message if there are any suggestions
        if (totalSuggestionCount > 0) {
          message += ` There are ${totalSuggestionCount} suggestions for information that could be updated.`;
        }
        
        await this.notificationModel.create({
          userId: currentUserId,
          message,
          type: 'cross_user_family_similarity',
          read: false,
          metadata: {
            newMember: {
              id: newMember._id,
              name: newMember.name,
              surname: this.getSurname(newMember),
              status: newMember.status,
              birthDate: newMember.birthDate,
              deathDate: newMember.deathDate,
              country: newMember.country
            },
            similarMembersByUser: Object.fromEntries(similarMembersByUser),
            suggestionsByUser: Object.fromEntries(suggestionsByUser),
            totalSuggestionCount
          },
          relatedFamilyMembers: [newMember._id]
        });
        
        // Create notifications for other users
        await this.createNotificationsForOtherUsers(newMember, currentUserId, similarMembersByUser, suggestionsByUser);
      }
    } catch (error) {
      console.error('Error checking for similar family members across users:', error);
    }
  }

  /**
   * Create notifications for other users about similar family members
   * @param currentMember The current user's family member
   * @param currentUserId ID of the current user
   * @param similarMembersByUser Map of similar members by user ID
   * @param suggestionsByUser Map of suggestions by user ID
   */
  private async createNotificationsForOtherUsers(
    currentMember: FamilyMemberWithId,
    currentUserId: Types.ObjectId,
    similarMembersByUser: Map<string, SimilarMember[]>,
    suggestionsByUser: Map<string, { 
      otherMemberId: string;
      suggestionsForCurrentUser: string[];
      suggestionsForOtherUser: string[];
    }[]>
  ): Promise<void> {
    try {
      // For each user with similar members, create a notification
      for (const [userId, similarMembers] of similarMembersByUser.entries()) {
        const userObjectId = new Types.ObjectId(userId);
        const currentMemberName = `${currentMember.name} ${this.getSurname(currentMember)}`;
        const totalSimilarMembers = similarMembers.length;
        
        // Get suggestions for this user
        const suggestions = suggestionsByUser.get(userId) || [];
        const suggestionsForOtherUser = suggestions.flatMap(s => s.suggestionsForOtherUser);
        const totalSuggestionsForUser = suggestionsForOtherUser.length;
        
        let message = `We found ${totalSimilarMembers} of your family member(s) similar to "${currentMemberName}" in another user's family tree.`;
        
        // Add suggestion count to the message if there are any suggestions
        if (totalSuggestionsForUser > 0) {
          message += ` There are ${totalSuggestionsForUser} suggestions for information that could be updated.`;
        }
        
        await this.notificationModel.create({
          userId: userObjectId,
          message,
          type: 'cross_user_family_similarity',
          read: false,
          metadata: {
            otherUserMember: {
              id: currentMember._id,
              name: currentMember.name,
              surname: this.getSurname(currentMember),
              status: currentMember.status,
              birthDate: currentMember.birthDate,
              deathDate: currentMember.deathDate,
              country: currentMember.country
            },
            similarMembers,
            suggestions: suggestionsForOtherUser,
            totalSuggestionCount: totalSuggestionsForUser
          },
          relatedFamilyMembers: similarMembers.map(m => m.memberId)
        });
      }
    } catch (error) {
      console.error('Error creating notifications for other users:', error);
    }
  }

  /**
   * Analyze all family members for a user to find similar members
   * within their own family tree and across all other users
   * @param userId ID of the user
   */
  async analyzeFamilyTreeForSimilarMembers(userId: string): Promise<void> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      
      // First analyze within the user's own family tree
      await this.analyzeSimilaritiesWithinUser(userObjectId);
      
      // Then analyze across all users
      await this.analyzeSimilaritiesAcrossUsers(userObjectId);
      
    } catch (error) {
      console.error('Error analyzing family tree for similar members:', error);
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
        similarity: number,
        similarFields: string[],
        suggestionsForCurrentUser: string[],
        suggestionsForOtherUser: string[]
      }[]>();

      // Directly compare each current member with each other user's members
      for (const currentMember of currentUserMembers) {
        const currentMemberKey = currentMember._id.toString();
        
        for (const otherMember of otherUsersFamilyMembers) {
          // Calculate the similarity using the multi-field approach
          const { similarity, similarFields } = this.calculateMemberSimilarity(currentMember, otherMember);
          
          // If similarity is above threshold and we have at least one similar field
          if (similarity > 0.7 && similarFields.length > 0) {
            console.log(`Found similar members: ${currentMember.name} vs ${otherMember.name} = ${similarity}`);
            
            // Generate suggestions
            const { suggestionsForMember1: suggestionsForCurrentUser, 
                   suggestionsForMember2: suggestionsForOtherUser } = await this.generateSuggestions(currentMember, otherMember, similarFields);
            
            const key = `${currentMemberKey}|${otherMember._id.toString()}`;
            if (!foundSimilarities.has(key)) {
              foundSimilarities.set(key, []);
            }
            
            const similarities = foundSimilarities.get(key);
            if (similarities) {
              similarities.push({
                currentMember,
                otherMember,
                similarity,
                similarFields,
                suggestionsForCurrentUser,
                suggestionsForOtherUser
              });
            }
          }
        }
      }
      
      // Create notifications for each distinct similarity group
      for (const [key, similarities] of foundSimilarities.entries()) {
        if (similarities.length === 0) continue;
        
        const firstSimilarity = similarities[0];
        
        // Group by user ID for better organization
        const similarMembersByUser = new Map<string, SimilarMember[]>();
        const suggestionsByUser = new Map<string, {
          otherMemberId: string,
          suggestionsForCurrentUser: string[],
          suggestionsForOtherUser: string[]
        }[]>();
        
        let totalSuggestionCount = 0;
        
        for (const similarity of similarities) {
          const userId = similarity.otherMember.userId.toString();
          
          // Add to similar members map
          if (!similarMembersByUser.has(userId)) {
            similarMembersByUser.set(userId, []);
          }
          
          const membersList = similarMembersByUser.get(userId);
          if (membersList) {
            membersList.push({
              memberId: similarity.otherMember._id,
              name: similarity.otherMember.name,
              surname: this.getSurname(similarity.otherMember),
              status: similarity.otherMember.status,
              birthDate: similarity.otherMember.birthDate,
              deathDate: similarity.otherMember.deathDate,
              country: similarity.otherMember.country,
              similarity: similarity.similarity,
              similarFields: similarity.similarFields
            });
          }
          
          // Add to suggestions map
          if (similarity.suggestionsForCurrentUser.length > 0 || similarity.suggestionsForOtherUser.length > 0) {
            if (!suggestionsByUser.has(userId)) {
              suggestionsByUser.set(userId, []);
            }
            
            const suggestionsList = suggestionsByUser.get(userId);
            if (suggestionsList) {
              suggestionsList.push({
                otherMemberId: similarity.otherMember._id.toString(),
                suggestionsForCurrentUser: similarity.suggestionsForCurrentUser,
                suggestionsForOtherUser: similarity.suggestionsForOtherUser
              });
              totalSuggestionCount += similarity.suggestionsForCurrentUser.length;
            }
          }
        }
        
        // Create a notification for the current user
        const totalSimilarMembers = similarities.length;
        const currentMemberName = `${firstSimilarity.currentMember.name} ${this.getSurname(firstSimilarity.currentMember)}`;
        let message = `We found ${totalSimilarMembers} family member(s) similar to "${currentMemberName}" in other users' family trees.`;
        
        // Add suggestion count to the message if there are any suggestions
        if (totalSuggestionCount > 0) {
          message += ` There are ${totalSuggestionCount} suggestions for information that could be updated.`;
        }
        
        console.log(`Creating notification: ${message}`);
        
        try {
          await this.notificationModel.create({
            userId: currentUserId,
            message,
            type: 'cross_user_family_similarity',
            read: false,
            metadata: {
              currentMember: {
                id: firstSimilarity.currentMember._id,
                name: firstSimilarity.currentMember.name,
                surname: this.getSurname(firstSimilarity.currentMember),
                status: firstSimilarity.currentMember.status,
                birthDate: firstSimilarity.currentMember.birthDate,
                deathDate: firstSimilarity.currentMember.deathDate,
                country: firstSimilarity.currentMember.country
              },
              similarFields: firstSimilarity.similarFields,
              similarity: firstSimilarity.similarity,
              similarMembersByUser: Object.fromEntries(similarMembersByUser),
              suggestionsByUser: Object.fromEntries(suggestionsByUser),
              totalSuggestionCount
            },
            relatedFamilyMembers: [firstSimilarity.currentMember._id]
          });
          
          console.log('Notification created successfully for current user');
          
          // Create notifications for other users
          for (const [userId, similarMembers] of similarMembersByUser.entries()) {
            const userObjectId = new Types.ObjectId(userId);
            const suggestions = suggestionsByUser.get(userId) || [];
            const suggestionsForOtherUser = suggestions.flatMap(s => s.suggestionsForOtherUser);
            const totalSuggestionsForUser = suggestionsForOtherUser.length;
            
            let otherUserMessage = `We found ${similarMembers.length} of your family member(s) similar to "${currentMemberName}" in another user's family tree.`;
            
            // Add suggestion count to the message if there are any suggestions
            if (totalSuggestionsForUser > 0) {
              otherUserMessage += ` There are ${totalSuggestionsForUser} suggestions for information that could be updated.`;
            }
            
            await this.notificationModel.create({
              userId: userObjectId,
              message: otherUserMessage,
              type: 'cross_user_family_similarity',
              read: false,
              metadata: {
                otherUserMember: {
                  id: firstSimilarity.currentMember._id,
                  name: firstSimilarity.currentMember.name,
                  surname: this.getSurname(firstSimilarity.currentMember),
                  status: firstSimilarity.currentMember.status,
                  birthDate: firstSimilarity.currentMember.birthDate,
                  deathDate: firstSimilarity.currentMember.deathDate,
                  country: firstSimilarity.currentMember.country
                },
                similarMembers,
                suggestions: suggestionsForOtherUser,
                totalSuggestionCount: totalSuggestionsForUser
              },
              relatedFamilyMembers: similarMembers.map(m => m.memberId)
            });
            
            console.log(`Notification created successfully for other user ${userId}`);
          }
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

  /**
   * Generate suggestions for differences between two similar family members
   * @param member1 First family member
   * @param member2 Second family member
   * @param similarFields List of fields that are similar
   * @returns Object with suggestions for each member
   */
  private async generateSuggestions(
    member1: FamilyMemberWithId,
    member2: FamilyMemberWithId,
    similarFields: string[]
  ): Promise<{ 
    suggestionsForMember1: string[]; 
    suggestionsForMember2: string[];
    suggestionCount: number;
  }> {
    console.log(`Generating suggestions for "${member1.name}" vs "${member2.name}"`);
    console.log(`Similar fields: ${similarFields.join(', ')}`);
    
    const suggestionsForMember1: string[] = [];
    const suggestionsForMember2: string[] = [];
    
    // Get surnames for comparison
    const surname1 = this.getSurname(member1);
    const surname2 = this.getSurname(member2);
    
    // Get first names for comparison
    const firstName1 = member1.name ? member1.name.split(' ')[0] : '';
    const firstName2 = member2.name ? member2.name.split(' ')[0] : '';
    
    // Check if they have the same name components
    const hasSameFirstName = firstName1 && firstName2 && firstName1.toLowerCase() === firstName2.toLowerCase();
    const hasSameSurname = surname1 && surname2 && surname1.toLowerCase() === surname2.toLowerCase();
    
    // Check for high similarity in name components
    const hasSimilarFirstName = similarFields.includes('firstName');
    const hasSimilarSurname = similarFields.includes('surname');
    const hasSimilarFullName = similarFields.includes('fullName');
    
    // First, check for exact name matches
    const hasExactNameMatch = hasSameFirstName && hasSameSurname; 
    
    // Then check for full name equality (as a fallback)
    const hasFullNameEquality = member1.name && member2.name && 
                               member1.name.toLowerCase() === member2.name.toLowerCase();
    
    // We will generate suggestions ONLY if they have the same first name and surname
    // or if they have exactly the same full name
    const hasSameNameAndSurname =
      member1.name && member2.name &&
      member1.surname && member2.surname &&
      member1.name.trim().toLowerCase() === member2.name.trim().toLowerCase() &&
      member1.surname.trim().toLowerCase() === member2.surname.trim().toLowerCase();

    if (hasSameNameAndSurname) {
      console.log('MATCH:', member1.name, member1.surname, 'vs', member2.name, member2.surname);
      console.log('member1 parents:', member1.fatherId, member1.motherId);
      console.log('member2 parents:', member2.fatherId, member2.motherId);
      await Promise.all([
        this.checkAndSuggestParent(member1, member2, 'father', suggestionsForMember1, suggestionsForMember2),
        this.checkAndSuggestParent(member1, member2, 'mother', suggestionsForMember1, suggestionsForMember2)
      ]);
    }
    
    // Check status differences - only if we should generate suggestions
    if (hasSameNameAndSurname && member1.status && member2.status && member1.status !== member2.status) {
      console.log(`Status difference found: ${member1.status} vs ${member2.status}`);
      // Only make suggestions for actual status differences between alive/dead, not unknown
      if (member1.status !== 'unknown' && member2.status !== 'unknown') {
        // If member1 is alive but member2 is dead, suggest updating member1's status
        if (member1.status === 'alive' && member2.status === 'dead') {
          suggestionsForMember1.push(
            `This family member may be dead. Another user has recorded "${member2.name}" as dead.`
          );
          suggestionsForMember2.push(
            `You have recorded this family member as dead, but another user has recorded "${member1.name}" as alive.`
          );
        } 
        // If member1 is dead but member2 is alive, suggest updating member2's status
        else if (member1.status === 'dead' && member2.status === 'alive') {
          suggestionsForMember2.push(
            `This family member may be dead. Another user has recorded "${member1.name}" as dead.`
          );
          suggestionsForMember1.push(
            `You have recorded this family member as dead, but another user has recorded "${member2.name}" as alive.`
          );
        }
      }
    }
    
    // Check for birth date differences - only if we should generate suggestions
    if (hasSameNameAndSurname && member1.birthDate && member2.birthDate) {
      const date1 = new Date(member1.birthDate);
      const date2 = new Date(member2.birthDate);
      
      console.log(`Birth dates: ${date1.toISOString()} vs ${date2.toISOString()}`);
      
      if (Math.abs(date1.getTime() - date2.getTime()) > 86400000) { // More than 1 day difference
        const date1Str = date1.toISOString().split('T')[0];
        const date2Str = date2.toISOString().split('T')[0];
        
        console.log(`Birth date difference found: ${date1Str} vs ${date2Str}`);
        
        suggestionsForMember1.push(
          `Birth date may be ${date2Str} (recorded by another user) instead of ${date1Str}.`
        );
        suggestionsForMember2.push(
          `Birth date may be ${date1Str} (recorded by another user) instead of ${date2Str}.`
        );
      }
    } else if (hasSameNameAndSurname && !member1.birthDate && member2.birthDate) {
      // First member is missing birth date
      const dateStr = new Date(member2.birthDate).toISOString().split('T')[0];
      console.log(`Member1 missing birth date, suggesting to add: ${dateStr}`);
      suggestionsForMember1.push(
        `Consider adding birth date (${dateStr}). Another user has recorded this birth date.`
      );
    } else if (hasSameNameAndSurname && member1.birthDate && !member2.birthDate) {
      // Second member is missing birth date
      const dateStr = new Date(member1.birthDate).toISOString().split('T')[0];
      console.log(`Member2 missing birth date, suggesting to add: ${dateStr}`);
      suggestionsForMember2.push(
        `Consider adding birth date (${dateStr}). Another user has recorded this birth date.`
      );
    }
    
    // Check for death date differences - only if we should generate suggestions
    if (hasSameNameAndSurname && member1.deathDate && member2.deathDate) {
      const date1 = new Date(member1.deathDate);
      const date2 = new Date(member2.deathDate);
      
      console.log(`Death dates: ${date1.toISOString()} vs ${date2.toISOString()}`);
      
      if (Math.abs(date1.getTime() - date2.getTime()) > 86400000) { // More than 1 day difference
        const date1Str = date1.toISOString().split('T')[0];
        const date2Str = date2.toISOString().split('T')[0];
        
        console.log(`Death date difference found: ${date1Str} vs ${date2Str}`);
        
        suggestionsForMember1.push(
          `Death date may be ${date2Str} (recorded by another user) instead of ${date1Str}.`
        );
        suggestionsForMember2.push(
          `Death date may be ${date1Str} (recorded by another user) instead of ${date2Str}.`
        );
      }
    } else if (hasSameNameAndSurname && !member1.deathDate && member2.deathDate) {
      // First member is missing death date
      const dateStr = new Date(member2.deathDate).toISOString().split('T')[0];
      console.log(`Member1 missing death date, suggesting to add: ${dateStr}`);
      suggestionsForMember1.push(
        `Consider adding death date (${dateStr}). Another user has recorded this death date.`
      );
    } else if (hasSameNameAndSurname && member1.deathDate && !member2.deathDate) {
      // Second member is missing death date
      const dateStr = new Date(member1.deathDate).toISOString().split('T')[0];
      console.log(`Member2 missing death date, suggesting to add: ${dateStr}`);
      suggestionsForMember2.push(
        `Consider adding death date (${dateStr}). Another user has recorded this death date.`
      );
    }
    
    // Check for country differences - only if we should generate suggestions
    if (hasSameNameAndSurname && member1.country && member2.country && member1.country !== member2.country) {
      console.log(`Country difference found: ${member1.country} vs ${member2.country}`);
      suggestionsForMember1.push(
        `Country may be ${member2.country} (recorded by another user) instead of ${member1.country}.`
      );
      suggestionsForMember2.push(
        `Country may be ${member1.country} (recorded by another user) instead of ${member2.country}.`
      );
    } else if (hasSameNameAndSurname && !member1.country && member2.country) {
      // First member is missing country
      console.log(`Member1 missing country, suggesting to add: ${member2.country}`);
      suggestionsForMember1.push(
        `Consider adding country "${member2.country}". Another user has recorded this country.`
      );
    } else if (hasSameNameAndSurname && member1.country && !member2.country) {
      // Second member is missing country
      console.log(`Member2 missing country, suggesting to add: ${member1.country}`);
      suggestionsForMember2.push(
        `Consider adding country "${member1.country}". Another user has recorded this country.`
      );
    }
    
    console.log(`Generated ${suggestionsForMember1.length} suggestions for member1 and ${suggestionsForMember2.length} for member2`);
    
    suggestionsForMember1.push('DEBUG: This is a test suggestion');
    
    return {
      suggestionsForMember1,
      suggestionsForMember2,
      suggestionCount: suggestionsForMember1.length + suggestionsForMember2.length
    };
  }
  
  /**
   * Check if two members are siblings or the same person with different parent information
   * and generate appropriate suggestions
   */
  private async checkAndGenerateParentSuggestions(
    member1: FamilyMemberWithId,
    member2: FamilyMemberWithId,
    suggestionsForMember1: string[],
    suggestionsForMember2: string[]
  ): Promise<void> {
    const isSamePerson = member1.name && member2.name && 
      (member1.name.toLowerCase() === member2.name.toLowerCase() ||
        this.calculateStringSimilarity(member1.name, member2.name) > 0.9);
    const areSiblings = (member1.fatherId && member2.fatherId && 
      member1.fatherId.toString() === member2.fatherId.toString()) ||
      (member1.motherId && member2.motherId && 
        member1.motherId.toString() === member2.motherId.toString());
    if (isSamePerson || areSiblings) {
      await Promise.all([
        this.checkAndSuggestParent(member1, member2, 'father', suggestionsForMember1, suggestionsForMember2),
        this.checkAndSuggestParent(member1, member2, 'mother', suggestionsForMember1, suggestionsForMember2)
      ]);
    }
  }
  
  /**
   * Check if one member has parent information that the other doesn't,
   * and generate appropriate suggestions
   */
  private async checkAndSuggestParent(
    member1: FamilyMemberWithId,
    member2: FamilyMemberWithId,
    parentType: 'father' | 'mother',
    suggestionsForMember1: string[],
    suggestionsForMember2: string[]
  ): Promise<void> {
    const parentIdField = parentType === 'father' ? 'fatherId' : 'motherId';
    try {
      if (member1[parentIdField] && !member2[parentIdField]) {
        console.log(`Suggesting to add ${parentType} for`, member2.name, member2.surname);
        const parentName = await this.getParentNameAsync(member1[parentIdField]);
        const parentDisplayName = parentName || `${parentType === 'father' ? 'Papa' : 'Mama'} ${this.getSurname(member1)}`;
        suggestionsForMember2.push(
          `Consider adding ${parentType} "${parentDisplayName}" to your family tree. Another user has recorded this ${parentType} for ${member2.name}.`
        );
      } else if (!member1[parentIdField] && member2[parentIdField]) {
        const parentName = await this.getParentNameAsync(member2[parentIdField]);
        const parentDisplayName = parentName || `${parentType === 'father' ? 'Papa' : 'Mama'} ${this.getSurname(member2)}`;
        suggestionsForMember1.push(
          `Consider adding ${parentType} "${parentDisplayName}" to your family tree. Another user has recorded this ${parentType} for ${member1.name}.`
        );
      }
    } catch (err) {
      console.error(`Error getting ${parentType} name:`, err);
      // Fallback suggestion without the parent's name
      if (member1[parentIdField] && !member2[parentIdField]) {
        suggestionsForMember2.push(
          `Consider adding ${parentType} to your family tree. Another user has recorded a ${parentType} for ${member2.name}.`
        );
      } else if (!member1[parentIdField] && member2[parentIdField]) {
        suggestionsForMember1.push(
          `Consider adding ${parentType} to your family tree. Another user has recorded a ${parentType} for ${member1.name}.`
        );
      }
    }
  }
  
  /**
   * Get the name of a parent by ID
   */
  private async getParentNameAsync(parentId: Types.ObjectId): Promise<string | null> {
    try {
      const parent = await this.familyMemberModel.findById(parentId).exec();
      if (parent) {
        return parent.name;
      }
      return null;
    } catch (error) {
      console.error('Error fetching parent name:', error);
      return null;
    }
  }
}