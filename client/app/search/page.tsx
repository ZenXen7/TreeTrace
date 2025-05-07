"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Users, Loader2, AlertCircle, Trees } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import useUserSearchStore from "@/store/useUserSearchStore"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"

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
      className="min-h-screen bg-gray-900 text-gray-100"
    >
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-gray-100 mb-3">Search Users</h1>
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
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-100">
                <Search className="mr-2 h-5 w-5" />
                <span>Find Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
                {isLoading && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600 transition-colors hover:bg-gray-650"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3 bg-blue-600 text-white">
                          <AvatarFallback>
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 bg-gray-600 hover:bg-gray-500"
                        onClick={() => handleViewTreeClick(user)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        View Tree
                      </Button>
                    </div>
                  ))
                ) : searchQuery && !isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No users found matching &quot;{searchQuery}&quot;</p>
                  </div>
                ) : !searchQuery ? (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Type a name to search for users</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trees className="h-5 w-5 text-emerald-400" />
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
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="bg-gray-700 hover:bg-gray-600"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
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