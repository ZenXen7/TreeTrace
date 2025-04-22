"use client"

import { useEffect, useState } from "react"
import FamilyTree from "@balkangraph/familytree.js"
import { handleAddMember, updateFamilyMember, deleteFamilyMember } from "./service/familyService"

function Familytree(props: {
  nodeBinding: any
  nodes: any
  fetchData: () => Promise<void>
}) {
  useEffect(() => {
    const treeElement = document.getElementById("tree")
    if (treeElement) {
      // Modern styling for node menu buttons
      FamilyTree.templates.tommy.nodeCircleMenuButton =
        FamilyTree.templates.tommy_female.nodeCircleMenuButton =
        FamilyTree.templates.tommy_male.nodeCircleMenuButton =
          {
            radius: 18,
            x: 230,
            y: 60,
            color: "#ffffff",
            stroke: "#6366f1", // Indigo color for accent
          }

      // Custom node styling
      FamilyTree.templates.tommy.node =
        '<rect x="0" y="0" height="120" width="250" rx="8" ry="8" strokeWidth="1" fill="#ffffff" stroke="#e5e7eb" class="bft-node-rect"></rect>'
      FamilyTree.templates.tommy_female.node =
        '<rect x="0" y="0" height="120" width="250" rx="8" ry="8" strokeWidth="1" fill="#fdf2f8" stroke="#e5e7eb" class="bft-node-rect"></rect>'
      FamilyTree.templates.tommy_male.node =
        '<rect x="0" y="0" height="120" width="250" rx="8" ry="8" strokeWidth="1" fill="#eff6ff" stroke="#e5e7eb" class="bft-node-rect"></rect>'

      // Improved text styling
      FamilyTree.templates.tommy.field_0 =
        '<text class="bft-field-0" style="font-size: 16px; font-weight: 600;" fill="#1f2937" x="125" y="30" textAnchor="middle">{val}</text>'
      FamilyTree.templates.tommy_female.field_0 =
        '<text class="bft-field-0" style="font-size: 16px; font-weight: 600;" fill="#1f2937" x="125" y="30" textAnchor="middle">{val}</text>'
      FamilyTree.templates.tommy_male.field_0 =
        '<text class="bft-field-0" style="font-size: 16px; font-weight: 600;" fill="#1f2937" x="125" y="30" textAnchor="middle">{val}</text>'

      // Other fields styling
      const fieldStyle = 'style="font-size: 14px;" fill="#4b5563" textAnchor="middle"'
      FamilyTree.templates.tommy.field_1 = `<text class="bft-field-1" ${fieldStyle} x="125" y="55">{val}</text>`
      FamilyTree.templates.tommy.field_2 = `<text class="bft-field-2" ${fieldStyle} x="125" y="75">{val}</text>`
      FamilyTree.templates.tommy.field_3 = `<text class="bft-field-3" ${fieldStyle} x="125" y="95">{val}</text>`
      FamilyTree.templates.tommy.field_4 = `<text class="bft-field-4" ${fieldStyle} x="125" y="115">{val}</text>`

      // Apply the same styling to male and female templates
      FamilyTree.templates.tommy_female.field_1 = FamilyTree.templates.tommy.field_1
      FamilyTree.templates.tommy_female.field_2 = FamilyTree.templates.tommy.field_2
      FamilyTree.templates.tommy_female.field_3 = FamilyTree.templates.tommy.field_3
      FamilyTree.templates.tommy_female.field_4 = FamilyTree.templates.tommy.field_4

      FamilyTree.templates.tommy_male.field_1 = FamilyTree.templates.tommy.field_1
      FamilyTree.templates.tommy_male.field_2 = FamilyTree.templates.tommy.field_2
      FamilyTree.templates.tommy_male.field_3 = FamilyTree.templates.tommy.field_3
      FamilyTree.templates.tommy_male.field_4 = FamilyTree.templates.tommy.field_4

      const family = new FamilyTree(treeElement, {
        nodeTreeMenu: true,
        mode: "dark",
        nodeBinding: props.nodeBinding,
        nodes: props.nodes,
        nodeCircleMenu: {
          PDFProfile: {
            icon: FamilyTree.icon.pdf(24, 24, "#6366f1"),
            text: "PDF Profile",
            color: "white",
          },
          editNode: {
            icon: FamilyTree.icon.edit(24, 24, "#6366f1"),
            text: "Edit Member",
            color: "white",
          },
          addClink: {
            icon: FamilyTree.icon.link(24, 24, "#6366f1"),
            text: "Add Connection",
            color: "#fff",
            draggable: true,
          },
          deleteNode: {
            icon: FamilyTree.icon.remove(24, 24, "#ef4444"),
            text: "Delete Member",
            color: "white",
          },
        },
        // Modern tree styling
        levelSeparation: 100,
        siblingSeparation: 40,
        subtreeSeparation: 80,
        padding: 30,
        orientation: FamilyTree.orientation.top,
        layout: FamilyTree.mixed,
        scaleInitial: FamilyTree.match.boundary,
        enableSearch: true,
        enableDragDrop: true,
        enablePan: true,
        enableZoom: true,
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

            const updatedData = {
              name: rawData.name,
              gender: rawData.gender,
              status: rawData.status,
              birthDate: rawData.birthDate,
              deathDate: rawData.deathDate,
            }

            await updateFamilyMember(token, resolvedId, updatedData)
            await props.fetchData()
          } catch (error) {
            console.error("Error saving updated member:", error)
          }
        })()

        return true
      })

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
            color: "white",
          }
        }

        if (FamilyTree.isNEU(node.fid)) {
          args.menu.father = {
            icon: FamilyTree.icon.father(24, 24, "#3b82f6"),
            text: "Add father",
            color: "white",
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
            color: "white",
          }
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(24, 24, "#ec4899"),
            text: `Add Daughter with partner`,
            color: "white",
          }
        } else {
          args.menu.addSon = {
            icon: FamilyTree.icon.son(24, 24, "#3b82f6"),
            text: "Add Son",
            color: "white",
          }
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(24, 24, "#ec4899"),
            text: "Add Daughter",
            color: "white",
          }
        }

        // Add partner option if no partner exists
        if (!hasPartner) {
          if (node.gender === "male") {
            args.menu.wife = {
              icon: FamilyTree.icon.wife(24, 24, "#ec4899"),
              text: "Add wife",
              color: "white",
            }
          } else if (node.gender === "female") {
            args.menu.husband = {
              icon: FamilyTree.icon.husband(24, 24, "#3b82f6"),
              text: "Add husband",
              color: "white",
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

export default function TreeViewPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      console.log("API raw result:", result)
      console.log("API members:", members)

      setData(
        members.map((member: any) => ({
          id: member._id,
          name: member.name,
          pids: Array.isArray(member.partnerId) ? member.partnerId : [],
          mid: member.motherId ? member.motherId.toString() : undefined,
          fid: member.fatherId ? member.fatherId.toString() : undefined,
          gender: member.gender,
          status: member.status,
          birthDate: member.birthDate,
          deathDate: member.deathDate,
        })),
      )
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Family Tree View</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore your family connections and heritage through this interactive family tree visualization.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-4 text-xl">⚠️ {error}</div>
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your family tree is empty. Start by adding your first family member.
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div id="tree" className="w-full h-[600px]"></div>
              <Familytree nodes={data} nodeBinding={nodeBinding} fetchData={fetchData} />
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Click on a family member and use the circular menu to add, edit, or remove members.</p>
        </div>
      </div>
    </div>
  )
}
