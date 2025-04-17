"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
    }
    
    initAuth()
  }, [checkAuth])

  return isAuthenticated ? <>{children}</> : null
}