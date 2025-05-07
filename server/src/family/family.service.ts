import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FamilyMember, FamilyMemberDocument } from './family-member.schema';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { SurnameSimilarityService } from '../notification/surname-similarity.service';
import { FamilyMemberWithId } from '../notification/similar-member.interface';

// Define interface for family tree response
export interface FamilyTreeNode {
  _id: Types.ObjectId;
  name: string;
  birthDate?: Date;
  gender?: string;
  status: string;
  userId: Types.ObjectId;
  fatherId?: Types.ObjectId;
  motherId?: Types.ObjectId;
  partnerId?: Types.ObjectId[]; // Updated to be an array of ObjectIds
  __v?: number;
}

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
    private surnameSimilarityService: SurnameSimilarityService,
  ) {}

  // async createFamilyMember(
  //   userId: string | Types.ObjectId,
  //   createFamilyMemberDto: CreateFamilyMemberDto,
  // ): Promise<FamilyMember> {
  //   const userObjectId = new Types.ObjectId(userId.toString());
  
  //   const createdFamilyMember = new this.familyMemberModel({ 
  //     ...createFamilyMemberDto,userId: userObjectId, 
  //   });

  //   const savedFamilyMember = await createdFamilyMember.save();
  
  //   return savedFamilyMember;
  // }

  async createFamilyMember(
    userId: string | Types.ObjectId,
    createFamilyMemberDto: CreateFamilyMemberDto,
  ): Promise<FamilyMember> {
    const userObjectId = new Types.ObjectId(userId.toString());
    const memberData = { ...createFamilyMemberDto, userId: userObjectId };
    
    // Automatically set status to 'dead' if death date is provided
    if (memberData.deathDate) {
      memberData.status = 'dead';
    }

    const createdFamilyMember = new this.familyMemberModel(memberData);
    const savedMember = await createdFamilyMember.save() as FamilyMemberWithId;
    
    // Run cross-user surname similarity analysis
    await this.surnameSimilarityService.analyzeSimilaritiesAcrossUsers(userObjectId);
    
    return savedMember;
  }
  

  async findAll(userId: string, filters: Record<string, any> = {}): Promise<FamilyMember[]> {
    // Convert string userId to ObjectId before querying
    const userObjectId = new Types.ObjectId(userId);
    
    // Create query object with userId
    const query: Record<string, any> = { userId: userObjectId };
    
    // Add any additional filters from parameters
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });
    
    console.log('Database query with filters:', JSON.stringify(query));
    
    // Fetch all family members matching the query
    const results = await this.familyMemberModel.find(query).exec();
    console.log(`Found ${results.length} members matching filters`);
    
    return results;
  }

  async findOne(id: string): Promise<FamilyMember> {
    const familyMember = await this.familyMemberModel.findById(id).exec();
    if (!familyMember) {
      throw new NotFoundException(`Family member with ID ${id} not found`);
    }
    return familyMember;
  }

  async update(
    id: string,
    updateFamilyMemberDto: Partial<CreateFamilyMemberDto>,
  ): Promise<FamilyMember> {
    // If death date is provided, automatically set status to 'dead'
    if (updateFamilyMemberDto.deathDate) {
      updateFamilyMemberDto.status = 'dead';
    }

    const session = await this.familyMemberModel.db.startSession();
    session.startTransaction();

    try {
      const updatedFamilyMember = await this.familyMemberModel
        .findByIdAndUpdate(id, updateFamilyMemberDto, { new: true })
        .session(session);

      if (!updatedFamilyMember) {
        throw new NotFoundException(`Family member with ID ${id} not found`);
      }

      // If partnerId is being updated, update the partners' partnerId as well
      if (updateFamilyMemberDto.partnerId && updateFamilyMemberDto.partnerId.length > 0) {
        for (const partnerId of updateFamilyMemberDto.partnerId) {
          await this.familyMemberModel
            .findByIdAndUpdate(
              partnerId,
              { $addToSet: { partnerId: id } }, // Add the current ID to the partner's partnerId array
              { new: true },
            )
            .session(session);
        }
      }

      await session.commitTransaction();
      return updatedFamilyMember;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async remove(id: string): Promise<FamilyMember> {
    const deletedFamilyMember = await this.familyMemberModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedFamilyMember) {
      throw new NotFoundException(`Family member with ID ${id} not found`);
    }
    return deletedFamilyMember;
  }

  async getFamilyTree(id: string): Promise<FamilyTreeNode> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invalid ID format: ${id}`);
      }

      const familyMember = await this.familyMemberModel
        .findById(id)
        .populate('fatherId')
        .populate('motherId')
        .populate('partnerId')
        .exec();

      if (!familyMember) {
        throw new NotFoundException(`Family member with ID ${id} not found`);
      }

      const result = familyMember.toObject() as FamilyTreeNode;

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new NotFoundException(
        `Error fetching family tree: ${errorMessage}`,
      );
    }
  }

  async getPublicFamilyTree(userId: string): Promise<FamilyTreeNode[]> {
    try {
      const familyMembers = await this.familyMemberModel
        .find({ userId: userId })
        .exec();

      if (!familyMembers || familyMembers.length === 0) {
        return [];
      }

      // Find members without parents (roots) to start tree building from
      const rootMembers = familyMembers.filter(
        (member) => !member.fatherId && !member.motherId,
      );

      if (rootMembers.length === 0 && familyMembers.length > 0) {
        // If no roots found but family members exist, use the first member as root
        rootMembers.push(familyMembers[0]);
      }

      // Create tree nodes for each root member
      const treeNodes = await Promise.all(
        rootMembers.map((root) =>
          this.buildFamilyTreeNode(root, familyMembers),
        ),
      );

      return treeNodes;
    } catch (error) {
      console.error('Error in getPublicFamilyTree:', error);
      throw new Error('Failed to retrieve public family tree');
    }
  }
}
