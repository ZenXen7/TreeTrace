import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MedicalHistory, MedicalHistoryDocument } from './medical-history.schema';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';
import { FamilyMember } from '../family/family-member.schema';

@Injectable()
export class MedicalService {
  constructor(
    @InjectModel(MedicalHistory.name) private medicalHistoryModel: Model<MedicalHistoryDocument>,
    @InjectModel(FamilyMember.name) private familyMemberModel: Model<FamilyMember>,
  ) {}


  async create(userId: Types.ObjectId, createMedicalHistoryDto: CreateMedicalHistoryDto): Promise<MedicalHistory> {
    const familyMember = await this.familyMemberModel.findById(createMedicalHistoryDto.familyMemberId);
    
    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }
    

    const healthConditionsMap = new Map<string, boolean>();
    Object.entries(createMedicalHistoryDto.healthConditions).forEach(([key, value]) => {
      healthConditionsMap.set(key, value);
    });

    const newMedicalHistory = new this.medicalHistoryModel({
      userId,
      familyMemberId: createMedicalHistoryDto.familyMemberId,
      healthConditions: healthConditionsMap,
      allergies: createMedicalHistoryDto.allergies || '',
      medications: createMedicalHistoryDto.medications || '',
      surgeries: createMedicalHistoryDto.surgeries || '',
      familyHistory: createMedicalHistoryDto.familyHistory || '',
      bloodType: createMedicalHistoryDto.bloodType || '',
      immunizations: createMedicalHistoryDto.immunizations || '',
      isPrivate: createMedicalHistoryDto.isPrivate !== undefined ? createMedicalHistoryDto.isPrivate : true,
    });

    return newMedicalHistory.save();
  }

  /**
   * Find a medical history record by ID
   */
  async findOne(userId: Types.ObjectId, id: string): Promise<MedicalHistory> {
    const medicalHistory = await this.medicalHistoryModel.findById(id).exec();
    
    if (!medicalHistory) {
      throw new NotFoundException('Medical history record not found');
    }
    
    return medicalHistory;
  }

  /**
   * Find all medical history records for a family member
   */
  async findByFamilyMemberId(userId: Types.ObjectId, familyMemberId: string): Promise<MedicalHistory | null> {
    const familyMember = await this.familyMemberModel.findById(familyMemberId);
    
    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }
    
    // Find the medical history for this family member
    const medicalHistory = await this.medicalHistoryModel.findOne({ familyMemberId }).exec();
    
    // If no record exists, return null instead of throwing an error
    if (!medicalHistory) {
      return null;
    }
    
    return medicalHistory;
  }

  /**
   * Update a medical history record
   */
  async update(userId: Types.ObjectId, id: string, updateMedicalHistoryDto: UpdateMedicalHistoryDto): Promise<MedicalHistory> {
    const medicalHistory = await this.medicalHistoryModel.findById(id).exec();
    
    if (!medicalHistory) {
      throw new NotFoundException('Medical history record not found');
    }
    
    // Handle healthConditions update if provided
    if (updateMedicalHistoryDto.healthConditions) {
      // Convert from object to Map
      const healthConditionsMap = medicalHistory.healthConditions || new Map<string, boolean>();
      Object.entries(updateMedicalHistoryDto.healthConditions).forEach(([key, value]) => {
        healthConditionsMap.set(key, value);
      });
      medicalHistory.healthConditions = healthConditionsMap;
    }

    // Update other fields if provided
    if (updateMedicalHistoryDto.allergies !== undefined) {
      medicalHistory.allergies = updateMedicalHistoryDto.allergies;
    }
    
    if (updateMedicalHistoryDto.medications !== undefined) {
      medicalHistory.medications = updateMedicalHistoryDto.medications;
    }
    
    if (updateMedicalHistoryDto.surgeries !== undefined) {
      medicalHistory.surgeries = updateMedicalHistoryDto.surgeries;
    }
    
    if (updateMedicalHistoryDto.familyHistory !== undefined) {
      medicalHistory.familyHistory = updateMedicalHistoryDto.familyHistory;
    }
    
    if (updateMedicalHistoryDto.bloodType !== undefined) {
      medicalHistory.bloodType = updateMedicalHistoryDto.bloodType;
    }
    
    if (updateMedicalHistoryDto.immunizations !== undefined) {
      medicalHistory.immunizations = updateMedicalHistoryDto.immunizations;
    }
    
    if (updateMedicalHistoryDto.isPrivate !== undefined) {
      medicalHistory.isPrivate = updateMedicalHistoryDto.isPrivate;
    }

    return medicalHistory.save();
  }
  // Deletes record
  async remove(userId: Types.ObjectId, id: string): Promise<{ deleted: boolean }> {
    const medicalHistory = await this.medicalHistoryModel.findById(id).exec();
    
    if (!medicalHistory) {
      throw new NotFoundException('Medical history record not found');
    }
    
    await this.medicalHistoryModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
} 