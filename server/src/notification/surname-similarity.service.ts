// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { FamilyMember, FamilyMemberDocument } from '../family/family-member.schema';
// import { Notification, NotificationDocument } from './notification.schema';

// @Injectable()
// export class SurnameSimilarityService {
//   constructor(
//     @InjectModel(FamilyMember.name)
//     private familyMemberModel: Model<FamilyMemberDocument>,
//     @InjectModel(Notification.name)
//     private notificationModel: Model<NotificationDocument>,
//   ) {}

//   /**
//    * Calculate similarity between two surnames using Levenshtein distance
//    * @param surname1 First surname
//    * @param surname2 Second surname
//    * @returns Similarity score between 0 and 1
//    */
//   private calculateSimilarity(surname1: string, surname2: string): number {
//     if (!surname1 || !surname2) return 0;
    
//     // Convert to lowercase for case-insensitive comparison
//     const s1 = surname1.toLowerCase();
//     const s2 = surname2.toLowerCase();
    
//     // If surnames are identical, return 1
//     if (s1 === s2) return 1;
    
//     // Calculate Levenshtein distance
//     const len1 = s1.length;
//     const len2 = s2.length;
//     const matrix: number[][] = [];
    
//     // Initialize matrix
//     for (let i = 0; i <= len1; i++) {
//       matrix[i] = [i];
//     }
    
//     for (let j = 0; j <= len2; j++) {
//       matrix[0][j] = j;
//     }
    
//     // Fill matrix
//     for (let i = 1; i <= len1; i++) {
//       for (let j = 1; j <= len2; j++) {
//         const cost = s1.charAt(i - 1) === s2.charAt(j - 1) ? 0 : 1;
//         matrix[i][j] = Math.min(
//           matrix[i - 1][j] + 1, // deletion
//           matrix[i][j - 1] + 1, // insertion
//           matrix[i - 1][j - 1] + cost // substitution
//         );
//       }
//     }
    
//     // Calculate similarity score (0 to 1)
//     const maxLen = Math.max(len1, len2);
//     const distance = matrix[len1][len2];
//     return 1 - distance / maxLen;
//   }

//   /**
//    * Extract surname from a full name
//    * @param fullName Full name of a person
//    * @returns Extracted surname
//    */
//   private extractSurname(fullName: string): string {
//     if (!fullName) return '';
//     const nameParts = fullName.trim().split(' ');
//     return nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
//   }

//   /**
//    * Check for similar surnames when a new family member is added
//    * @param newMemberId ID of the newly added family member
//    * @param userId ID of the user who owns the family tree
//    */
//   async checkForSimilarSurnames(newMemberId: string, userId: string): Promise<void> {
//     try {
//       // Get the new family member
//       const newMember = await this.familyMemberModel.findById(newMemberId).exec();
//       if (!newMember) return;

//       const newMemberSurname = this.extractSurname(newMember.name);
//       if (!newMemberSurname) return;

//       // Get all family members for this user
//       const userObjectId = new Types.ObjectId(userId.toString());
//       const allFamilyMembers = await this.familyMemberModel
//         .find({ userId: userObjectId, _id: { $ne: newMemberId } })
//         .exec();

//       const similarMembers = [];

//       // Compare surnames
//       for (const member of allFamilyMembers) {
//         const memberSurname = this.extractSurname(member.name);
//         if (!memberSurname) continue;

//         const similarity = this.calculateSimilarity(newMemberSurname, memberSurname);
        
//         // If similarity is above threshold (0.7 = 70% similar)
//         if (similarity > 0.7 && similarity < 1) {
//           similarMembers.push({
//             memberId: member._id,
//             name: member.name,
//             surname: memberSurname,
//             similarity: similarity
//           });
//         }
//       }

//       // If similar surnames found, create notification
//       if (similarMembers.length > 0) {
//         const message = `We found ${similarMembers.length} family member(s) with surnames similar to "${newMemberSurname}". They might be related to your family tree.`;
        
//         await this.notificationModel.create({
//           userId: userObjectId,
//           message,
//           type: 'surname_similarity',
//           read: false,
//           metadata: {
//             newMemberSurname,
//             similarMembers
//           },
//           relatedFamilyMembers: similarMembers.map(m => m.memberId)
//         });
//       }
//     } catch (error) {
//       console.error('Error checking for similar surnames:', error);
//     }
//   }

//   /**
//    * Analyze all family members for a user to find similar surnames
//    * @param userId ID of the user
//    */
//   async analyzeFamilyTreeForSimilarSurnames(userId: string): Promise<void> {
//     try {
//       const userObjectId = new Types.ObjectId(userId.toString());
//       const allFamilyMembers = await this.familyMemberModel
//         .find({ userId: userObjectId })
//         .exec();

//       const surnameGroups = new Map<string, FamilyMember[]>();

//       // Group family members by surname
//       for (const member of allFamilyMembers) {
//         const surname = this.extractSurname(member.name);
//         if (!surname) continue;

//         if (!surnameGroups.has(surname)) {
//           surnameGroups.set(surname, []);
//         }
//         surnameGroups.get(surname).push(member);
//       }

//       // Find similar surname groups
//       const processedSurnames = new Set<string>();
//       const similarityClusters = [];

//       for (const [surname1, members1] of surnameGroups.entries()) {
//         if (processedSurnames.has(surname1)) continue;
//         processedSurnames.add(surname1);

//         const similarGroup = {
//           baseSurname: surname1,
//           members: [...members1],
//           similarSurnames: []
//         };

//         for (const [surname2, members2] of surnameGroups.entries()) {
//           if (surname1 === surname2 || processedSurnames.has(surname2)) continue;

//           const similarity = this.calculateSimilarity(surname1, surname2);
//           if (similarity > 0.7) {
//             similarGroup.members.push(...members2);
//             similarGroup.similarSurnames.push({
//               surname: surname2,
//               similarity,
//               members: members2
//             });
//             processedSurnames.add(surname2);
//           }
//         }

//         if (similarGroup.similarSurnames.length > 0) {
//           similarityClusters.push(similarGroup);
//         }
//       }

//       // Create notifications for each cluster
//       for (const cluster of similarityClusters) {
//         const surnameList = [cluster.baseSurname, ...cluster.similarSurnames.map(s => s.surname)].join('", "');
//         const message = `We found similar surnames in your family tree: "${surnameList}". These family members might be related.`;
        
//         await this.notificationModel.create({
//           userId: userObjectId,
//           message,
//           type: 'surname_similarity',
//           read: false,
//           metadata: {
//             similarityCluster: cluster
//           },
//           relatedFamilyMembers: cluster.members.map(m => m._id)
//         });
//       }
//     } catch (error) {
//       console.error('Error analyzing family tree for similar surnames:', error);
//     }
//   }
// }