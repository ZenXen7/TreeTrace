"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trees, Users, Clock, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Familytree from "@/app/dashboard/treeview/page"
import useTreeStore from "@/store/useTreeStore"
import { toast } from "react-hot-toast"

export default function PublicTreeView() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getFamilyTree, currentFamilyTree } = useTreeStore()

  useEffect(() => {
    const fetchPublicTree = async () => {
      try {
        setLoading(true)
        await getFamilyTree(id as string)
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
  }, [id, getFamilyTree])

  const nodeBinding = {
    field_0: "name",
    field_1: "surname",
    field_2: "gender",
    field_3: "status",
    field_4: "birthDate",
    field_5: "deathDate",
    field_6: "country",
    field_7: "occupation",
    field_8: "tags",
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
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Family tree not found"}</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
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
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-gray-100 mb-3">Public Family Tree</h1>
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
              <h2 className="text-xl font-semibold text-white">Family Tree View</h2>
              <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                Read Only
              </Badge>
            </div>
          </div>

          <div className="p-4">
            <div id="tree" className="w-full h-[700px]"></div>
            <Familytree
              nodes={[currentFamilyTree]}
              nodeBinding={nodeBinding}
              fetchData={() => {}}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 