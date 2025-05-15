import {
  IsString,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHealthConditionDto {
  @IsOptional()
  @IsString()
  conditionName?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  diagnosisDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
} 