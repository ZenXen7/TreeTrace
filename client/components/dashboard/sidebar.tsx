"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TreePine, BarChart3, Heart, LogOut, HelpCircle, Search, User } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { motion } from "framer-motion"

const mainNavItems = [
  { title: "Dashboard", icon: <BarChart3 className="h-5 w-5" />, href: "./main" },
  { title: "My Tree", icon: <TreePine className="h-5 w-5" />, href: "./treeview" },
  { title: "Search Users", icon: <Search className="h-5 w-5" />, href: "/search" },
  { title: "Health Overview", icon: <Heart className="h-5 w-5" />, href: "./health-overview" },
]

const toolsNavItems = [
  { title: "Profile Settings", icon: <User className="h-5 w-5" />, href: "/tools/settings" },
  { title: "User Guide", icon: <HelpCircle className="h-5 w-5" />, href: "/tools/user-guide" },
]

interface SidebarProps {
  sidebarOpen: boolean
}

export function Sidebar({ sidebarOpen }: SidebarProps) {
  const [mounted, setMounted] = useState(false)
  const { user, fetchUserProfile, isAuthenticated, logout } = useAuthStore((state) => state)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      fetchUserProfile()
    }
  }, [isAuthenticated, fetchUserProfile])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-80 bg-gradient-to-b from-gray-900/95 to-gray-950/95 backdrop-blur-xl border-r border-gray-700/50 z-40 transition-all duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${mounted ? "opacity-100" : "opacity-0"}`}
    >
      <div className="p-6 h-full flex flex-col">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <TreePine className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <span className="font-bold text-white text-xl tracking-tight">TreeTrace</span>
            <p className="text-xs text-gray-400">Family Heritage Platform</p>
          </div>
        </motion.div>

        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="rounded-xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm p-4 border border-gray-700/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-teal-500/20 ring-2 ring-teal-500/10">
                <AvatarImage src="/placeholder.svg?height=48&width=48" />
                <AvatarFallback className="bg-gradient-to-br from-teal-500/20 to-blue-500/20 text-teal-400 font-semibold">
                  {user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User" : "Loading..."}
                </p>
                <p className="text-xs text-gray-400">Family Historian</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-1 mb-6 flex-1">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-3">Main</p>
            <div className="space-y-1">
              {mainNavItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <Link href={item.href}>
                    <button className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 group">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-blue-500/0 rounded-md group-hover:from-teal-500/20 group-hover:to-blue-500/20 transition-all duration-300" />
                        <div className="relative">{item.icon}</div>
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="pt-6"
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-3">Tools</p>
            <div className="space-y-1">
              {toolsNavItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                >
                  <Link href={item.href}>
                    <button className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 group">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-blue-500/0 rounded-md group-hover:from-teal-500/20 group-hover:to-blue-500/20 transition-all duration-300" />
                        <div className="relative">{item.icon}</div>
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </nav>

        {/* Logout Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="pt-4 border-t border-gray-700/50"
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-600/0 rounded-md group-hover:from-red-500/20 group-hover:to-red-600/20 transition-all duration-300" />
              <LogOut className="h-5 w-5" />
            </div>
            <span className="font-medium">Log Out</span>
          </button>
        </motion.div>
      </div>
    </aside>
  )
}
