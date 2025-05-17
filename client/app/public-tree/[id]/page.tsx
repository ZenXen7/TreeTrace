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
        
        // Define styling
        const nameStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: -0.01em;" fill="#F3F4F6"';
        const roleStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 400;" fill="#D1D5DB"';
        const detailStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 400;" fill="#9CA3AF"';

        // Define male and female avatars
        const maleAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM2NEY2QiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzFGMkEzNyIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiMxRjJBMzciLz48L3N2Zz4=";
        const femaleAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzgwMzQ2RCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzRBMUY0MCIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiM0QTFGNDAiLz48L3N2Zz4=";

        // Clear any existing tree
        treeElement.innerHTML = "";
        
        // Set up pre-processing function for date formatting
        const formatDate = (dateString: string | undefined): string => {
          if (!dateString) return '';
          
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch (e) {
            console.error("Error formatting date:", e);
            return dateString;
          }
        };
        
        // Format the processed nodes
        const formattedNodes = Array.isArray(currentFamilyTree) 
          ? currentFamilyTree.map(node => ({
              ...node,
              birthDate: formatDate(node.birthDate)
            }))
          : [];
        
        // Updated template definitions to match main tree
        FamilyTree.templates.tommy.field_0 = `<text class="bft-field-0" ${nameStyle} x="25" y="60">{val}</text>` // First name
        FamilyTree.templates.tommy.field_1 = `<text class="bft-field-1" ${nameStyle} x="25" y="85">{val}</text>` // Surname
        FamilyTree.templates.tommy.field_4 = `<text class="bft-field-4" ${detailStyle} x="25" y="110">Birth: {val}</text>` // Birth date
        
        // Clear all other fields that we don't want to display
        FamilyTree.templates.tommy.field_2 = ``;
        FamilyTree.templates.tommy.field_3 = ``;
        FamilyTree.templates.tommy.field_5 = ``;
        FamilyTree.templates.tommy.field_6 = ``;
        FamilyTree.templates.tommy.field_7 = ``;
        FamilyTree.templates.tommy.field_8 = ``;
        FamilyTree.templates.tommy.field_9 = ``;

        // Define node templates similar to main tree
        FamilyTree.templates.tommy.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Neutral accent -->
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#80cbc4"/>
  
  <!-- Simple gender icon at top right -->
  <circle cx="225" cy="30" r="15" fill="#374151" stroke="#4B5563" strokeWidth="1.5"/>
</g>
`;

        FamilyTree.templates.tommy_female.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Female accent -->
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#EC4899"/>
  
  <!-- Female icon at top right -->
  <circle cx="225" cy="30" r="15" fill="#EC4899" stroke="#4B5563" strokeWidth="1.5"/>
  <!-- Female symbol -->
  <path d="M225,22 L225,29 M221,25 L229,25 M225,29 L225,38 M220,34 L230,34" stroke="white" stroke-width="2" fill="none" />
</g>
`;

        FamilyTree.templates.tommy_male.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Male accent -->
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#3B82F6"/>
  
  <!-- Male icon at top right -->
  <circle cx="225" cy="30" r="15" fill="#3B82F6" stroke="#4B5563" strokeWidth="1.5"/>
  <!-- Male symbol -->
  <path d="M220,23 L230,33 M230,23 L230,33 L220,33" stroke="white" stroke-width="2" fill="none" />
</g>
`;

        // Apply the same field styling to male and female templates
        for (let i = 0; i <= 9; i++) {
          FamilyTree.templates.tommy_female[`field_${i}`] = FamilyTree.templates.tommy[`field_${i}`];
          FamilyTree.templates.tommy_male[`field_${i}`] = FamilyTree.templates.tommy[`field_${i}`];
        }
        
        // Add shadow filter
        const svgContent = `
<defs>
  <!-- Filter for card shadow -->
  <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.4" floodColor="#000"/>
  </filter>
</defs>
`;

        // Initialize the FamilyTree with the array of nodes
        familyTreeRef.current = new FamilyTree(treeElement, {
          // Configure with no menus for a cleaner view
          
          nodeBinding: {
            field_0: "name",
            field_1: "surname",
            field_4: "birthDate", 
          },
          mode: "dark",
          template: "tommy",
          nodes: formattedNodes,
          
          // Interactive settings for navigation
          mouseScrool: FamilyTree.action.zoom,
          
          // Add better styling
          levelSeparation: 160,
          siblingSeparation: 90,
          subtreeSeparation: 120,
          padding: 50,
          orientation: FamilyTree.orientation.top,
          layout: FamilyTree.layout.normal,
          anim: { func: FamilyTree.anim.outBack, duration: 300 },
          
          // Enable search but only for name and surname
          enableSearch: true,
          searchFields: ["name", "surname"],
          searchDisplayField: "name",
          searchFieldsWeight: {
            "name": 100,
            "surname": 80
          }
        } as any); // Using type assertion to bypass strict type checking

        // Add event listener for tree initialization
        familyTreeRef.current.on("init", function() {
          console.log("Tree initialized");
          
          // Add the SVG content to the tree
          const svgElement = treeElement.querySelector("svg");
          if (svgElement) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
            const defs = svgDoc.documentElement.querySelector("defs");
            if (defs) {
              svgElement.appendChild(defs);
            }
          }
        });

        // Add event listener for node click - just show a simple view (no editing)
        familyTreeRef.current.on("click", function(sender: any, args: any) {
          // Show details of member but don't allow editing
          const node = args.node;
          if (node) {
            console.log("Node clicked:", node);
            
            // Birth date should already be formatted, but in case it isn't:
            const birthInfo = node.birthDate ? `Born: ${node.birthDate}` : '';
            
            // We could use toast to show the info, or could implement a custom view
            if (node.name) {
              toast.success(`${node.name} ${node.surname || ''} ${birthInfo ? '• ' + birthInfo : ''}`, {
                duration: 3000,
                style: {
                  background: '#1F2937',
                  color: '#F3F4F6',
                  border: '1px solid #374151'
                }
              });
            }
          }
          
          // Prevent default to avoid any built-in edit
          return false;
        });
        
        // Add default avatars based on gender
        familyTreeRef.current.on('render', (sender: any) => {
          // Update node appearance based on gender
          const nodes = sender.nodes || [];
          for (const nodeId in nodes) {
            const node = nodes[nodeId];
            if (node && node.data) {
              // Apply gender-specific template
              if (node.data.gender === 'female') {
                node.templateName = 'tommy_female';
              } else if (node.data.gender === 'male') {
                node.templateName = 'tommy_male';
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
            Explore this shared family tree - you can navigate, search, and view details
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
            </div>
          </div>

          <div className="p-2">
            <div ref={treeContainerRef} className="w-full h-[1100px]"></div>
          </div>
        </motion.div>

        {!loading && !error && currentFamilyTree && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Family Members
              </h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-semibold text-white">
                  {Array.isArray(currentFamilyTree) ? currentFamilyTree.length : 0}
                </p>
                <span className="text-sm text-teal-400">Total</span>
              </div>
            </div>
            
            <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Tree Owner
              </h3>
              <div className="flex items-center gap-3">
                {userData && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 text-white flex items-center justify-center text-sm font-medium">
                      {userData.firstName[0]}{userData.lastName[0]}
                    </div>
                    <p className="text-xl font-semibold text-white truncate">
                      {userData.firstName} {userData.lastName}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Viewing Mode
              </h3>
              <div className="flex items-end justify-between">
                <p className="text-xl font-semibold text-white">
                  Interactive View
                </p>
                <span className="text-sm text-teal-400">Public Access</span>
              </div>
            </div>
          </motion.div>
        )}

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center rounded-xl bg-gray-800/50 p-8 backdrop-blur-sm border border-gray-700/50"
        >
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-300 text-lg mb-2">
              You can navigate, zoom, and explore this family tree interactively.
            </p>
            <p className="text-sm text-teal-400">
              Click on a family member to view their basic details.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 