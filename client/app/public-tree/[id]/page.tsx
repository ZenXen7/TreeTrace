"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trees, Users, Clock, Eye, ArrowLeft, UserX, ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import useTreeStore from "@/store/useTreeStore"
import { toast } from "react-hot-toast"
import useUserSearchStore from "@/store/useUserSearchStore"
import FamilyTree from "@balkangraph/familytree.js"
import AnimatedNodes from "@/components/animated-nodes"

export default function PublicTreeView() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<{firstName: string, lastName: string} | null>(null)
  const { getPublicFamilyTree, currentFamilyTree, familyMembers } = useTreeStore()
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const familyTreeRef = useRef<any>(null)

  useEffect(() => {
    // Function to fetch user details
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3001/users/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData({
            firstName: data.firstName || data.data?.firstName || '',
            lastName: data.lastName || data.data?.lastName || ''
          });
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    const fetchPublicTree = async () => {
      try {
        setLoading(true)
        await fetchUserDetails();
        await getPublicFamilyTree(id as string)
      } catch (err) {
        setError("Failed to load public family tree")
        toast.error("Failed to load public family tree")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPublicTree()
    }
  }, [id, getPublicFamilyTree])

  useEffect(() => {
    if (!loading && !error && currentFamilyTree && treeContainerRef.current) {
      console.log("Rendering family tree with data:", currentFamilyTree);
      try {
        // Initialize the family tree
        const treeElement = treeContainerRef.current;
        
        // Define male and female avatars
        const maleAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM2NEY2QiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzFGMkEzNyIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiMxRjJBMzciLz48L3N2Zz4=";
        const femaleAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzgwMzQ2RCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzRBMUY0MCIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiM0QTFGNDAiLz48L3N2Zz4=";

        // Clear any existing tree
        treeElement.innerHTML = "";
        
        // Initialize the FamilyTree with the array of nodes
        familyTreeRef.current = new FamilyTree(treeElement, {
          // Configure with read-only settings
          nodeMenu: {
            edit: { text: "View", icon: Eye },
            details: null,
            add: null,
            remove: null,
          } as any,
          nodeBinding: {
            field_0: "name",
            field_1: "surname",
            field_2: "gender",
            field_3: "status", 
            field_4: "birthDate",
            field_5: "deathDate",
            field_6: "country",
            field_7: "occupation",
            img_0: "imageUrl"
          },
          enableDragDrop: false,
          enableTouch: true,
          enablePan: true,
          enableZoom: true,
          scaleInitial: FamilyTree.match.boundary,
          template: "tommy",
          nodes: Array.isArray(currentFamilyTree) ? currentFamilyTree : [],
          // Add better styling
          levelSeparation: 100,
          siblingSeparation: 60,
          subtreeSeparation: 80,
          padding: 20,
          orientation: FamilyTree.orientation.top,
          layout: FamilyTree.layout.normal,
          anim: { func: FamilyTree.anim.outBack, duration: 200 },
          connectors: {
            type: "straight",
            style: {
              "stroke-width": "1",
              stroke: "#4B5563",
            },
          }
        });
        
        // Add default avatars based on gender
        familyTreeRef.current.on('render', (sender: any, args: any) => {
          if (!args.nodes || !Array.isArray(args.nodes)) return;
          
          for (let i = 0; i < args.nodes.length; i++) {
            const node = args.nodes[i];
            if (node && node.data && !node.data.imageUrl) {
              if (node.data.gender === 'male') {
                node.data.imageUrl = maleAvatar;
              } else if (node.data.gender === 'female') {
                node.data.imageUrl = femaleAvatar;
              }
            }
          }
        });
      } catch (err) {
        console.error("Error rendering family tree:", err);
        setError("Failed to render family tree")
      }
    }
    
    // Cleanup function
    return () => {
      if (familyTreeRef.current) {
        familyTreeRef.current = null;
      }
    };
  }, [loading, error, currentFamilyTree]);

  const handleGoBack = () => {
    router.back();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-sans relative flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />
        
        {/* Animated Background */}
        <AnimatedNodes />

        <div className="relative text-center">
          <div className="h-12 w-12 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading family tree...</p>
        </div>
      </div>
    )
  }

  if (error || !currentFamilyTree) {
    return (
      <div className="min-h-screen bg-black text-white font-sans relative flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />
        
        {/* Animated Background */}
        <AnimatedNodes />

        <div className="relative text-center max-w-md p-8 bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-xl">
          <UserX className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2 text-white">No Family Tree Available</h3>
          <p className="text-gray-400 mb-6">
            {userData ? (
              <>
                {userData.firstName} {userData.lastName} hasn't created a family tree yet.
              </>
            ) : (
              "This user hasn't created a family tree yet."
            )}
          </p>
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white"
            onClick={handleGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    )
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
            onClick={handleGoBack}
            className="flex items-center text-gray-400 hover:text-teal-400 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="ml-1">Back to Search</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-semibold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent mb-3">
            {userData ? (
              <>{userData.firstName} {userData.lastName}'s Family Tree</>
            ) : (
              "Public Family Tree"
            )}
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Viewing a shared family tree in read-only mode
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/30 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800/50 overflow-hidden mb-8"
        >
          <div className="bg-gray-800/50 p-6 border-b border-gray-800/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {userData && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 text-white flex items-center justify-center text-sm font-medium">
                    {userData.firstName[0]}{userData.lastName[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-white">Family Tree View</h2>
                  <p className="text-sm text-gray-400">Interactive visualization of family relationships</p>
                </div>
              </div>
              <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Read Only
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <div ref={treeContainerRef} className="w-full h-[700px]"></div>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
            <div className="text-teal-400 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Navigation Tips
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Click and drag to pan around the tree</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Use mouse wheel to zoom in and out</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Double-click a member to center the view</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
            <div className="text-teal-400 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Viewing Options
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Hover over members to see details</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Click on a member to view their profile</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Use the search to find specific members</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
            <div className="text-teal-400 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">
              About This Tree
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>This is a public view of the family tree</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Some information may be private</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Contact the owner for more details</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 