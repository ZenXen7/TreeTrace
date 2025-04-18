import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsNotEmpty,
  IsEnum,
  IsArray,
} from 'class-validator';

export class CreateFamilyMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsDateString()
  deathDate?: Date;

  @IsOptional()
  @IsEnum(['alive', 'dead', 'unknown'])
  status?: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsOptional()
  @IsMongoId()
  fatherId?: string; // Foreign key to FamilyMember

  @IsOptional()
  @IsMongoId()
  motherId?: string; // Foreign key to FamilyMember

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  partnerId?: string[]; // Foreign key to FamilyMember
}
