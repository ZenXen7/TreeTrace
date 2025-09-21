"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  TreePine,
  Heart,
  Sparkles,
  Users,
  Plus,
  FileText,
  Menu,
  X,
  ChevronRight,
  Settings,
  Search,
  BookOpen,
  HelpCircle,
  Activity,
  BarChart3,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import AnimatedNodes from "@/components/animated-nodes"
import AIChatSidebar from "@/components/AIChatSidebar"
import AIChatToggle from "@/components/AIChatToggle"

export default function Dashboard() {
  const { user, fetchUserProfile, isAuthenticated } = useAuthStore((state) => state)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [allFamilyData, setAllFamilyData] = useState<any[]>([])
  const [stats, setStats] = useState({
    familyMembers: 0,
    healthRecords: 0,
    generations: 0,
    aiSuggestions: 0
  })
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login")
      return
    }

    if (isAuthenticated) {
      fetchUserProfile()
    }
  }, [isAuthenticated, fetchUserProfile, router])

  useEffect(() => {
    async function fetchAllData() {
      const token = localStorage.getItem("token")
      if (!token) return
      // 1. Fetch all family members
      const res = await fetch("http://localhost:3001/family-members", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const familyMembers = (await res.json()).data || []
      
      // 2. For each member, fetch their medical history and suggestion count
      const allData = await Promise.all(
        familyMembers.map(async (member: any) => {
          let medicalHistory = null
          let suggestionCount = 0
          
          try {
            const medRes = await fetch(`http://localhost:3001/medical-history/family-member/${member._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (medRes.ok) {
              medicalHistory = (await medRes.json()).data
            }
          } catch {}
          
          // Fetch suggestion count for this member using the same function as treeview
          try {
            // Import the getMemberSuggestionCount function from treeview service
            const { getMemberSuggestionCount } = await import('../treeview/service/familyService')
            const suggestionCounts = await getMemberSuggestionCount(token, member._id)
            suggestionCount = typeof suggestionCounts === 'object' ? suggestionCounts.filteredCount : suggestionCounts
          } catch {}
          
          return { ...member, medicalHistory, suggestionCount }
        }),
      )
      setAllFamilyData(allData)

      // Calculate statistics
      const memberMap = new Map<string, any>()
      allData.forEach((m) => memberMap.set(m._id, m))

      // Calculate generations
      function getGeneration(member: any, visited = new Set<string>()): number {
        if (visited.has(member._id)) return 1
        visited.add(member._id)
        let fatherGen = 0,
          motherGen = 0
        if (member.fatherId && memberMap.has(member.fatherId)) {
          fatherGen = getGeneration(memberMap.get(member.fatherId), visited)
        }
        if (member.motherId && memberMap.has(member.motherId)) {
          motherGen = getGeneration(memberMap.get(member.motherId), visited)
        }
        return 1 + Math.max(fatherGen, motherGen)
      }

      // Count members with health records
      const healthRecordsCount = allData.filter(member => 
        member.medicalHistory && 
        member.medicalHistory.healthConditions && 
        Object.values(member.medicalHistory.healthConditions).some(val => val)
      ).length

      // Calculate max generation
      const maxGeneration = Math.max(...allData.map(member => getGeneration(member)))

      // Calculate total AI suggestions across all members (same as treeview)
      const totalAISuggestions = allData.reduce((total, member) => total + (member.suggestionCount || 0), 0)

      setStats({
        familyMembers: allData.length,
        healthRecords: healthRecordsCount,
        generations: maxGeneration,
        aiSuggestions: totalAISuggestions // Real AI suggestion count from all members
      })
    }
    fetchAllData()
  }, [])

  const getGreeting = () => {
    if (!user) return "Hello!"
    const hour = new Date().getHours()
    if (hour < 12) return `Good Morning, ${user.firstName}`
    if (hour < 18) return `Good Afternoon, ${user.firstName}`
    return `Good Evening, ${user.firstName}`
  }

  const getTimeBasedMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Ready to explore your family connections today?"
    if (hour < 18) return "Continue building your family legacy"
    return "Wind down with some family history exploration"
  }

  const quickStats = [
    { label: "Family Members", value: stats.familyMembers.toString(), icon: Users, color: "from-teal-500 to-teal-600" },
    { label: "Health Records", value: stats.healthRecords.toString(), icon: Heart, color: "from-pink-500 to-pink-600" },
    { label: "Generations", value: stats.generations.toString(), icon: TrendingUp, color: "from-blue-500 to-blue-600" },
    { label: "AI Suggestions", value: stats.aiSuggestions.toString(), icon: Sparkles, color: "from-orange-500 to-orange-600" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />
      <AnimatedNodes />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gray-800/80 backdrop-blur-sm rounded-xl text-gray-400 hover:text-white transition-all duration-200 border border-gray-700/50"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main Content */}
      <main className="lg:pl-80 min-h-screen relative">
        <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8">
          {/* Header Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 pt-16 lg:pt-0"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <TreePine className="h-6 w-6 text-teal-400" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700/50">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {getGreeting()}
              </h1>
              <p className="text-xl text-gray-300">{getTimeBasedMessage()}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/dashboard/treeview">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Family Member
                </Button>
              </Link>
              <Link href="/dashboard/health-overview">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 rounded-xl px-6 py-3 transition-all duration-300"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Report
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
          >
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-4 lg:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 lg:p-3 bg-gradient-to-br ${stat.color} bg-opacity-20 rounded-lg`}>
                    <stat.icon className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs lg:text-sm text-gray-400">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Family Tree Card */}
            <Link href="/dashboard/treeview">
              <div className="group h-full rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:border-teal-500/30 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 group-hover:scale-110 transition-transform duration-300">
                      <TreePine className="h-8 w-8 text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-2xl font-bold text-white">Family Tree</h3>
                        <div className="px-2 py-1 bg-teal-500/20 rounded-full">
                          <span className="text-xs font-medium text-teal-400">Interactive</span>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-6 leading-relaxed">
                        Build and visualize your family connections with our interactive tree view. Add members, explore
                        relationships, and discover your heritage.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-teal-400 font-medium">
                          Explore Tree
                          <ChevronRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{stats.familyMembers} members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-gradient-to-r from-teal-500/20 to-teal-600/20" />
              </div>
            </Link>

            {/* Health Overview Card */}
            <Link href="/dashboard/health-overview">
              <div className="group h-full rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:border-pink-500/30 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 group-hover:scale-110 transition-transform duration-300">
                      <Heart className="h-8 w-8 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-2xl font-bold text-white">Health Overview</h3>
                        <div className="px-2 py-1 bg-pink-500/20 rounded-full">
                          <span className="text-xs font-medium text-pink-400">AI-Powered</span>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-6 leading-relaxed">
                        Track and analyze health patterns across your family tree. Generate reports and discover
                        hereditary insights with AI assistance.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-pink-400 font-medium">
                          View Health Data
                          <ChevronRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Activity className="h-4 w-4" />
                          <span>{stats.healthRecords} records</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-gradient-to-r from-pink-500/20 to-pink-600/20" />
              </div>
            </Link>
          </motion.div>

          {/* Secondary Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* AI Assistant Card */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 group overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">AI Health Assistant</h3>
                    <p className="text-sm text-gray-400">Get intelligent insights about your family's health</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                    <p className="text-sm text-gray-300">"What hereditary conditions should I be aware of?"</p>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl transition-all duration-300"
                    onClick={() => setIsAIChatOpen(true)}
                  >
                    Ask AI Assistant
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  <Link href="/dashboard/health-overview">
                    <button className="w-full p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600/50 text-left transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400 group-hover:text-white" />
                        <span className="text-sm text-gray-300 group-hover:text-white">Generate Health Report</span>
                      </div>
                    </button>
                  </Link>
                  <Link href="/search">
                    <button className="w-full p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600/50 text-left transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-gray-400 group-hover:text-white" />
                        <span className="text-sm text-gray-300 group-hover:text-white">Search Family Members</span>
                      </div>
                    </button>
                  </Link>
                  <Link href="/tools/settings">
                    <button className="w-full p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600/50 text-left transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-gray-400 group-hover:text-white" />
                        <span className="text-sm text-gray-300 group-hover:text-white">Profile Settings</span>
                      </div>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Help & Resources Card */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Help & Resources</h3>
                </div>
                <div className="space-y-4">
                  <Link href="/tools/user-guide">
                    <div className="p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 cursor-pointer border border-gray-700/50 hover:border-gray-600/50 group">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-green-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1 group-hover:text-green-400 transition-colors">
                            User Guide
                          </h4>
                          <p className="text-xs text-gray-400">Learn how to use TreeTrace effectively</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="flex items-start gap-3">
                      <Star className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">Need Help?</h4>
                        <p className="text-xs text-gray-400">Contact support or visit our help center</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Welcome Message for New Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-gradient-to-r from-teal-900/30 to-blue-900/30 backdrop-blur-sm border border-teal-500/20 p-8"
          >
            <div className="flex items-start gap-6">
              <div className="p-4 bg-teal-500/20 rounded-2xl">
                <TreePine className="h-8 w-8 text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Welcome to TreeTrace</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Start building your family tree today! Add your first family member, explore health patterns, and
                  discover your heritage with our AI-powered insights. Your family story begins here.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard/treeview">
                    <Button className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                      <TreePine className="mr-2 h-5 w-5" />
                      Start Building Your Tree
                    </Button>
                  </Link>
                  <Link href="/tools/user-guide">
                    <Button
                      variant="outline"
                      className="border-teal-500/30 text-teal-300 hover:text-white hover:border-teal-500/50 rounded-xl px-6 py-3 transition-all duration-300"
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      View User Guide
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        allFamilyData={allFamilyData}
        title="Family Health Assistant"
      />
      <AIChatToggle onClick={() => setIsAIChatOpen(!isAIChatOpen)} isOpen={isAIChatOpen} />
    </div>
  )
}
