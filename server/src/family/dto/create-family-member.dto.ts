import { IsString, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateFamilyMemberDto {
  @IsString()
  name: string;

  @IsDateString()
  @IsOptional()
  birthDate: Date;

  @IsArray()
  @IsOptional()
  medicalConditions: string[];

  @IsString()
  relationship: string;
}
