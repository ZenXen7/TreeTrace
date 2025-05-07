"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { dashboardStats } from "@/config/dashboard-stats"
import { quickActions } from "@/config/quick-actions"
import {
  Users,
  Trees,
  GitMerge,
  Activity,
  Plus,
  Search,
  FileUp,
  Settings,
  BarChart3,
  ChevronRight,
  Clock,
  Bell,
  Heart,
  Dna,
  Calendar,
  Sparkles,
  FileSearch,
  UserPlus,
  BookOpen,
  Share2,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Globe,
  Zap,
  Layers,
  Compass,
  MoreHorizontal,
  Download,
  Trash2,
  Edit3,
  Eye,
} from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useAuthStore } from "@/store/useAuthStore"


const recentActivity = [
  {
    icon: UserPlus,
    title: "Added new family member - Sarah Johnson",
    timestamp: "2 hours ago",
    tag: "New Member",
    tagColor: "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/20",
    bgColor: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
  },
  {
    icon: GitMerge,
    title: "Found connection with Smith family tree",
    timestamp: "5 hours ago",
    tag: "Connection",
    tagColor: "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/20",
    bgColor: "bg-gradient-to-br from-purple-500/20 to-indigo-500/20",
  },
  {
    icon: Heart,
    title: "Updated health information for James Wilson",
    timestamp: "1 day ago",
    bgColor: "bg-gradient-to-br from-red-500/20 to-pink-500/20",
  },
  {
    icon: Trees,
    title: "Created new branch - Maternal Grandparents",
    timestamp: "2 days ago",
    bgColor: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
  },
]

const familyTrees = [
  {
    name: "Main Family Tree",
    members: 87,
    lastUpdated: "2 days ago",
    isMain: true,
    completion: 92,
  },
  {
    name: "Maternal Lineage",
    members: 42,
    lastUpdated: "1 week ago",
    isMain: false,
    completion: 68,
  },
  {
    name: "Paternal Ancestors",
    members: 35,
    lastUpdated: "3 weeks ago",
    isMain: false,
    completion: 45,
  },
]

const connections = [
  {
    name: "Smith Family Tree",
    relation: "Potential 3rd cousins",
    confidence: 89,
  },
  {
    name: "Williams Family",
    relation: "Possible great-grandparent connection",
    confidence: 76,
  },
  {
    name: "Johnson Ancestry",
    relation: "Shared ancestor in 1800s",
    confidence: 64,
  },
]

const insights = [
  {
    title: "Most Common Surname",
    description: "Johnson appears 14 times in your family tree",
    icon: <Users className="h-4 w-4 text-blue-400" />,
    bgColor: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
  },
  {
    title: "Longest Living Ancestor",
    description: "Elizabeth Doe lived to 103 years (1901-2004)",
    icon: <Heart className="h-4 w-4 text-red-400" />,
    bgColor: "bg-gradient-to-br from-red-500/20 to-pink-500/20",
  },
  {
    title: "Geographic Distribution",
    description: "Your ancestors lived in 7 different countries",
    icon: <Globe className="h-4 w-4 text-emerald-400" />,
    bgColor: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Missing Information",
    description: "12 people are missing birth dates or locations",
    icon: <FileSearch className="h-4 w-4 text-amber-400" />,
    bgColor: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
  },
]

export default function Dashboard() {
  const { user, fetchUserProfile, isAuthenticated } = useAuthStore((state) => state);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTree, setActiveTree] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated, fetchUserProfile, router]);

  const [animatedNodes, setAnimatedNodes] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile(); // Fetch the user profile if authenticated
    }
  }, [isAuthenticated, fetchUserProfile]);

  // Generate random nodes for the animated background
  useEffect(() => {
    const nodes = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 5
    }));
    setAnimatedNodes(nodes);
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  
  const getGreeting = () => {
    if (!user) return "Hello!";
    const hour = new Date().getHours();
    if (hour < 12) return `Good Morning, ${user.firstName}`;
    if (hour < 18) return `Good Afternoon, ${user.firstName}`;
    return `Good Evening, ${user.firstName}`;
  };

  
  return (
    <div className="min-h-screen bg-black text-white font-sans relative">
     
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {animatedNodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 1, 0],
              opacity: [0, 0.3, 0.3, 0],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              delay: node.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
    
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path 
            d="M20,20 L80,80 M80,20 L20,80 M50,10 L50,90 M10,50 L90,50" 
            stroke="url(#lineGradient)" 
            strokeWidth="0.2" 
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
     
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-white"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <Sidebar sidebarOpen={sidebarOpen} />
     

     
      <main className="lg:pl-80 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-8 space-y-8">
         
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 pt-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {getGreeting()}
                </h1>
                <div className="hidden md:flex items-center gap-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2 py-0.5 rounded-full text-xs">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-emerald-400">Online</span>
                </div>
              </div>
              <p className="text-gray-400 mt-1">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 rounded-xl">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 rounded-xl">
                      <Clock className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Recent Activity</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                New Tree
              </Button>
            </div>
          </motion.div>

          
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card className="bg-gradient-to-r from-gray-900/70 to-gray-800/50 backdrop-blur-sm border-gray-800/50 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -ml-32 -mb-32" />
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-gray-500 hover:text-white"
                    onClick={() => setShowWelcome(false)}
                  >
                    <X size={16} />
                  </Button>
                  
                  <CardContent className="p-6 md:p-8 relative">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="relative h-24 w-24 flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full animate-pulse" />
                        <svg
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-full w-full p-4"
                        >
                          <path
                            d="M50 10v80M30 30L50 10M70 30L50 10M10 50h80M30 30L10 50M30 70L10 50M70 30L90 50M70 70L90 50M30 70L50 90M70 70L50 90"
                            stroke="url(#welcomeGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="welcomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#0ea5e9" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      
                      <div className="space-y-3 text-center md:text-left">
                        <h2 className="text-xl font-bold text-white">Welcome to your TreeTrace Dashboard</h2>
                        <p className="text-gray-400">
                          Your journey to discover and connect your family history begins here. 
                          Start by creating a new tree or importing your existing genealogy data.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                            Quick Tour
                          </Button>
                          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                            Import Data
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

         
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Your Family Tree</h2>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {familyTrees.map((tree, index) => (
                <Card 
                  key={index}
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    activeTree === index 
                      ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-700/30' 
                      : 'bg-gray-900/30 border-gray-800/50 hover:border-gray-700/50'
                  }`}
                  onClick={() => setActiveTree(index)}
                >
                  {activeTree === index && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
                  )}
                  
                  <div className="absolute top-0 right-0 p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                        <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white">
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white">
                          <Share2 className="mr-2 h-4 w-4" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white">
                          <Download className="mr-2 h-4 w-4" /> Export
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        activeTree === index 
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' 
                          : 'bg-gray-800/50'
                      }`}>
                        <Trees className={`h-6 w-6 ${
                          activeTree === index ? 'text-emerald-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium  text-lg text-white">{tree.name}</h3>
                          {tree.isMain && (
                            <Badge className="bg-emerald-900/20 text-emerald-400 border-emerald-500/20 text-[10px]">
                              Main
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{tree.members} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{tree.lastUpdated}</span>
                          </div>
                        </div>
                        
                       
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Completion</span>
                              <span>{tree.completion}%</span>
                            </div>
                            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  activeTree === index 
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                                    : 'bg-gray-600'
                                }`}
                                style={{ width: `${tree.completion}%` }}
                              />
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`ml-2 ${
                              activeTree === index ? 'text-emerald-400' : 'text-gray-500'
                            } hover:text-white`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Public Family Trees Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Public Family Trees</h2>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {publicTrees.map((tree, index) => (
                <Card 
                  key={index}
                  className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] bg-gray-900/30 border-gray-800/50 hover:border-gray-700/50"
                  onClick={() => router.push(`/dashboard/public-trees/${tree.userId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-semibold">{tree.ownerName[0]}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{tree.ownerName}</h3>
                        <p className="text-sm text-gray-400">{tree.memberCount} family members</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{tree.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

         
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardStats.map((stat, index) => (
                <Card 
                  key={stat.title} 
                  className="bg-gray-900/30 backdrop-blur-sm border-gray-800/50 hover:border-gray-700/50 transition-all overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/0 to-gray-800/0 group-hover:from-emerald-950/30 group-hover:to-teal-950/30 transition-all duration-500" />
                  
                  <CardContent className="p-5 relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-medium text-gray-400 mb-1">{stat.title}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          {stat.change && (
                            <span className={`text-xs ${stat.change.includes('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                              {stat.change}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                      </div>
                      
                      <div className={`p-3 rounded-xl ${stat.bgColor} transition-all duration-300 group-hover:scale-110`}>
                        {stat.icon}
                      </div>
                    </div>
                    
                    {stat.chart && (
                      <div className="mt-4 h-10">
                        <svg width="100%" height="100%" viewBox="0 0 100 30">
                          <path
                            d={stat.chart}
                            fill="none"
                            stroke={activeTree === index ? "url(#chartGradient)" : "#4b5563"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#0ea5e9" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

        
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-gray-900/30 backdrop-blur-sm border-gray-800/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/10 to-teal-950/10" />
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-white">Family Visualization</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 border-gray-700 text-gray-300 hover:text-white">
                      <Layers className="mr-2 h-3 w-3" />
                      View Options
                    </Button>
                    <Button size="sm" className="h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                      <Zap className="mr-2 h-3 w-3" />
                      Analyze
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-gray-500">Interactive visualization of the Doe Family Tree</CardDescription>
              </CardHeader>
              
             
              
              <CardFooter className="p-4 border-t border-gray-800/50 flex justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-gray-400">You</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                    <span className="text-xs text-gray-400">Paternal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                    <span className="text-xs text-gray-400">Maternal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-gray-400">Children</span>
                  </div>
                </div>
                
                <Button size="sm" className="h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                  <Edit3 className="mr-2 h-3 w-3" />
                  Edit Tree
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

        
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="bg-gray-900/50 border border-gray-800/50 p-1 mb-4">
                <TabsTrigger value="activity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-white">
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-white">
                  Insights
                </TabsTrigger>
                <TabsTrigger value="connections" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-white">
                  Connections
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity">
                <Card className="bg-gray-900/30 backdrop-blur-sm border-gray-800/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        View All <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription className="text-gray-500">Your latest actions and updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 p-0">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 text-sm p-4 hover:bg-white/5 transition-colors border-t border-gray-800/50 first:border-t-0 group"
                      >
                        <div className={`p-2 rounded-full ${activity.bgColor} group-hover:scale-110 transition-transform`}>
                          <activity.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400">{activity.timestamp}</p>
                            {activity.tag && (
                              <Badge variant="outline" className={`${activity.tagColor} text-xs`}>
                                {activity.tag}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="insights">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gray-900/30 backdrop-blur-sm border-gray-800/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Family Insights</CardTitle>
                      <CardDescription className="text-gray-500">Interesting facts about your family</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {insights.map((insight, index) => (
                        <div key={index} className="space-y-2 group">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${insight.bgColor} group-hover:scale-110 transition-transform`}>
                              {insight.icon}
                            </div>
                            <p className="text-sm font-medium text-white">{insight.title}</p>
                          </div>
                          <p className="text-xs text-gray-400 pl-8">{insight.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900/30 backdrop-blur-sm border-gray-800/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Geographic Distribution</CardTitle>
                      <CardDescription className="text-gray-500">Where your ancestors lived</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="relative h-[220px] w-full bg-gray-950/50 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          <Globe className="h-32 w-32 text-emerald-700" />
                        </div>
                        
                        <div className="absolute bottom-4 left-4">
                          <div className="space-y-2">
                            {[
                              { country: "United States", percentage: 45 },
                              { country: "Ireland", percentage: 25 },
                              { country: "Germany", percentage: 15 },
                              { country: "Italy", percentage: 10 },
                              { country: "Other", percentage: 5 }
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 opacity-80" />
                                <span className="text-xs text-gray-300">{item.country}</span>
                                <div className="h-1 w-20 bg-gray-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">{item.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="connections">
                <Card className="bg-gray-900/30 backdrop-blur-sm border-gray-800/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg text-white">Potential Connections</CardTitle>
                      <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white">
                        <Search className="mr-2 h-3 w-3" />
                        Find More
                      </Button>
                    </div>
                    <CardDescription className="text-gray-500">Possible family connections found</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-0">
                    {connections.map((connection, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 text-sm p-4 hover:bg-white/5 transition-colors border-t border-gray-800/50 first:border-t-0 group"
                      >
                        <div className="p-2 rounded-md bg-gradient-to-br from-purple-500/20 to-indigo-500/20 group-hover:scale-110 transition-transform">
                          <GitMerge className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{connection.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400">{connection.relation}</p>
                            <div className="h-1.5 w-16 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  connection.confidence > 80 
                                    ? 'bg-emerald-500' 
                                    : connection.confidence > 60 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${connection.confidence}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400">{connection.confidence}% match</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

         
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-6 pb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {quickActions.map((action) => (
                <Card 
                  key={action.title}
                  className="bg-gray-900/30 backdrop-blur-sm border-gray-800/50 hover:border-gray-700/50 transition-all group cursor-pointer hover:scale-[1.03]"
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <div className={`p-3 rounded-xl ${action.bgColor} mb-3 group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{action.title}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

