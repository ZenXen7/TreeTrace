import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FamilyMember, FamilyMemberDocument } from './family-member.schema';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';

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
}
