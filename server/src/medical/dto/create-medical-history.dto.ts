import { IsString, IsOptional, IsBoolean, IsObject, IsMongoId, IsEnum } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMedicalHistoryDto {
  @IsMongoId()
  familyMemberId: Types.ObjectId;

  @IsObject()
  healthConditions: Record<string, boolean>;

  @IsString()
  @IsOptional()
  allergies?: string;

  @IsString()
  @IsOptional()
  medications?: string;

  @IsString()
  @IsOptional()
  surgeries?: string;

  @IsString()
  @IsOptional()
  familyHistory?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''])
  bloodType?: string;

  @IsString()
  @IsOptional()
  immunizations?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
} 