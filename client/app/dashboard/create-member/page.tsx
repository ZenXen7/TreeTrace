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

export default function CreateMemberPage() {
  const { createFamilyMember } = useTreeStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: 'alive',
    gender: '',
    birthDate: '',
    deathDate: '',
    fatherId: '',
    motherId: '',
    partnerId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted!");
    setIsLoading(true);
    const payload = {
      name: formData.name,
      birthDate: new Date(formData.birthDate).toISOString(),
      deathDate: formData.deathDate ? new Date(formData.deathDate).toISOString() : undefined,
      status: formData.status.toLowerCase(),
      gender: formData.gender,
      fatherId: formData.fatherId?.trim() || undefined,
      motherId: formData.motherId?.trim() || undefined,
      partnerId: formData.partnerId?.trim() || undefined,
    };
    
    console.log("Final payload:", payload);
    try {
      await createFamilyMember({
        name: formData.name,
  gender: formData.gender,
  birthDate: new Date(formData.birthDate).toISOString(),
  deathDate: formData.deathDate ? new Date(formData.deathDate).toISOString() : undefined,
  fatherId: formData.fatherId?.trim() || undefined,
motherId: formData.motherId?.trim() || undefined,
partnerId: formData.partnerId?.trim() || undefined,
  status: formData.status.toLowerCase(),

      });
      toast.success('Family member created successfully');
      console.log('Form data submitted:', formData);
      // Reset form
      setFormData({
        name: '',
        status: 'alive',
        gender: '',
        birthDate: '',
        deathDate: '',
        fatherId: '',
        motherId: '',
        partnerId: ''
      });
    } catch (error) {
      console.error('Error creating member:', error); // ← add this
      toast.error('Failed to create family member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create New Family Member</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
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
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alive">Alive</SelectItem>
                <SelectItem value="dead">Deceased</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
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
              required
            />
          </div>

          <div>
            <Label htmlFor="deathDate">Death Date</Label>
            <Input
              id="deathDate"
              type="date"
              value={formData.deathDate}
              onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="fatherId">Father ID</Label>
            <Input
              id="fatherId"
              value={formData.fatherId}
              onChange={(e) => setFormData({ ...formData, fatherId: e.target.value })}
              placeholder="Enter father's ID"
            />
          </div>

          <div>
            <Label htmlFor="motherId">Mother ID</Label>
            <Input
              id="motherId"
              value={formData.motherId}
              onChange={(e) => setFormData({ ...formData, motherId: e.target.value })}
              placeholder="Enter mother's ID"
            />
          </div>

          <div>
            <Label htmlFor="partnerId">Partner ID</Label>
            <Input
              id="partnerId"
              value={formData.partnerId}
              onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
              placeholder="Enter partner's ID"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
           
          >
            {isLoading ? 'Creating...' : 'Create Family Member'}
          </Button>
        </form>
      </div>
    </div>
  );
}