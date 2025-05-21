"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Trees,
  GitMerge,
  Settings,
  BarChart3,

  Heart,
  Calendar,
  LogOut,
  HelpCircle,
  Sparkles,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/store/useAuthStore"

const mainNavItems = [
  { title: "Dashboard", icon: <BarChart3 className="h-5 w-5" />, href: "./main" },
  { title: "My Tree", icon: <Trees className="h-5 w-5" />, href: "./treeview" },
  { title: "Search Users", icon: <Search className="h-5 w-5" />, href: "/search" },
  { title: "Health Overview", icon: <Heart className="h-5 w-5" />, href: "./health-overview" },
]

const toolsNavItems = [
  { title: "Settings", icon: <Settings className="h-5 w-5" />, href: "/tools/settings" },
]

interface SidebarProps {
  sidebarOpen: boolean
}

export function Sidebar({ sidebarOpen }: SidebarProps) {
  const [mounted, setMounted] = useState(false)
  const { user, fetchUserProfile, isAuthenticated } = useAuthStore((state) => state) // Access user data from the store

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      fetchUserProfile() // Fetch user profile data on mount if authenticated
    }
  }, [isAuthenticated, fetchUserProfile])

  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-80 bg-gray-900/70 backdrop-blur-xl border-r border-gray-800/50 z-40 transition-all duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${mounted ? "opacity-100" : "opacity-0"}`}
    >
      <div className="p-6 h-full flex flex-col">
       
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl opacity-20 animate-pulse" />
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-2">
              <path
                d="M12 3v18M12 7l-3-3M12 7l3-3M5 12h14M7 12l-3 3M7 12l-3-3M17 12l3 3M17 12l3-3M12 17l-3 3M12 17l3 3"
                stroke="url(#logoGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <span className="font-bold text-white text-xl tracking-tight">TreeTrace</span>
            <p className="text-xs text-gray-400">Family connections</p>
          </div>
        </div>

    
        <div className="mb-8 relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl blur-sm" />
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12 border-2 border-emerald-500/20 ring-2 ring-emerald-500/10">
                <AvatarImage src="/placeholder.svg?height=48&width=48" />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400">
                  JD
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{user ? user.firstName : "Loading..."}</p>
                  <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/20 text-[10px]">
                    PRO
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">Family historian</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Storage</span>
                <span>65%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: mounted ? "65%" : "0%" }}
                />
              </div>
              <div className="flex justify-between text-gray-500 text-[10px]">
                <span>6.5 GB used</span>
                <span>10 GB total</span>
              </div>
            </div>
          </div>
        </div>

       
        <nav className="space-y-1 mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">Main</p>
          {mainNavItems.map((item, index) => (
            <Link key={item.title} href={item.href}>
              <button
                className="flex items-center justify-between w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors group cursor-pointer"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(10px)",
                  transition: `opacity 0.3s ease, transform 0.3s ease`,
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 rounded-md group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-300" />
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </div>
              </button>
            </Link>
          ))}

          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2 mt-6">Tools</p>
          {toolsNavItems.map((item, index) => (
            <Link key={item.title} href={item.href}>
              <button
                className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors group cursor-pointer"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(10px)",
                  transition: `opacity 0.3s ease, transform 0.3s ease`,
                  transitionDelay: `${(mainNavItems.length + index) * 50}ms`,
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 rounded-md group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-300" />
                  {item.icon}
                </div>
                <span>{item.title}</span>
              </button>
            </Link>
          ))}
        </nav>

     
        <div className="mt-auto space-y-6">
         

         
          <div
            className="space-y-1"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.5s ease",
              transitionDelay: "500ms",
            }}
          >
            
            <Link href="/">
              <button 
                onClick={() => useAuthStore.getState().logout()}
                className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}

