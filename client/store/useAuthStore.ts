import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

interface AuthState {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginSuccess: boolean;
  register: (userData: RegisterData) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  loginSuccess: false,

  createUser: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error creating account');
    }
  },
  
  register: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await api.post("/auth/register", userData);
      toast.success("Registration successful!");
      set({ 
        user: response.data.user,
        isAuthenticated: true 
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await api.post("/auth/login", credentials);
      const { access_token, user } = response.data.data;

      // Store token and user data
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      set({ 
        user,
        isAuthenticated: true,
        loginSuccess: true
      });

      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
      set({ loginSuccess: false });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ 
      user: null,
      isAuthenticated: false,
      loginSuccess: false
    });
    toast.success("Logged out successfully");
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "");
        set({ 
          user,
          isAuthenticated: true
        });
      } catch (error) {
        set({ 
          user: null,
          isAuthenticated: false
        });
      }
    }
  },
}));