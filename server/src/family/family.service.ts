import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FamilyMember, FamilyMemberDocument } from './family-member.schema';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';

// Define interface for family tree response
export interface FamilyTreeNode {
  _id: Types.ObjectId;
  name: string;
  birthDate?: Date;
  deathDate?: Date;
  relationship: string;
  gender?: string;
  medicalConditions?: string[];
  userId: Types.ObjectId;
  fatherId?: Types.ObjectId;
  motherId?: Types.ObjectId;
  children: Types.ObjectId[];
  father?: FamilyTreeNode | null;
  mother?: FamilyTreeNode | null;
  childNodes?: FamilyTreeNode[];
  __v?: number;
}

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
  ) {}

  async createFamilyMember(
    userId: string,
    createFamilyMemberDto: CreateFamilyMemberDto,
  ): Promise<FamilyMember> {
    const createdFamilyMember = new this.familyMemberModel({
      ...createFamilyMemberDto,
      userId,
    });

    const savedFamilyMember = await createdFamilyMember.save();

    // Update the parent's children field if fatherId or motherId is provided
    if (createFamilyMemberDto.fatherId) {
      await this.familyMemberModel.findByIdAndUpdate(
        createFamilyMemberDto.fatherId,
        {
          $push: { children: savedFamilyMember._id },
        },
      );
    }

    if (createFamilyMemberDto.motherId) {
      await this.familyMemberModel.findByIdAndUpdate(
        createFamilyMemberDto.motherId,
        {
          $push: { children: savedFamilyMember._id },
        },
      );
    }

    return savedFamilyMember;
  }

  async findAll(userId: string): Promise<FamilyMember[]> {
    return this.familyMemberModel.find({ userId }).exec();
  }

  async findOne(id: string): Promise<FamilyMember> {
    const familyMember = await this.familyMemberModel.findById(id).exec();
    if (!familyMember) {
      throw new NotFoundException(`Family member with ID ${id} not found`);
    }
    return familyMember;
  }

  async findFamilyMemberWithChildren(id: string): Promise<FamilyMember> {
    const familyMember = await this.familyMemberModel
      .findById(id)
      .populate('children') // Populate the children field with FamilyMember documents
      .exec();

    if (!familyMember) {
      throw new NotFoundException(`Family member with ID ${id} not found`);
    }

    return familyMember;
  }

  async update(
    id: string,
    updateFamilyMemberDto: Partial<CreateFamilyMemberDto>,
  ): Promise<FamilyMember> {
    const updatedFamilyMember = await this.familyMemberModel
      .findByIdAndUpdate(id, updateFamilyMemberDto, { new: true })
      .exec();
    if (!updatedFamilyMember) {
      throw new NotFoundException(`Family member with ID ${id} not found`);
    }
    return updatedFamilyMember;
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
      // First, validate that the id is a valid ObjectId
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invalid ID format: ${id}`);
      }

      // Get the root family member with populated references
      const familyMember = await this.familyMemberModel
        .findById(id)
        .populate('fatherId')
        .populate('motherId')
        .populate('children')
        .exec();

      if (!familyMember) {
        throw new NotFoundException(`Family member with ID ${id} not found`);
      }

      // Convert to plain object and cast to FamilyTreeNode
      const result = familyMember.toObject() as FamilyTreeNode;

      // Get all family members for this user to build the tree
      const allMembers = await this.familyMemberModel
        .find({ userId: familyMember.userId })
        .exec();

      // Helper function to get a member's data
      const getMemberData = (
        memberId: Types.ObjectId,
      ): FamilyTreeNode | null => {
        if (!memberId) return null;
        const member = allMembers.find((m) => {
          return m._id?.toString() === memberId?.toString();
        });
        return member ? (member.toObject() as FamilyTreeNode) : null;
      };

      // Build the tree structure
      if (result.fatherId) {
        result.father = getMemberData(result.fatherId);
      }
      if (result.motherId) {
        result.mother = getMemberData(result.motherId);
      }
      if (result.children && result.children.length > 0) {
        // Create a new array of child nodes, not modifying the children array directly
        const childNodes = result.children
          .map((childId) => getMemberData(childId))
          .filter(Boolean) as FamilyTreeNode[];

        result.childNodes = childNodes;
      } else {
        result.childNodes = [];
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Safe error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new NotFoundException(
        `Error fetching family tree: ${errorMessage}`,
      );
    }
  }
}
