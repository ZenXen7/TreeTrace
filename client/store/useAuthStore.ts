"use client"

import { create } from "zustand"
import axios from "axios"
import { toast } from "react-hot-toast"

// Create a safe localStorage wrapper to handle server-side rendering
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  },
}

const api = axios.create({
  baseURL: "http://localhost:3001", // Change to your API base URL
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = safeLocalStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface AuthState {
  user: UserData | null
  isLoading: boolean
  isAuthenticated: boolean
  loginSuccess: boolean
  register: (userData: RegisterData) => Promise<void>
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  fetchUserProfile: () => Promise<void>
  updateUserProfile: (userData: UpdateUserData) => Promise<void>
}

interface UserData {
  _id: string
  firstName: string
  lastName: string
  email: string
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  loginSuccess: false,

  // Register user
  register: async (userData) => {
    set({ isLoading: true })
    try {
      const response = await api.post("/auth/register", userData)
      toast.success("Registration successful!")
      set({
        user: response.data.user,
        isAuthenticated: true,
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed")
    } finally {
      set({ isLoading: false })
    }
  },

  // Login user
  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const response = await api.post("/auth/login", credentials)
      const { access_token, user } = response.data.data

      // Store token and user data
      safeLocalStorage.setItem("token", access_token)
      safeLocalStorage.setItem("user", JSON.stringify(user))

      set({
        user,
        isAuthenticated: true,
        loginSuccess: true,
      })

      toast.success("Login successful!")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed")
      set({ loginSuccess: false })
    } finally {
      set({ isLoading: false })
    }
  },

  // Logout user
  logout: () => {
    safeLocalStorage.removeItem("token")
    safeLocalStorage.removeItem("user")
    set({
      user: null,
      isAuthenticated: false,
      loginSuccess: false,
    })
    toast.success("Logged out successfully")
  },

  // Check if user is authenticated
  checkAuth: async () => {
    const token = safeLocalStorage.getItem("token")
    if (token) {
      try {
        const userStr = safeLocalStorage.getItem("user")
        if (userStr && userStr !== "undefined") {
          const user = JSON.parse(userStr)
          set({
            user,
            isAuthenticated: true,
          })
        } else {
          // If user data is invalid, fetch it from the server
          const response = await api.get("/users/profile")
          const user = response.data.data
          safeLocalStorage.setItem("user", JSON.stringify(user))
          set({
            user,
            isAuthenticated: true,
          })
        }
      } catch (error) {
        safeLocalStorage.removeItem("token")
        safeLocalStorage.removeItem("user")
        set({
          user: null,
          isAuthenticated: false,
        })
      }
    }
  },
  // Fetch user profile
  fetchUserProfile: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get("/users/profile")
      const user = response.data.data
      safeLocalStorage.setItem("user", JSON.stringify(user))
      set({
        user,
        isAuthenticated: true,
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch profile")
      set({ isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  // Update user profile
  updateUserProfile: async (userData) => {
    set({ isLoading: true })
    try {
      const response = await api.patch("/users/profile", userData)
      const user = response.data.data
      safeLocalStorage.setItem("user", JSON.stringify(user))
      set({
        user,
        isAuthenticated: true,
      })
      toast.success("Profile updated successfully")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile")
    } finally {
      set({ isLoading: false })
    }
  },
}))
