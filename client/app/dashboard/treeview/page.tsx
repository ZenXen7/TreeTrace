"use client"

import { useEffect, useState } from "react"
import FamilyTree from "@balkangraph/familytree.js"
import { motion } from "framer-motion"
import { handleAddMember, updateFamilyMember, deleteFamilyMember } from "./service/familyService"

function Familytree(props: {
  nodeBinding: any
  nodes: any
  fetchData: () => Promise<void>
}) {
  useEffect(() => {
    const treeElement = document.getElementById("tree")
    if (treeElement) {
      // Define custom SVG templates for nodes
      const svgContent = `
<defs>
  <!-- Filter for card shadow -->
  <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.4" floodColor="#000"/>
  </filter>
  
  <!-- Avatar circle clip path -->
  <clipPath id="avatar-clip">
    <circle cx="45" cy="50" r="32"/>
  </clipPath>
</defs>
`

      // Add the SVG content to the tree
      const svgElement = treeElement.querySelector("svg")
      if (svgElement) {
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgContent, "image/svg+xml")
        const defs = svgDoc.documentElement.querySelector("defs")
        if (defs) {
          svgElement.appendChild(defs)
        }
      }

      // Default avatar images based on gender
      const maleAvatar =
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM2NEY2QiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzFGMkEzNyIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiMxRjJBMzciLz48L3N2Zz4="
      const femaleAvatar =
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzgwMzQ2RCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzRBMUY0MCIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiM0QTFGNDAiLz48L3N2Zz4="

      // Update the text styling and positioning for the larger cards
      const nameStyle =
        'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: -0.01em;" fill="#F3F4F6"'
      const roleStyle =
        'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 400;" fill="#D1D5DB"'
      const detailStyle =
        'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 400;" fill="#9CA3AF"'

      // Position text elements for the larger card
      FamilyTree.templates.tommy.field_0 = `<text class="bft-field-0" ${nameStyle} x="95" y="35">{val}</text>`
      FamilyTree.templates.tommy.field_1 = `<text class="bft-field-1" ${roleStyle} x="95" y="55">{val}</text>`
      FamilyTree.templates.tommy.field_2 = `<text class="bft-field-2" ${detailStyle} x="95" y="72">{val}</text>`
      FamilyTree.templates.tommy.field_5 = `<text class="bft-field-5" ${detailStyle} x="95" y="87">🌍 {val}</text>`
      FamilyTree.templates.tommy.field_6 = `<text class="bft-field-6" ${detailStyle} x="190" y="87">💼 {val}</text>`
      FamilyTree.templates.tommy.field_3 = `<text class="bft-field-3" ${detailStyle} x="95" y="105">Born: {val}</text>`
      FamilyTree.templates.tommy.field_4 = `<text class="bft-field-4" ${detailStyle} x="190" y="105">Died: {val}</text>`
      FamilyTree.templates.tommy.field_7 = `<text class="bft-field-7" ${detailStyle} x="270" y="120" text-anchor="end" transform="rotate(-45,270,120)">{val}</text>`

      // Make the node bigger to accommodate more fields
      FamilyTree.templates.tommy.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="130" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#6366F1"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlinkHref="${maleAvatar}" x="13" y="18" height="64" width="64" clipPath="url(#avatar-clip)"/>
</g>
`

      FamilyTree.templates.tommy_female.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="130" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card with female color -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#EC4899"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlinkHref="${femaleAvatar}" x="13" y="18" height="64" width="64" clipPath="url(#avatar-clip)"/>
</g>
`

      FamilyTree.templates.tommy_male.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="130" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card with male color -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#3B82F6"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlinkHref="${maleAvatar}" x="13" y="18" height="64" width="64" clipPath="url(#avatar-clip)"/>
</g>
`

      // Apply the same styling to male and female templates
      FamilyTree.templates.tommy_female.field_0 = FamilyTree.templates.tommy.field_0
      FamilyTree.templates.tommy_female.field_1 = FamilyTree.templates.tommy.field_1
      FamilyTree.templates.tommy_female.field_2 = FamilyTree.templates.tommy.field_2
      FamilyTree.templates.tommy_female.field_3 = FamilyTree.templates.tommy.field_3
      FamilyTree.templates.tommy_female.field_4 = FamilyTree.templates.tommy.field_4
      FamilyTree.templates.tommy_female.field_5 = FamilyTree.templates.tommy.field_5
      FamilyTree.templates.tommy_female.field_6 = FamilyTree.templates.tommy.field_6
      FamilyTree.templates.tommy_female.field_7 = FamilyTree.templates.tommy.field_7

      FamilyTree.templates.tommy_male.field_0 = FamilyTree.templates.tommy.field_0
      FamilyTree.templates.tommy_male.field_1 = FamilyTree.templates.tommy.field_1
      FamilyTree.templates.tommy_male.field_2 = FamilyTree.templates.tommy.field_2
      FamilyTree.templates.tommy_male.field_3 = FamilyTree.templates.tommy.field_3
      FamilyTree.templates.tommy_male.field_4 = FamilyTree.templates.tommy.field_4
      FamilyTree.templates.tommy_male.field_5 = FamilyTree.templates.tommy.field_5
      FamilyTree.templates.tommy_male.field_6 = FamilyTree.templates.tommy.field_6
      FamilyTree.templates.tommy_male.field_7 = FamilyTree.templates.tommy.field_7

      // Update the node menu button position for the larger card
      FamilyTree.templates.tommy.nodeCircleMenuButton =
        FamilyTree.templates.tommy_female.nodeCircleMenuButton =
        FamilyTree.templates.tommy_male.nodeCircleMenuButton =
          {
            radius: 20,
            x: 260,
            y: 100,
            color: "#1F2937",
            stroke: "#4B5563",
            strokeWidth: 1,
          }

      // Update the family tree configuration to match the new node size and dark mode
      const family = new FamilyTree(treeElement, {
        nodeTreeMenu: true,
        mode: "dark", // Change to dark mode
        nodeBinding: props.nodeBinding,
        nodes: props.nodes,
        nodeCircleMenu: {
          PDFProfile: {
            icon: FamilyTree.icon.pdf(22, 22, "#D1D5DB"),
            text: "PDF Profile",
            color: "#1F2937",
          },
          editNode: {
            icon: FamilyTree.icon.edit(22, 22, "#D1D5DB"),
            text: "Edit Member",
            color: "#1F2937",
          },
          addClink: {
            icon: FamilyTree.icon.link(22, 22, "#D1D5DB"),
            text: "Add Connection",
            color: "#1F2937",
            draggable: true,
          },
          deleteNode: {
            icon: FamilyTree.icon.remove(22, 22, "#ef4444"),
            text: "Delete Member",
            color: "#1F2937",
          },
        },
        // Fix the editForm configuration to use standard form elements
        editForm: {
          readOnly: false,
          titleBinding: "name",
          generateElementsFromFields: false,
          elements: [
            { type: 'textbox', label: 'Full Name', binding: 'name'},
            { type: 'select', options: [
                {value: 'alive', text: 'Alive'},
                {value: 'deceased', text: 'Deceased'},
                {value: 'unknown', text: 'Unknown'}
              ], 
              label: 'Status', binding: 'status' },
              [
                { type: 'date', label: 'Birth Date', binding: 'birthDate' },
                { type: 'date', label: 'Death Date', binding: 'deathDate' },
              ],
            
            { type: 'select', options: [
                {value: 'us', text: 'United States'},
                {value: 'ph', text: 'Philippines'},
                {value: 'ca', text: 'Canada'},
                {value: 'uk', text: 'United Kingdom'},
                {value: 'au', text: 'Australia'},
                {value: 'jp', text: 'Japan'},
                {value: 'sg', text: 'Singapore'},
                {value: 'hk', text: 'Hong Kong'}
              ], 
              label: 'Country', binding: 'country' },
           
            { type: 'textbox', label: 'Occupation', binding: 'occupation' },
            
            // Hidden field for gender to prevent editing but still keep it in the form data
            // { type: 'hidden', binding: 'gender' }
          ]
        },
        // Improved tree layout and spacing for the new node size
        levelSeparation: 100,
        siblingSeparation: 60,
        subtreeSeparation: 80,
        padding: 20,
        orientation: FamilyTree.orientation.top,
        layout: FamilyTree.mixed,
        scaleInitial: FamilyTree.match.boundary,
        enableSearch: true,
        enableDragDrop: true,
        enablePan: true,
        enableZoom: true,
        // Add smooth animations
        anim: { func: FamilyTree.anim.outBack, duration: 200 },
        // Change the connector lines to match the dark theme
        connectors: {
          type: "straight",
          style: {
            "stroke-width": "1",
            stroke: "#4B5563",
          },
        },
      })

      family.editUI.on("save", (sender, editedData) => {
        ;(async () => {
          try {
            const token = localStorage.getItem("token")
            if (!token) throw new Error("No authentication token found")

            const rawData = editedData.data || editedData
            const resolvedId = rawData.id || rawData._id || rawData._state?.id || rawData._state?._id

            if (!resolvedId) {
              throw new Error("No valid ID found in edited data")
            }

      
            let birthDate = rawData.birthDate ? new Date(rawData.birthDate) : null
            let deathDate = rawData.deathDate ? new Date(rawData.deathDate) : null
            
            console.log("Edit form raw data:", rawData);
            console.log("Country value:", rawData.country);
            console.log("Occupation value:", rawData.occupation);
            
            const updatedData = {
              name: rawData.name,
              gender: rawData.gender,
              status: rawData.status,
              birthDate: birthDate,
              deathDate: deathDate,
              country: rawData.country,
              occupation: rawData.occupation,
              tags: rawData.tags
            }
            
            console.log("Data being sent to API:", updatedData);

            await updateFamilyMember(token, resolvedId, updatedData)
            await props.fetchData()
          } catch (error) {
            console.error("Error saving updated member:", error)
          }
        })()

        return true
      })
      
      // Using the default edit form provided by FamilyTree.js
      // Custom form field configurations were causing errors
      // Form fields will be based on the data properties of the nodes

      // Update the node binding to include the new fields
      const nodeBinding = props.nodeBinding

      const canDeleteMember = (node: any) => {
        const hasPartner = node.pids && node.pids.length > 0
        const hasChildren = props.nodes.some((member: any) => member.fid === node.id || member.mid === node.id)
        const hasParents = node.fid || node.mid

        // Case 1: Child without spouse/children
        if (hasParents && !hasPartner && !hasChildren) return true

        // Case 2: Root couple with descendants
        if (hasChildren && hasPartner && !hasParents) return true

        // Case 3: Root single parent with descendants
        if (hasChildren && !hasPartner && !hasParents) return true

        // Case 4: Root couple without children
        if (!hasChildren && hasPartner && !hasParents) return true

        return false
      }

      family.nodeCircleMenuUI.on("show", (sender, args) => {
        var node = family.getNode(args.nodeId)
        delete args.menu.father
        delete args.menu.mother
        delete args.menu.wife
        delete args.menu.husband

        // Add parent options
        if (FamilyTree.isNEU(node.mid)) {
          args.menu.mother = {
            icon: FamilyTree.icon.mother(24, 24, "#ec4899"),
            text: "Add mother",
            color: "#1F2937",
          }
        }

        if (FamilyTree.isNEU(node.fid)) {
          args.menu.father = {
            icon: FamilyTree.icon.father(24, 24, "#3b82f6"),
            text: "Add father",
            color: "#1F2937",
          }
        }

        // Check if node has a partner
        const hasPartner = node.pids && node.pids.length > 0
        const partner = hasPartner ? family.getNode(node.pids[0]) : null

        // Add children options
        if (hasPartner) {
          args.menu.addSon = {
            icon: FamilyTree.icon.son(24, 24, "#3b82f6"),
            text: `Add Son with partner`,
            color: "#1F2937",
          }
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(24, 24, "#ec4899"),
            text: `Add Daughter with partner`,
            color: "#1F2937",
          }
        } else {
          args.menu.addSon = {
            icon: FamilyTree.icon.son(24, 24, "#3b82f6"),
            text: "Add Son",
            color: "#1F2937",
          }
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(24, 24, "#ec4899"),
            text: "Add Daughter",
            color: "#1F2937",
          }
        }

        // Add partner option if no partner exists
        if (!hasPartner) {
          if (node.gender === "male") {
            args.menu.wife = {
              icon: FamilyTree.icon.wife(24, 24, "#ec4899"),
              text: "Add wife",
              color: "#1F2937",
            }
          } else if (node.gender === "female") {
            args.menu.husband = {
              icon: FamilyTree.icon.husband(24, 24, "#3b82f6"),
              text: "Add husband",
              color: "#1F2937",
            }
          }
        }
      })

      family.nodeCircleMenuUI.on("click", async (sender, args) => {
        const node = family.getNode(args.nodeId)
        const token = localStorage.getItem("token")
        if (!token) return

        try {
          switch (args.menuItemName) {
            case "deleteNode": {
              if (!canDeleteMember(node)) {
                alert("Cannot delete this member as it would break the family tree structure.")
                return
              }

              if (!confirm("Are you sure you want to delete this family member?")) {
                return
              }

              await deleteFamilyMember(token, node.id)
              await props.fetchData()
              break
            }
            case "addSon":
            case "addDaughter": {
              const gender = args.menuItemName === "addSon" ? "male" : "female"
              const newMemberData = {
                name: "Unknown",
                gender: gender,
              }

              if (node.gender === "male") {
                newMemberData.fatherId = node.id
                if (node.pids && node.pids[0]) {
                  newMemberData.motherId = node.pids[0]
                }
              } else {
                newMemberData.motherId = node.id
                if (node.pids && node.pids[0]) {
                  newMemberData.fatherId = node.pids[0]
                }
              }

              await handleAddMember(token, node, gender === "male" ? "son" : "daughter", props.fetchData, newMemberData)
              break
            }
            case "father":
              await handleAddMember(token, node, "father", props.fetchData)
              break
            case "mother":
              await handleAddMember(token, node, "mother", props.fetchData)
              break
            case "wife":
              await handleAddMember(token, node, "wife", props.fetchData)
              break
            case "husband":
              await handleAddMember(token, node, "husband", props.fetchData)
              break
            case "PDFProfile":
              family.exportPDFProfile({
                id: args.nodeId,
              })
              break
            case "editNode":
              family.editUI.show(args.nodeId)
              break
            default:
          }
        } catch (error) {
          console.error("Error handling member addition:", error)
        }
      })
    }
  }, [props.nodeBinding, props.nodes, props.fetchData])

  return null
}

// Update the TreeViewPage component to add more content and reduce whitespace
export default function TreeViewPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    generations: 0,
    oldestMember: null,
    youngestMember: null,
  })

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch("http://localhost:3001/family-members", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      const members = Array.isArray(result) ? result : Array.isArray(result.data) ? result.data : []
      // console.log("API raw result:", result)
      // console.log("API members:", members)
      const processedData = members.map((member: any) => {
        // Format dates properly for display and edit form
        const formattedBirthDate = member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : "";
        const formattedDeathDate = member.deathDate ? new Date(member.deathDate).toISOString().split('T')[0] : "";
        
        return {
          id: member._id,
          name: member.name,
          pids: Array.isArray(member.partnerId) ? member.partnerId : [],
          mid: member.motherId ? member.motherId.toString() : undefined,
          fid: member.fatherId ? member.fatherId.toString() : undefined,
          gender: member.gender,
          status: member.status || 'alive',
          birthDate: formattedBirthDate,
          deathDate: formattedDeathDate,
          country: member.country || '',
          occupation: member.occupation || '',
          tags: Array.isArray(member.tags) ? member.tags.join(', ') : '',
        };
      })

      setData(processedData)

      // Calculate family statistics
      if (processedData.length > 0) {
        // Find the maximum generation depth
        const findGenerationDepth = (memberId: string, depth = 1, visited = new Set()) => {
          if (visited.has(memberId)) return depth
          visited.add(memberId)

          const member = processedData.find((m) => m.id === memberId)
          if (!member) return depth

          const children = processedData.filter((m) => m.fid === memberId || m.mid === memberId)
          if (children.length === 0) return depth

          return Math.max(...children.map((child) => findGenerationDepth(child.id, depth + 1, new Set(visited))))
        }

        // Find root members (those without parents)
        const rootMembers = processedData.filter((m) => !m.fid && !m.mid)
        const maxGeneration =
          rootMembers.length > 0 ? Math.max(...rootMembers.map((m) => findGenerationDepth(m.id))) : 1

        setStats({
          totalMembers: processedData.length,
          generations: maxGeneration,
          oldestMember: processedData.reduce((oldest, current) => {
            if (
              !oldest ||
              (oldest.birthDate && current.birthDate && new Date(current.birthDate) < new Date(oldest.birthDate))
            ) {
              return current
            }
            return oldest
          }, null),
          youngestMember: processedData.reduce((youngest, current) => {
            if (
              !youngest ||
              (youngest.birthDate && current.birthDate && new Date(current.birthDate) > new Date(youngest.birthDate))
            ) {
              return current
            }
            return youngest
          }, null),
        })
      }
    } catch (error) {
      console.error("Error fetching family tree data:", error)
      setError(error instanceof Error ? error.message : "Failed to load family tree data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up event listener for auth events to refresh tree data
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && e.newValue) {
        // New login or registration detected, refresh data
        fetchData()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Check if we just logged in or registered
    const justLoggedIn = sessionStorage.getItem("justAuthenticated")
    if (justLoggedIn) {
      fetchData()
      sessionStorage.removeItem("justAuthenticated")
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const nodeBinding = {
    field_0: "name",
    field_1: "gender",
    field_2: "status",
    field_3: "birthDate",
    field_4: "deathDate",
    field_5: "country",
    field_6: "occupation",
    field_7: "tags",
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
          <h1 className="text-4xl font-bold text-gray-100 mb-3">Family Tree Explorer</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover your roots, connect with your heritage, and visualize your family's journey through time.
          </p>
        </motion.div>

        {/* Stats Cards */}
        {!loading && !error && data.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Family Members</h3>
              <p className="text-3xl font-bold text-white">{stats.totalMembers}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Generations</h3>
              <p className="text-3xl font-bold text-white">{stats.generations}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Oldest Member</h3>
              <p className="text-xl font-bold text-white truncate">{stats.oldestMember?.name || "N/A"}</p>
              <p className="text-xs text-gray-500">{stats.oldestMember?.birthDate || "Unknown"}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Youngest Member</h3>
              <p className="text-xl font-bold text-white truncate">{stats.youngestMember?.name || "N/A"}</p>
              <p className="text-xs text-gray-500">{stats.youngestMember?.birthDate || "Unknown"}</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-8"
        >
          {/* Tree Header */}
          <div className="bg-gray-700 p-4 border-b border-gray-600 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Interactive Family Tree</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors">
                Zoom In
              </button>
              <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors">
                Zoom Out
              </button>
              <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors">
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center h-96"
            >
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-gray-300 animate-spin"></div>
                <div className="absolute inset-0 h-12 w-12 rounded-full border-r-2 border-l-2 border-transparent animate-pulse"></div>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 text-center">
              <div className="text-red-400 mb-4 text-xl">⚠️ {error}</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchData()}
                className="px-6 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-all duration-300"
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
              <p className="text-gray-400 mb-4">Your family tree is empty. Start by adding your first family member.</p>
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-300">
                Add First Member
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
              <div className="p-4">
                <div id="tree" className="w-full h-[700px]"></div>
                <Familytree nodes={data} nodeBinding={nodeBinding} fetchData={fetchData} />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-3">Navigation Tips</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Click and drag to pan around the tree</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Use mouse wheel to zoom in and out</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Double-click a member to center the view</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-3">Editing Members</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Click on a member to see available actions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Add parents, children, or partners</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Edit details like birth dates and status</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-3">Sharing & Export</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Export individual profiles as PDF</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Save the entire tree as an image</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-400">•</span>
                <span>Share your family history with relatives</span>
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg"
        >
          <p className="text-gray-300">
            Click on a family member and use the circular menu to add, edit, or remove members.
            <br />
            <span className="text-sm text-gray-400">
              Your family tree data is automatically saved as you make changes.
            </span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
