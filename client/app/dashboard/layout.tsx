"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
      if (!isAuthenticated) {
        router.push("/auth/login")
      }
    }
    
    initAuth()
  }, [isAuthenticated, checkAuth, router])

  if (!isAuthenticated) {
    return null 
  }

  return <>{children}</>
}