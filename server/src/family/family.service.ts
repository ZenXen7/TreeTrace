import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { FamilyMember, FamilyMemberDocument } from './family-member.schema';

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>, // Inject UserModel
  ) {}

  async createFamilyMember(
    userId: string,
    familyMemberData: any,
  ): Promise<FamilyMember> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Create a new family member with the userId
    const familyMember = new this.familyMemberModel({
      ...familyMemberData,
      userId, // Associate the family member with the authenticated user
    });

    await familyMember.save();

    // Ensure the user exists before updating their family tree
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update the user's family tree
    await this.userModel.findByIdAndUpdate(userId, {
      $push: { familyTree: familyMember._id },
    });

    return familyMember;
  }

  async findByUser(userId: string): Promise<FamilyMember[]> {
    return this.familyMemberModel.find({ userId }).exec();
  }
}
