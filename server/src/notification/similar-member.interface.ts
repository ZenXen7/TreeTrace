import { Types } from 'mongoose';
import { FamilyMember as BaseFamilyMember } from '../family/family-member.schema';

// Extend FamilyMember type to include _id 
// which is added by Mongoose but not explicitly in the schema
export interface FamilyMemberWithId extends BaseFamilyMember {
  _id: Types.ObjectId;
}

export interface SimilarMember {
  memberId: Types.ObjectId;
  name: string;
  surname: string;
  status?: string;
  birthDate?: Date;
  deathDate?: Date;
  country?: string;
  similarity: number;
  similarFields: string[]; // List of fields that were found to be similar
}

export interface SimilarSurnameGroup {
  surname: string;
  similarity: number;
  members: FamilyMemberWithId[];
}

export interface SimilarityCluster {
  baseSurname: string;
  members: FamilyMemberWithId[];
  similarSurnames: SimilarSurnameGroup[];
} 