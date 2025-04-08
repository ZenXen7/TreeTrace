import {
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsDateString,
} from 'class-validator';

export class CreateFamilyMemberDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsDateString()
  deathDate?: Date;

  @IsOptional()
  @IsArray()
  medicalConditions?: string[];

  @IsString()
  relationship: string;

  @IsOptional()
  @IsMongoId()
  fatherId?: string;

  @IsOptional()
  @IsMongoId()
  motherId?: string;

  @IsOptional()
  @IsString()
  gender?: string;
}
