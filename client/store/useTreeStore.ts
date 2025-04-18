import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface FamilyMember {
  _id: string;
  name: string;
  birthDate?: Date;
  deathDate?: Date;
 status: string;
  gender?: string;
  medicalConditions?: string[];
  userId: string;
  fatherId?: string;
  motherId?: string;
  partnerId?: string;
  children: string[];
}

interface FamilyTreeNode extends FamilyMember {
  father?: FamilyTreeNode | null;
  mother?: FamilyTreeNode | null;
  partner?: FamilyTreeNode | null;
  childNodes?: FamilyTreeNode[];
}

interface CreateFamilyMemberDto {

  name: string;
  birthDate?: string;
  deathDate?: string;
  // relationship: string;
  gender?: string;
  medicalConditions?: string[];
  fatherId?: string;
  motherId?: string;
  status?: string;
  partnerId?: string;
}

interface TreeState {
  familyMembers: FamilyMember[];
  currentFamilyTree: FamilyTreeNode | null;
  isLoading: boolean;
  error: string | null;
  fetchAllFamilyMembers: () => Promise<void>;
  getFamilyTree: (id: string) => Promise<void>;
  createFamilyMember: (member: CreateFamilyMemberDto) => Promise<void>;
  updateFamilyMember: (id: string, member: Partial<CreateFamilyMemberDto>) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  clearError: () => void;
}

const useTreeStore = create<TreeState>((set) => ({
  // State
  familyMembers: [],
  currentFamilyTree: null,
  isLoading: false,
  error: null,

  // Actions
  fetchAllFamilyMembers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/family-members");
      set({ 
        familyMembers: response.data.data, 
        isLoading: false 
      });
      toast.success("Family members loaded successfully");
    } catch (error: unknown) {
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || "Failed to fetch family members";
      toast.error(errorMessage);
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },

  getFamilyTree: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/family-members/${id}/family-tree`);
      set({ 
        currentFamilyTree: response.data.data, 
        isLoading: false 
      });
      toast.success("Family tree loaded successfully");
    } catch (error: unknown) {
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || "Failed to fetch family tree";
      toast.error(errorMessage);
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },

  createFamilyMember: async (member: CreateFamilyMemberDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/family-members", member);
      const newMember = response.data.data;
      set((state) => ({
        familyMembers: [...state.familyMembers, newMember],
        isLoading: false
      }));
      toast.success("Family member created successfully");
    } catch (error: unknown) {
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || "Failed to create family member";
      toast.error(errorMessage);
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },

  updateFamilyMember: async (id: string, member: Partial<CreateFamilyMemberDto>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/family-members/${id}`, member);
      const updatedMember = response.data.data;
      set((state) => ({
        familyMembers: state.familyMembers.map((m) => 
          m._id === updatedMember._id ? updatedMember : m
        ),
        isLoading: false
      }));
      toast.success("Family member updated successfully");
    } catch (error: unknown) {
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || "Failed to update family member";
      toast.error(errorMessage);
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },

  deleteFamilyMember: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/family-members/${id}`);
      set((state) => ({
        familyMembers: state.familyMembers.filter((m) => m._id.toString() !== id),
        isLoading: false
      }));
      toast.success("Family member deleted successfully");
    } catch (error: unknown) {
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || "Failed to delete family member";
      toast.error(errorMessage);
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null })
}));

export default useTreeStore;