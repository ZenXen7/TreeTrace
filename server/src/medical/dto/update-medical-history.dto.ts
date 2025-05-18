import { IsString, IsOptional, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicalHistoryDto } from './create-medical-history.dto';

export class UpdateMedicalHistoryDto extends PartialType(CreateMedicalHistoryDto) {
  @IsObject()
  @IsOptional()
  healthConditions?: Record<string, boolean>;

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