"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Users, Loader2, AlertCircle, Trees, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import useUserSearchStore from "@/store/useUserSearchStore"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import AnimatedNodes from "@/components/animated-nodes"

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<{ _id: string; firstName: string; lastName: string } | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const { searchUsers, searchResults, isLoading, clearSearchResults } = useUserSearchStore()

  // Handle input debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      searchUsers(debouncedQuery)
    } else {
      clearSearchResults()
    }
  }, [debouncedQuery, searchUsers, clearSearchResults])

  const handleViewTreeClick = (user: { _id: string; firstName: string; lastName: string }) => {
    setSelectedUser(user)
    setShowDialog(true)
  }
  
  const handleConfirmViewTree = () => {
    if (selectedUser) {
      router.push(`/public-tree/${selectedUser._id}`)
    }
    setShowDialog(false)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white font-sans relative"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />
      
      {/* Animated Background */}
      <AnimatedNodes />

      <div className="container mx-auto px-6 py-8 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-12"
        >
          <button
            onClick={() => router.push("/dashboard/main")}
            className="flex items-center text-gray-400 hover:text-teal-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="ml-1">Back to Dashboard</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-semibold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent mb-3">
            Search Users
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Find other members and explore their public family trees
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-800/50">
            <div className="p-6 border-b border-gray-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-5 w-5 text-teal-400" />
                <h2 className="text-xl font-semibold text-white">Find Users</h2>
              </div>
              <p className="text-sm text-gray-400">Search for users by their name</p>
            </div>

            <div className="p-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-400 focus:border-teal-500 focus:ring-teal-500/20"
                />
                {isLoading && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 transition-all hover:bg-gray-800/70 hover:border-gray-600/50 group"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3 bg-gradient-to-br from-teal-500 to-blue-500 text-white">
                          <AvatarFallback>
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white group-hover:text-teal-400 transition-colors">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/20 transition-colors"
                        onClick={() => handleViewTreeClick(user)}
                      >
                        <Users className="h-4 w-4 mr-1.5" />
                        View Tree
                      </Button>
                    </div>
                  ))
                ) : searchQuery && !isLoading ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No users found matching &quot;{searchQuery}&quot;</p>
                  </div>
                ) : !searchQuery ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Type a name to search for users</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-gray-900/95 backdrop-blur-sm text-white border-gray-800/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Trees className="h-5 w-5 text-teal-400" />
              View Family Tree
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedUser ? (
                <>You are about to view {selectedUser.firstName} {selectedUser.lastName}&apos;s family tree.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-gray-300 space-y-2 py-4">
            <p className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>If this user hasn&apos;t created a family tree or has set their tree to private, you may not see any data.</span>
            </p>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white"
              onClick={handleConfirmViewTree}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
} 