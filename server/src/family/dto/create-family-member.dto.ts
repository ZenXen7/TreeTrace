import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsDate,
} from 'class-validator';

export class CreateFamilyMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsDate()
  birthDate?: Date;

  @IsOptional()
  @IsDate()
  deathDate?: Date;

  @IsOptional()
  @IsEnum(['alive', 'dead', 'unknown'])
  status?: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  country?: string;

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
  
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  childId?: string[]; // Array of child IDs
  
  @IsOptional()
  @IsString()
  relationship?: string; // Type of relationship to the user
  
  @IsOptional()
  @IsString()
  notes?: string;
}
