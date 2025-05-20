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
  surname?: string;
  birthDate?: Date;
  deathDate?: Date;
  occupation?: string;
  country?: string;
  tags?: string[];
  status: string;
  gender?: string;
  medicalConditions?: string[];
  userId: string;
  fatherId?: string;
  motherId?: string;
  partnerId?: string[];
  childId?: string[];
}

interface FamilyTreeNode extends FamilyMember {
  father?: FamilyTreeNode | null;
  mother?: FamilyTreeNode | null;
  partner?: FamilyTreeNode | null;
  childNodes?: FamilyTreeNode[];
}

interface CreateFamilyMemberDto {
  name: string;
  surname?: string;
  birthDate?: Date;
  deathDate?: Date;
  gender?: string;
  medicalConditions?: string[];
  occupation?: string;
  country?: string;
  status?: string;
  fatherId?: string;
  motherId?: string;
  partnerId?: string[];
  childId?: string[];
}

interface TreeState {
  familyMembers: FamilyMember[];
  currentFamilyTree: FamilyTreeNode | null;
  isLoading: boolean;
  error: string | null;
  fetchAllFamilyMembers: () => Promise<void>;
  getFamilyTree: (id: string) => Promise<void>;
  getPublicFamilyTree: (userId: string) => Promise<void>;
  createFamilyMember: (member: CreateFamilyMemberDto) => Promise<void>;
  updateFamilyMember: (id: string, member: Partial<CreateFamilyMemberDto>) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  generatePublicLink: (treeId: string) => string;
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

  getPublicFamilyTree: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get all family members for this user
      const response = await api.get(`/family-members/user/${userId}`);
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const familyMembers = response.data.data;
        console.log(`Found ${familyMembers.length} family members for user ${userId}`);
        
        // Process data like in TreeView
        const processedData = familyMembers.map((member: any) => ({
          id: member._id,
          name: member.name || '',
          surname: member.surname || '',
          gender: member.gender || '',
          status: member.status || 'unknown',
          birthDate: member.birthDate || '',
          deathDate: member.deathDate || '',
          country: member.country || '',
          occupation: member.occupation || '',
          fid: member.fatherId || '',
          mid: member.motherId || '',
          pids: member.partnerId || [],
          childId: member.childId || [],
          tags: member.tags || []
        }));
        
        set({ 
          familyMembers: familyMembers,
          currentFamilyTree: processedData,
          isLoading: false 
        });
        toast.success("Family tree loaded successfully");
      } else {
        console.log("No family tree data received:", response.data);
        set({
          currentFamilyTree: null,
          error: "No family tree found for this user",
          isLoading: false
        });
        toast.error("No family tree found for this user");
      }
    } catch (error: unknown) {
      console.error("Error fetching family tree:", error);
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || 
        (error instanceof Error ? error.message : "Failed to fetch public family tree");
      toast.error(errorMessage);
      set({ 
        error: errorMessage,
        isLoading: false,
        currentFamilyTree: null
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

  generatePublicLink: (treeId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public-tree/${treeId}`;
  },

  clearError: () => set({ error: null })
}));

export default useTreeStore;