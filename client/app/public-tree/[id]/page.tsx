"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trees, Users, Clock, Eye, ArrowLeft, UserX, ChevronLeft, TreePine, Heart, BarChart3, Sparkles, Info, Filter, Settings, Edit, Navigation, Search, User, Calendar, Flag, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import useTreeStore from "@/store/useTreeStore"
import { toast } from "react-hot-toast"
import useUserSearchStore from "@/store/useUserSearchStore"
import FamilyTree from "@balkangraph/familytree.js"
import AnimatedNodes from "@/components/animated-nodes"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function PublicTreeView() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<{firstName: string, lastName: string} | null>(null)
  const { getPublicFamilyTree, currentFamilyTree } = useTreeStore()
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const familyTreeRef = useRef<any>(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    generations: 0,
    oldestMember: null as any,
    youngestMember: null as any,
  })
  const [showModal, setShowModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)

  useEffect(() => {
    // Function to fetch user details
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/${id}`, {
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

  // Calculate stats when currentFamilyTree changes
  useEffect(() => {
    if (!currentFamilyTree || !Array.isArray(currentFamilyTree)) return;
    const processedData = currentFamilyTree;
    // Find the maximum generation depth
    const findGenerationDepth = (memberId: string, depth = 1, visited = new Set<string>()): number => {
      if (visited.has(memberId)) return depth
      visited.add(memberId)
      const member = processedData.find((m: any) => m.id === memberId || m._id === memberId)
      if (!member) return depth
      const children = processedData.filter((m: any) => m.fid === memberId || m.mid === memberId)
      if (children.length === 0) return depth
      return Math.max(...children.map((child) => findGenerationDepth(child.id || child._id, depth + 1, new Set(visited))))
    }
    // Find root members (those without parents)
    const rootMembers = processedData.filter((m: any) => !m.fid && !m.mid)
    const maxGeneration = rootMembers.length > 0 ? Math.max(...rootMembers.map((m: any) => findGenerationDepth(m.id || m._id))) : 1
    setStats({
      totalMembers: processedData.length,
      generations: maxGeneration,
      oldestMember: processedData.reduce((oldest: any, current: any) => {
        if (!oldest || (oldest.birthDate && current.birthDate && new Date(current.birthDate) < new Date(oldest.birthDate))) {
          return current
        }
        return oldest
      }, null),
      youngestMember: processedData.reduce((youngest: any, current: any) => {
        if (!youngest || (youngest.birthDate && current.birthDate && new Date(current.birthDate) > new Date(youngest.birthDate))) {
          return current
        }
        return youngest
      }, null),
    })
  }, [currentFamilyTree])

  useEffect(() => {
    if (!loading && !error && currentFamilyTree && treeContainerRef.current) {
      try {
        // Initialize the family tree
        const treeElement = treeContainerRef.current;
        
        // Define styling
        const nameStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: -0.01em;" fill="#F3F4F6"';
        const roleStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 400;" fill="#D1D5DB"';
        const detailStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 400;" fill="#9CA3AF"';

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
        
        // Updated template definitions
        FamilyTree.templates.tommy.field_0 = `<text class="bft-field-0" ${nameStyle} x="25" y="60">{val}</text>`
        FamilyTree.templates.tommy.field_1 = `<text class="bft-field-1" ${nameStyle} x="25" y="85">{val}</text>`
        FamilyTree.templates.tommy.field_4 = `<text class="bft-field-4" ${detailStyle} x="25" y="110">Birth: {val}</text>`
        
        // Clear all other fields
        FamilyTree.templates.tommy.field_2 = ``;
        FamilyTree.templates.tommy.field_3 = ``;
        FamilyTree.templates.tommy.field_5 = ``;
        FamilyTree.templates.tommy.field_6 = ``;
        FamilyTree.templates.tommy.field_7 = ``;
        FamilyTree.templates.tommy.field_8 = ``;
        FamilyTree.templates.tommy.field_9 = ``;

        // Define node templates
        FamilyTree.templates.tommy.node = `
<g filter="url(#card-shadow)">
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#80cbc4"/>
  <circle cx="225" cy="30" r="15" fill="#374151" stroke="#4B5563" strokeWidth="1.5"/>
</g>
`;

        FamilyTree.templates.tommy_female.node = `
<g filter="url(#card-shadow)">
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#EC4899"/>
  <circle cx="225" cy="30" r="15" fill="#EC4899" stroke="#4B5563" strokeWidth="1.5"/>
  <image href="https://cdn-icons-png.flaticon.com/128/1019/1019071.png" x="210" y="15" height="30" width="30" preserveAspectRatio="xMidYMid meet"/>
</g>
`;

        FamilyTree.templates.tommy_male.node = `
<g filter="url(#card-shadow)">
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#3B82F6"/>
  <circle cx="225" cy="30" r="15" fill="#3B82F6" stroke="#4B5563" strokeWidth="1.5"/>
  <image href="https://cdn-icons-png.flaticon.com/128/1019/1019070.png" x="212" y="17" height="26" width="26" preserveAspectRatio="xMidYMid meet"/>
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
  <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.4" floodColor="#000"/>
  </filter>
</defs>
`;

        // Initialize the FamilyTree
        familyTreeRef.current = new FamilyTree(treeElement, {
          nodeBinding: {
            field_0: "name",
            field_1: "surname",
            field_4: "birthDate", 
          },
          mode: "dark",
          template: "tommy",
          nodes: formattedNodes,
          mouseScrool: FamilyTree.action.zoom,
          levelSeparation: 160,
          siblingSeparation: 90,
          subtreeSeparation: 120,
          padding: 50,
          orientation: FamilyTree.orientation.top,
          layout: FamilyTree.layout.normal,
          anim: { func: FamilyTree.anim.outBack, duration: 300 },
          enableSearch: true,
          searchFields: ["name", "surname"],
          searchDisplayField: "name",
          searchFieldsWeight: {
            "name": 100,
            "surname": 80
          }
        } as any);

        // Add event listener for tree initialization
        familyTreeRef.current.on("init", function() {
          
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

        // Add event listener for node click
        familyTreeRef.current.on("click", function(sender: any, args: any) {
          const node = args.node;
          if (node) {
            const member = Array.isArray(currentFamilyTree)
              ? currentFamilyTree.find(
                  (m: any) => m.id === node.id || m._id === node.id
                )
              : null;
            setSelectedMember(member || node);
            setShowModal(true);
          }
          return false;
        });
        
        // Add default avatars based on gender
        familyTreeRef.current.on('render', (sender: any) => {
          const nodes = sender.nodes || [];
          for (const nodeId in nodes) {
            const node = nodes[nodeId];
            if (node && node.data) {
              if (node.data.gender === 'female') {
                node.templateName = 'tommy_female';
              } else if (node.data.gender === 'male') {
                node.templateName = 'tommy_male';
              }
            }
          }
        });
      } catch (err) {
        setError("Failed to render family tree")
      }
    }
    
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

      <div className="container mx-auto px-4 py-8 relative max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-3 text-gray-400 hover:text-teal-400 transition-all duration-200 cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-teal-900/30 transition-colors">
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </div>
              <span className="font-medium">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <TreePine className="h-4 w-4 text-teal-400" />
                <span className="text-sm text-gray-300">Public Family Tree</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              {userData ? `${userData.firstName} ${userData.lastName}'s Family Tree` : "Public Family Tree"}
            </h1>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg">
              Explore this shared family tree - you can navigate, search, and view details
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {!loading && !error && currentFamilyTree && Array.isArray(currentFamilyTree) && currentFamilyTree.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-teal-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-teal-400" />
                </div>
                <span className="text-xs text-teal-400 font-medium px-2 py-1 bg-teal-500/10 rounded-full">Total</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Family Members</h3>
              <p className="text-3xl font-bold text-white">{stats.totalMembers}</p>
            </div>
            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-xs text-blue-400 font-medium px-2 py-1 bg-blue-500/10 rounded-full">Depth</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Generations</h3>
              <p className="text-3xl font-bold text-white">{stats.generations}</p>
            </div>
            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Heart className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-xs text-purple-400 font-medium px-2 py-1 bg-purple-500/10 rounded-full">Elder</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Oldest Member</h3>
              <div>
                <p className="text-xl font-bold text-white truncate">{stats.oldestMember?.name || "N/A"}</p>
                <p className="text-sm text-gray-500">{stats.oldestMember?.birthDate ? new Date(stats.oldestMember.birthDate).toISOString().slice(0, 10) : "Unknown"}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Tree Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 overflow-hidden mb-8 shadow-2xl"
        >
          <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <TreePine className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Interactive Family Tree</h2>
                <p className="text-sm text-gray-400">Explore relationships and discover connections</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div ref={treeContainerRef} className="w-full h-[1100px] rounded-lg overflow-hidden"></div>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="group rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-teal-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-teal-500/20 rounded-lg group-hover:bg-teal-500/30 transition-colors">
                <Navigation className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Navigation Tips</h3>
            </div>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Click and drag to pan around the tree</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use mouse wheel to zoom in and out</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use the search bar to find specific family members</span>
              </li>
            </ul>
          </div>

          <div className="group rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-yellow-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                <Eye className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">View Only Mode</h3>
            </div>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>This is a public, read-only family tree</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>You can view but not edit family members</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Some information may be private or hidden by the owner</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Member Details Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-gray-900 border border-gray-700/50 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-teal-400" />
                Member Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedMember && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="font-medium">{selectedMember.name || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Surname</p>
                    <p className="font-medium">{selectedMember.surname || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Birth Date</p>
                    <p className="font-medium">{selectedMember.birthDate ? new Date(selectedMember.birthDate).toISOString().slice(0, 10) : 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Gender</p>
                    <p className="font-medium capitalize">{selectedMember.gender || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Death Date</p>
                    <p className="font-medium">{selectedMember.deathDate ? new Date(selectedMember.deathDate).toISOString().slice(0, 10) : 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="font-medium capitalize">{selectedMember.status || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Occupation</p>
                    <p className="font-medium">{selectedMember.occupation || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Country</p>
                    <p className="font-medium">{selectedMember.country || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
} 