"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trees, Users, Clock, Eye, ArrowLeft, UserX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import useTreeStore from "@/store/useTreeStore"
import { toast } from "react-hot-toast"
import useUserSearchStore from "@/store/useUserSearchStore"
import FamilyTree from "@balkangraph/familytree.js"

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
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading family tree...</p>
        </div>
      </div>
    )
  }

  if (error || !currentFamilyTree) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
          <UserX className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Family Tree Available</h3>
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
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4" />
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
      className="min-h-screen bg-gray-900 text-gray-100"
    >
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          size="sm"
          className="mb-6 text-gray-400 hover:text-white"
          onClick={handleGoBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-gray-100 mb-3">
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
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-8"
        >
          <div className="bg-gray-700 p-4 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {userData && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mr-3 text-sm font-medium">
                    {userData.firstName[0]}{userData.lastName[0]}
                  </div>
                )}
                <h2 className="text-xl font-semibold text-white">Family Tree View</h2>
              </div>
              <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                Read Only
              </Badge>
            </div>
          </div>

          <div className="p-4">
            <div ref={treeContainerRef} className="w-full h-[700px]"></div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 