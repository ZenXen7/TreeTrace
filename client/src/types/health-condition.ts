export interface HealthCondition {
  _id: string;
  familyMemberId: string;
  conditionName: string;
  diagnosisDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 