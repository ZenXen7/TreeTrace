"use client"

import type React from "react"

import { useAuthStore } from "@/store/useAuthStore"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { User, Mail, Lock, Save, ArrowLeft, Eye, EyeOff, Check, AlertCircle, Users, UserCircle } from "lucide-react"
import Link from "next/link"
import AnimatedNodes from "@/components/animated-nodes"

const ProfileSettings = () => {
  // Split selectors to minimize re-renders
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile)
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile)
  const [showPassword, setShowPassword] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [initialData, setInitialData] = useState<{
    firstName: string
    lastName: string
    email: string
    gender: string
  } | null>(null)

  const [formData, setFormData] = useState<{
    firstName: string
    lastName: string
    email: string
    gender: string
    password?: string
  }>({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    password: "",
  })

  // Initialize form data and initial data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        gender: user.gender || "",
        password: "", // Never pre-fill the password field for security reasons
      })
      setIsDirty(false)
      setInitialData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        gender: user.gender || "",
      })
    }
  }, [user])

  // Fetch user profile only once when component mounts
  useEffect(() => {
    if (!user) {
      fetchUserProfile()
    }
  }, []) // Empty dependency array to run only once

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))

    // Check if the new value is different from the original user data
    if (user) {
      const hasChanges =
        (name === "firstName" && value !== (user.firstName || "")) ||
        (name === "lastName" && value !== (user.lastName || "")) ||
        (name === "gender" && value !== (user.gender || "")) ||
        (name === "password" && value.trim() !== "")

      setIsDirty(hasChanges)
    }

    // Clear success/error states when user makes changes
    if (updateSuccess) setUpdateSuccess(false)
    if (updateError) setUpdateError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDirty) return

    setUpdateSuccess(false)
    setUpdateError(null)

    if (formData.password && formData.password.length < 6) {
      setUpdateError("Password must be at least 6 characters long.")
      return
    }

    const updatedData = { ...formData }
    if (!formData.password?.trim()) {
      delete updatedData.password
    }

    try {
      await updateUserProfile(updatedData)
      setUpdateSuccess(true)
      setIsDirty(false)

      // Update initial data after successful save
      if (initialData) {
        setInitialData({
          ...initialData,
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
        })
      }

      // Reset success state after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error("Profile update error:", error)
      const errorMessage = error.response?.data?.message || "Server error occurred. Please try again later."
      setUpdateError(errorMessage)
      toast.error(errorMessage)
    }
  }

  // Add error handling to profile fetch
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user) {
          await fetchUserProfile()
        }
      } catch (error: any) {
        console.error("Profile fetch error:", error)
        toast.error(error.response?.data?.message || "Failed to load profile. Please refresh the page.")
      }
    }
    loadProfile()
  }, [user, fetchUserProfile])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />
      <AnimatedNodes />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between p-6 lg:p-8">
        <Link
          href="/dashboard/main"
          className="group flex items-center gap-3 text-gray-400 hover:text-teal-400 transition-colors"
        >
          <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors">
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="font-medium">Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <UserCircle className="h-4 w-4 text-teal-400" />
            <span className="text-sm text-gray-300">Profile Settings</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 overflow-hidden shadow-2xl"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-8 border-b border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/20 rounded-xl">
                <UserCircle className="h-8 w-8 text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                <p className="text-gray-400 text-sm">Update your personal information</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent flex-1" />
                  <span className="text-sm font-medium text-teal-400">Personal Information</span>
                  <div className="h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full h-12 pl-12 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                        placeholder="Enter your first name"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                      Last Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full h-12 pl-12 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                        placeholder="Enter your last name"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-300">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full h-12 pl-12 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Select your gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent flex-1" />
                  <span className="text-sm font-medium text-blue-400">Account Information</span>
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent flex-1" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full h-12 pl-12 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-400 cursor-not-allowed"
                      disabled
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full h-12 pl-12 pr-12 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      placeholder="Leave blank to keep current password"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                </div>
              </div>

              {/* Status Messages */}
              <div className="h-16">
                <AnimatePresence mode="wait">
                  {updateSuccess && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center text-teal-400 bg-teal-500/10 px-6 py-4 rounded-xl border border-teal-500/20"
                    >
                      <Check className="h-5 w-5 mr-3" />
                      <span>Profile updated successfully!</span>
                    </motion.div>
                  )}

                  {updateError && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center text-red-400 bg-red-500/10 px-6 py-4 rounded-xl border border-red-500/20"
                    >
                      <AlertCircle className="h-5 w-5 mr-3" />
                      <span>{updateError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !isDirty}
                  className={`relative flex items-center gap-3 px-8 py-3 font-medium rounded-xl transition-all duration-300 shadow-lg ${
                    isDirty
                      ? "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
                      : "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : updateSuccess ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfileSettings
