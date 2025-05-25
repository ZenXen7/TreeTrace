'use client';

import { useState } from 'react';
import useTreeStore from '@/store/useTreeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface FamilyMemberFormProps {
  onSuccess?: () => void;
  initialData?: {
    name?: string;
    surname?: string;
    relationship?: string;
    gender?: string;
    birthDate?: string;
    deathDate?: string;
    fatherId?: string;
    motherId?: string;
    occupation?: string;
    country?: string;
    status?: string;
    imageUrl?: string;
    isPublic?: boolean;
  };
}

export default function FamilyMemberForm({ onSuccess, initialData }: FamilyMemberFormProps) {
  const { createFamilyMember, familyMembers } = useTreeStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    surname: initialData?.surname || '',
    relationship: initialData?.relationship || '',
    gender: initialData?.gender || '',
    birthDate: initialData?.birthDate || '',
    deathDate: initialData?.deathDate || '',
    fatherId: initialData?.fatherId || '',
    motherId: initialData?.motherId || '',
    occupation: initialData?.occupation || '',
    country: initialData?.country || 'Philippines',
    status: initialData?.status || 'alive',
    imageUrl: initialData?.imageUrl || '',
    isPublic: initialData?.isPublic || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        await createFamilyMember({
            ...formData,
            birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
            deathDate: formData.deathDate ? new Date(formData.deathDate) : undefined,
            status: formData.deathDate ? "dead" : formData.status,
          });

      toast.success('Family member created successfully');
      if (onSuccess) onSuccess();
      setFormData({
        name: '',
        surname: '',
        relationship: '',
        gender: '',
        birthDate: '',
        deathDate: '',
        fatherId: '',
        motherId: '',
        occupation: '',
        country: 'Philippines',
        status: 'alive',
        imageUrl: '',
        isPublic: false,
      });
    } catch (error) {
      toast.error('Failed to create family member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeathDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deathDate = e.target.value;
    setFormData({ 
      ...formData, 
      deathDate, 
      status: deathDate ? "dead" : formData.status 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="surname">Surname</Label>
        <Input
          id="surname"
          value={formData.surname}
          onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="relationship">Relationship</Label>
        <Input
          id="relationship"
          value={formData.relationship}
          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Gender</Label>
        <Select
          value={formData.gender}
          onValueChange={(value) => setFormData({ ...formData, gender: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="birthDate">Birth Date</Label>
        <Input
          id="birthDate"
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="deathDate">Death Date</Label>
        <Input
          id="deathDate"
          type="date"
          value={formData.deathDate}
          onChange={handleDeathDateChange}
        />
      </div>

      <div>
        <Label htmlFor="occupation">Occupation</Label>
        <Input
          id="occupation"
          value={formData.occupation}
          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">Profile Image URL</Label>
        <Input
          id="imageUrl"
          placeholder="https://example.com/image.jpg"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
        />
        <p className="text-xs text-gray-500 mt-1">Enter a URL to an image that will be displayed on the family tree card</p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <Label htmlFor="isPublic">Make this family member public</Label>
        <p className="text-xs text-gray-500">Public family members can be viewed by other users</p>
      </div>

      <div>
        <Label>Father</Label>
        <Select
          value={formData.fatherId}
          onValueChange={(value) => setFormData({ ...formData, fatherId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select father" />
          </SelectTrigger>
          <SelectContent>
            {familyMembers
              .filter((member) => member.gender === 'male')
              .map((member) => (
                <SelectItem key={member._id} value={member._id}>
                  {member.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Mother</Label>
        <Select
          value={formData.motherId}
          onValueChange={(value) => setFormData({ ...formData, motherId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select mother" />
          </SelectTrigger>
          <SelectContent>
            {familyMembers
              .filter((member) => member.gender === 'female')
              .map((member) => (
                <SelectItem key={member._id} value={member._id}>
                  {member.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Family Member'}
      </Button>
    </form>
  );
}
