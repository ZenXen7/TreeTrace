export interface FamilyMember {
  _id: string;
  name: string;
  birthDate?: Date;
  deathDate?: Date;
  medicalConditions?: string[];
  relationship: string;
  userId: string;
  fatherId?: string;
  motherId?: string;
  children?: string[];
  gender?: string;
  notes?: string;
  photoUrl?: string;
} 