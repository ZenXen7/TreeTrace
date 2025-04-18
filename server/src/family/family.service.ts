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

    return savedFamilyMember;
  }

  async findAll(userId: string): Promise<FamilyMember[]> {
    // Fetch all family members associated with the given userId
    return this.familyMemberModel.find({ userId }).exec();
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
}
