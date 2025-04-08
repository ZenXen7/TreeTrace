import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:3001/', 
  headers: {
    'Content-Type': 'application/json',
  },
});

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  parentId: string | null;
}

interface FamilyTreeState {
  members: FamilyMember[];
  isLoading: boolean;
  error: string | null;
  addMember: (member: FamilyMember) => Promise<void>;
  updateMember: (id: string, updatedInfo: Partial<FamilyMember>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  fetchFamilyTree: () => Promise<void>;
}

export const useTreeStore = create<FamilyTreeState>((set) => ({
  members: [],
  isLoading: false,
  error: null,

  // Action to add a family member
  addMember: async (member: FamilyMember) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/add', member);
      toast.success('Family member added successfully!');
      set((state) => ({
        members: [...state.members, response.data],
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add family member');
    } finally {
      set({ isLoading: false });
    }
  },

  // Action to update a family member's details
  updateMember: async (id: string, updatedInfo: Partial<FamilyMember>) => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/update/${id}`, updatedInfo);
      toast.success('Family member updated successfully!');
      set((state) => ({
        members: state.members.map((member) =>
          member.id === id ? { ...member, ...updatedInfo } : member
        ),
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update family member');
    } finally {
      set({ isLoading: false });
    }
  },

  // Action to remove a family member
  removeMember: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.delete(`/remove/${id}`);
      toast.success('Family member removed successfully!');
      set((state) => ({
        members: state.members.filter((member) => member.id !== id),
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove family member');
    } finally {
      set({ isLoading: false });
    }
  },

  // Action to fetch the full family tree
  fetchFamilyTree: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/tree');
      set({ members: response.data });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch family tree');
    } finally {
      set({ isLoading: false });
    }
  },
}));
