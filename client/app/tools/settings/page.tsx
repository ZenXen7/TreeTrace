"use client"

import { useAuthStore } from "@/store/useAuthStore"
import type React from "react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { User, Mail, Lock, Save, ChevronLeft, Eye, EyeOff, Check, AlertCircle, Users } from 'lucide-react'
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
        (name === 'firstName' && value !== (user.firstName || "")) ||
        (name === 'lastName' && value !== (user.lastName || "")) ||
        (name === 'gender' && value !== (user.gender || "")) ||
        (name === 'password' && value.trim() !== "")
      
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
    <div className="min-h-screen bg-black text-white font-sans relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />
      
      {/* Animated Background */}
      <AnimatedNodes />

      <div className="max-w-3xl mx-auto px-4 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-12"
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-400 hover:text-teal-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="ml-1">Back</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gray-900/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-800/50 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/10 to-teal-950/10" />
          
          <div className="p-8 border-b border-gray-800/50 relative">
            <h2 className="text-3xl font-medium bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              Profile Settings
            </h2>
            <p className="text-gray-400 text-sm mt-2">Manage your personal information</p>
          </div>

          <div className="p-8 relative">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-10 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      placeholder="Enter your first name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-10 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <Users className="h-4 w-4" />
                  </div>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full pl-10 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-lg text-gray-400 cursor-not-allowed"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Email address cannot be changed</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Leave blank to keep current password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Password must be at least 6 characters long</p>
              </div>

              <div className="h-12 mt-6">
                <AnimatePresence mode="wait">
                  {updateSuccess && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center text-teal-400 bg-teal-500/10 px-6 py-3 rounded-xl"
                    >
                      <Check className="h-5 w-5 mr-2" />
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
                      className="flex items-center text-red-400 bg-red-500/10 px-6 py-3 rounded-xl"
                    >
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>{updateError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div 
                className="pt-6 flex justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  type="submit"
                  disabled={isLoading || !isDirty}
                  className={`relative flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-all overflow-hidden shadow-lg ${
                    isDirty 
                      ? 'bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white hover:shadow-teal-500/25' 
                      : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="text-sm">Updating...</span>
                      </motion.div>
                    ) : updateSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Saved</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="save"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        <span className="text-sm">Save Changes</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfileSettings
