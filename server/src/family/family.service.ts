import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FamilyMember, FamilyMemberDocument } from './family-member.schema';

@Injectable()
export class FamilyService {
  constructor(
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMemberDocument>,
  ) {}

  async createFamilyMember(
    createFamilyMemberDto: Partial<FamilyMember>,
  ): Promise<FamilyMember> {
    const familyMember = new this.familyMemberModel(createFamilyMemberDto);
    return familyMember.save();
  }

  async getFamilyTree(): Promise<FamilyMember[]> {
    return this.familyMemberModel.find().exec();
  }
}
