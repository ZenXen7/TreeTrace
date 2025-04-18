import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';

export class CreateFamilyMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: Date;

  @IsOptional()
  @IsDateString()
  deathDate?: Date;

  @IsEnum(['alive', 'dead', 'unknown'])
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsMongoId()
  fatherId?: string; // Foreign key to FamilyMember

  @IsOptional()
  @IsMongoId()
  motherId?: string; // Foreign key to FamilyMember

  @IsOptional()
  @IsMongoId()
  partnerId?: string; // Foreign key to FamilyMember
}
