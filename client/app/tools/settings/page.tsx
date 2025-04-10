"use client"

import { useAuthStore } from "@/store/useAuthStore"
import type React from "react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

const ProfileSettings = () => {
  // Split selectors to minimize re-renders
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile)
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile)

  const [formData, setFormData] = useState<{
    firstName: string
    lastName: string
    email: string
    password?: string  // Make password optional
  }>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  
  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        password: "", // Never pre-fill the password field for security reasons
      })
    }
  }, [user])

  // Fetch user profile only once when component mounts
  useEffect(() => {
    if (!user) {
      fetchUserProfile()
    }
  }, []) // Empty dependency array to run only once

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    // Simple client-side password validation: check if password is at least 6 characters long
    if (formData.password && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.")
      return
    }
  
    const updatedData = { ...formData }
    if (!formData.password) {
      delete updatedData.password
    }
  
    try {
      await updateUserProfile(updatedData)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    }
  }
  

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Profile Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            disabled // Make email read-only
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            New Password (Leave blank to keep current)
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  )
}

export default ProfileSettings
