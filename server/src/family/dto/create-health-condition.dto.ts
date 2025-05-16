import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateHealthConditionDto {
  @IsString()
  @IsNotEmpty()
  conditionName: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  diagnosisDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  familyMemberId?: string | Types.ObjectId;
} 