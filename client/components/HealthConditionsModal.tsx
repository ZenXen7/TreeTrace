import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import HealthConditions from './HealthConditions';

interface HealthConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMemberId: string;
  familyMemberName: string;
}

export default function HealthConditionsModal({
  isOpen,
  onClose,
  familyMemberId,
  familyMemberName
}: HealthConditionsModalProps) {
  if (!isOpen || !familyMemberId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Health Conditions for {familyMemberName}</DialogTitle>
          <DialogDescription>
            Add, edit, or remove health conditions for this family member.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <HealthConditions familyMemberId={familyMemberId} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 