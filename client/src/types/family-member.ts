import { HealthCondition } from './health-condition';

export interface FamilyMember {
  _id: string;
  name: string;
  surname?: string;
  birthDate?: Date;
  deathDate?: Date;
  healthConditions?: HealthCondition[];
  relationship: string;
  userId: string;
  fatherId?: string;
  motherId?: string;
  children?: string[];
  gender?: string;
  notes?: string;
  photoUrl?: string;
  occupation?: string;
  country?: string;
  status?: string;
}