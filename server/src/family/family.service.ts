import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FamilyMember, FamilyMemberDocument } from './family-member.schema';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { FamilyMemberSimilarityService } from '../notification/family-member-similarity.service';
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
  father?: FamilyTreeNode;
  mother?: FamilyTreeNode;
  partners?: FamilyTreeNode[];
  childNodes?: FamilyTreeNode[];
}

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
    private familyMemberSimilarityService: FamilyMemberSimilarityService,
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
    const memberData = { 
      ...createFamilyMemberDto, 
      userId: userObjectId,
      relationship: createFamilyMemberDto.relationship || 'self'
    };
    
    // Automatically set status to 'dead' if death date is provided
    if (memberData.deathDate) {
      memberData.status = 'dead';
    }

    const createdFamilyMember = new this.familyMemberModel(memberData);
    const savedMember = await createdFamilyMember.save() as FamilyMemberWithId;
    
    // Run cross-user similarity analysis
    await this.familyMemberSimilarityService.analyzeSimilaritiesAcrossUsers(userObjectId);
    
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

  async findAllByUserId(userId: string): Promise<FamilyMember[]> {
    try {
      // Convert string userId to ObjectId if it's not already
      const userObjectId = new Types.ObjectId(userId.toString());
      
      // Fetch all family members for this user
      const results = await this.familyMemberModel
        .find({ userId: userObjectId })
        .exec();
      
      console.log(`Found ${results.length} family members for user ${userId}`);
      
      return results;
    } catch (error) {
      console.error('Error in findAllByUserId:', error);
      throw new Error(`Error fetching family members for user ${userId}`);
    }
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
      
      // Run cross-user similarity analysis after update
      await this.familyMemberSimilarityService.analyzeSimilaritiesAcrossUsers(updatedFamilyMember.userId);
      
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

  /**
   * Check for similar family members after member creation or update
   * @param id ID of the family member to check
   * @param userId ID of the user who owns the family member
   */
  async checkForSimilarFamilyMembers(id: string, userId: string): Promise<void> {
    try {
      await this.familyMemberSimilarityService.checkForSimilarFamilyMembers(id, userId);
    } catch (error) {
      console.error('Error checking for similar family members:', error);
    }
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
      // Convert string userId to ObjectId
      const userObjectId = new Types.ObjectId(userId);
      
      // Find all family members for this user
      const familyMembers = await this.familyMemberModel
        .find({ 
          userId: userObjectId
          // All trees are public by default
        })
        .exec();

      console.log(`Found ${familyMembers.length} family members for user ${userId}`);

      if (!familyMembers || familyMembers.length === 0) {
        console.log(`No family members found for user ${userId}`);
        return [];
      }

      // Find members without parents (roots) to start tree building from
      const rootMembers = familyMembers.filter(
        (member) => !member.fatherId && !member.motherId,
      );

      if (rootMembers.length === 0 && familyMembers.length > 0) {
        // If no roots found but family members exist, use the first member as root
        rootMembers.push(familyMembers[0]);
        console.log(`No root members found. Using first member as root: ${familyMembers[0].name}`);
      }

      console.log(`Building tree with ${rootMembers.length} root members`);

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

  // Build a family tree node recursively
  private async buildFamilyTreeNode(
    member: FamilyMember,
    allMembers: FamilyMember[],
  ): Promise<FamilyTreeNode> {
    // Convert to a TreeNode
    const treeNode = member as unknown as FamilyTreeNode;
    
    // Find father
    if (member.fatherId) {
      const father = allMembers.find(
        (m) => (m as any)._id.toString() === member.fatherId.toString(),
      );
      if (father) {
        treeNode.father = father as unknown as FamilyTreeNode;
      }
    }
    
    // Find mother
    if (member.motherId) {
      const mother = allMembers.find(
        (m) => (m as any)._id.toString() === member.motherId.toString(),
      );
      if (mother) {
        treeNode.mother = mother as unknown as FamilyTreeNode;
      }
    }
    
    // Find partners (handle as array)
    treeNode.partners = [];
    if (member.partnerId && Array.isArray(member.partnerId)) {
      for (const pid of member.partnerId) {
        const partner = allMembers.find(
          (m) => (m as any)._id.toString() === pid.toString(),
        );
        if (partner) {
          treeNode.partners.push(partner as unknown as FamilyTreeNode);
        }
      }
    }
    
    // Find children
    const children = allMembers.filter(
      (m) => 
        (m.fatherId && m.fatherId.toString() === (member as any)._id.toString()) ||
        (m.motherId && m.motherId.toString() === (member as any)._id.toString())
    );
    
    if (children.length > 0) {
      // Process each child recursively
      treeNode.childNodes = await Promise.all(
        children.map((child) => this.buildFamilyTreeNode(child, allMembers))
      );
    } else {
      treeNode.childNodes = [];
    }
    
    return treeNode;
  }
}
