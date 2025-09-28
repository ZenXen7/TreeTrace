import { create } from "zustand";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
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

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: string;
}

interface UserSearchState {
  searchResults: User[];
  isLoading: boolean;
  error: string | null;
  searchUsers: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  clearError: () => void;
}

const useUserSearchStore = create<UserSearchState>((set) => ({
  // State
  searchResults: [],
  isLoading: false,
  error: null,

  // Actions
  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      set({ 
        searchResults: response.data.data, 
        isLoading: false 
      });
    } catch (error: unknown) {
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || "Failed to search users";
      toast.error(errorMessage);
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },

  clearSearchResults: () => set({ searchResults: [] }),
  
  clearError: () => set({ error: null })
}));

export default useUserSearchStore; 