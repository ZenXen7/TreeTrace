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
  @IsString()
  imageUrl?: string;

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
