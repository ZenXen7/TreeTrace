"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  Heart,
  Edit2,
  Trash2,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// Define the type for a family member
interface FamilyMember {
  id: string
  name: string
  relation: string
  gender: string
  birthYear?: string
  medicalConditions: string
  parentId?: string | null
  children?: FamilyMember[]
  spouse?: string
}

// Define relationship options
const relationOptions = [
  { value: "self", label: "Self" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "spouse", label: "Spouse" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "grandfather_paternal", label: "Grandfather (Paternal)" },
  { value: "grandmother_paternal", label: "Grandmother (Paternal)" },
  { value: "grandfather_maternal", label: "Grandfather (Maternal)" },
  { value: "grandmother_maternal", label: "Grandmother (Maternal)" },
  { value: "uncle", label: "Uncle" },
  { value: "aunt", label: "Aunt" },
  { value: "cousin", label: "Cousin" },
  { value: "other", label: "Other" },
]

// Function to organize family members into a tree structure
const organizeIntoTree = (members: FamilyMember[]) => {
  const rootMembers: FamilyMember[] = []
  const memberMap = new Map<string, FamilyMember>()

  // First pass: create a map of all members
  members.forEach((member) => {
    memberMap.set(member.id, { ...member, children: [] })
  })

  // Second pass: organize into tree structure
  members.forEach((member) => {
    const currentMember = memberMap.get(member.id)
    if (currentMember) {
      if (member.parentId && memberMap.has(member.parentId)) {
        const parent = memberMap.get(member.parentId)
        if (parent && parent.children) {
          parent.children.push(currentMember)
        }
      } else {
        rootMembers.push(currentMember)
      }
    }
  })

  return rootMembers
}

// Component to render a single family member node
const FamilyMemberNode = ({
  member,
  onEdit,
  onDelete,
  level = 0,
  isLast = true,
  isRoot = false,
  parentX = 0,
  parentY = 0,
  index = 0,
  siblingCount = 1,
  onPositionChange,
}: {
  member: FamilyMember
  onEdit: (member: FamilyMember) => void
  onDelete: (id: string) => void
  level?: number
  isLast?: boolean
  isRoot?: boolean
  parentX?: number
  parentY?: number
  index?: number
  siblingCount?: number
  onPositionChange?: (id: string, x: number, y: number) => void
}) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [position, setPosition] = useState({ x: 0, y: 0 })

 
  useEffect(() => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect()
      const newX = rect.left + rect.width / 2
      const newY = rect.top + rect.height / 2

      // Only update if position has actually changed
      if (position.x !== newX || position.y !== newY) {
        setPosition({ x: newX, y: newY })

        if (onPositionChange) {
          onPositionChange(member.id, newX, newY)
        }
      }
    }
    
  }, [member.id, isExpanded, level, index, siblingCount, onPositionChange])

  
  const getBgColor = () => {
    switch (member.gender) {
      case "male":
        return "from-blue-500/20 to-indigo-500/20 border-blue-500/30"
      case "female":
        return "from-pink-500/20 to-purple-500/20 border-pink-500/30"
      default:
        return "from-emerald-500/20 to-teal-500/20 border-emerald-500/30"
    }
  }

  
  const getIconColor = () => {
    switch (member.gender) {
      case "male":
        return "text-blue-400"
      case "female":
        return "text-pink-400"
      default:
        return "text-emerald-400"
    }
  }

  const hasChildren = member.children && member.children.length > 0

  return (
    <div className="flex flex-col items-center">
      <div className="relative" ref={nodeRef}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: level * 0.1 }}
          className={`relative p-3 rounded-lg border bg-gradient-to-br ${getBgColor()} backdrop-blur-sm 
                      shadow-sm hover:shadow-md transition-shadow duration-300 w-48`}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full bg-gray-900/40 ${getIconColor()}`}>
                <User size={14} />
              </div>
              <h4 className="font-medium text-white truncate max-w-[100px]" title={member.name}>
                {member.name}
              </h4>
            </div>
            <div className="flex gap-1">
              {hasChildren && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
              <button
                onClick={() => onEdit(member)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDelete(member.id)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-300 mb-1.5 flex items-center gap-1.5">
            <span className="capitalize">{member.relation}</span>
            {member.birthYear && (
              <>
                <span className="text-gray-500">•</span>
                <span>b. {member.birthYear}</span>
              </>
            )}
          </div>

          {member.medicalConditions && (
            <div className="flex items-start gap-1.5 mt-2">
              <Heart size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 line-clamp-2" title={member.medicalConditions}>
                {member.medicalConditions}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {hasChildren && isExpanded && (
        <div
          className={`mt-8 relative flex ${member.children!.length > 1 ? "justify-center gap-10" : "justify-center"}`}
        >
          <div className="absolute top-[-1rem] h-[1rem] w-px bg-gray-700/50" />

          {member.children!.length > 1 && (
            <div
              className="absolute top-[-1rem] h-[1rem] w-full"
              style={{
                borderTop: "0px solid transparent",
                borderLeft: "1px solid rgba(107, 114, 128, 0.5)",
                borderRight: "1px solid rgba(107, 114, 128, 0.5)",
                borderBottom: "1px solid rgba(107, 114, 128, 0.5)",
                borderBottomLeftRadius: "0.5rem",
                borderBottomRightRadius: "0.5rem",
                width: `${Math.max((member.children!.length - 1) * 200 + 20, 20)}px`,
              }}
            />
          )}

          <div className="flex gap-10">
            {member.children!.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="h-4 w-px bg-gray-700/50" />
                <FamilyMemberNode
                  member={child}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  level={level + 1}
                  isLast={idx === member.children!.length - 1}
                  parentX={position.x}
                  parentY={position.y}
                  index={idx}
                  siblingCount={member.children!.length}
                  onPositionChange={onPositionChange}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Main TreeView component
export default function TreeView() {
  const [activeTab, setActiveTab] = useState<string>("view")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [newMember, setNewMember] = useState<Omit<FamilyMember, "id">>({
    name: "",
    relation: "",
    gender: "",
    birthYear: "",
    medicalConditions: "",
    parentId: null,
  })
  const [zoom, setZoom] = useState(1)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setPositions((prev) => {
      // Only update if position has changed
      if (prev[id]?.x === x && prev[id]?.y === y) {
        return prev
      }
      return {
        ...prev,
        [id]: { x, y },
      }
    })
  }, [])
  const [showMedicalInfo, setShowMedicalInfo] = useState(true)

  // Handle position updates for drawing lines

  // Handle form submission for adding/editing a family member
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMember.name || !newMember.relation || !newMember.gender) {
      toast.error("Please fill in all required fields")
      return
    }

    if (editingMember) {
      // Update existing member
      setFamilyMembers((prev) =>
        prev.map((member) =>
          member.id === editingMember.id ? ({ ...newMember, id: editingMember.id } as FamilyMember) : member,
        ),
      )
      toast.success(`Updated ${newMember.name}'s information`)
    } else {
      // Add new member
      const newId = `member-${Date.now()}`
      setFamilyMembers((prev) => [...prev, { ...newMember, id: newId } as FamilyMember])
      toast.success(`Added ${newMember.name} to your family tree`)
    }

    // Reset form and close dialog
    setNewMember({
      name: "",
      relation: "",
      gender: "",
      birthYear: "",
      medicalConditions: "",
      parentId: null,
    })
    setEditingMember(null)
    setIsDialogOpen(false)
  }

  // Handle editing a family member
  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member)
    setNewMember({
      name: member.name,
      relation: member.relation,
      gender: member.gender,
      birthYear: member.birthYear || "",
      medicalConditions: member.medicalConditions,
      parentId: member.parentId,
    })
    setIsDialogOpen(true)
  }

  // Handle deleting a family member
  const handleDelete = (id: string) => {
    const memberToDelete = familyMembers.find((m) => m.id === id)
    if (!memberToDelete) return

    setFamilyMembers((prev) => prev.filter((member) => member.id !== id))
    toast.success(`Removed ${memberToDelete.name} from your family tree`)
  }

  // Generate a sample family tree
  const generateSampleTree = () => {
    const sampleTree: FamilyMember[] = [
      {
        id: "self-1",
        name: "John Doe",
        relation: "self",
        gender: "male",
        birthYear: "1985",
        medicalConditions: "Asthma, Seasonal allergies",
        parentId: null,
      },
      {
        id: "spouse-1",
        name: "Jane Doe",
        relation: "spouse",
        gender: "female",
        birthYear: "1987",
        medicalConditions: "Migraine",
        parentId: null,
      },
      {
        id: "father-1",
        name: "Robert Doe",
        relation: "father",
        gender: "male",
        birthYear: "1955",
        medicalConditions: "Hypertension, Type 2 Diabetes",
        parentId: null,
      },
      {
        id: "mother-1",
        name: "Mary Doe",
        relation: "mother",
        gender: "female",
        birthYear: "1958",
        medicalConditions: "Hypothyroidism",
        parentId: null,
      },
      {
        id: "son-1",
        name: "Michael Doe",
        relation: "son",
        gender: "male",
        birthYear: "2010",
        medicalConditions: "Asthma",
        parentId: "self-1",
      },
      {
        id: "daughter-1",
        name: "Emily Doe",
        relation: "daughter",
        gender: "female",
        birthYear: "2012",
        medicalConditions: "Eczema",
        parentId: "self-1",
      },
      {
        id: "brother-1",
        name: "James Doe",
        relation: "brother",
        gender: "male",
        birthYear: "1988",
        medicalConditions: "None",
        parentId: "father-1",
      },
      {
        id: "grandfather-1",
        name: "William Doe",
        relation: "grandfather_paternal",
        gender: "male",
        birthYear: "1930",
        medicalConditions: "Heart disease, Deceased 2010",
        parentId: null,
      },
      {
        id: "grandmother-1",
        name: "Elizabeth Doe",
        relation: "grandmother_paternal",
        gender: "female",
        birthYear: "1935",
        medicalConditions: "Arthritis, Glaucoma",
        parentId: null,
      },
    ]

    setFamilyMembers(sampleTree)
    toast.success("Sample family tree generated")
    setActiveTab("view")
  }

  
  const organizedMembers = organizeIntoTree(familyMembers)

 
  const rootMember = familyMembers.find((member) => member.relation === "self")

 
  const parentOptions = familyMembers.map((member) => ({
    value: member.id,
    label: `${member.name} (${member.relation})`,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none" />

      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Family Health Tree
            </h1>
            <p className="text-gray-400 mt-1">Map your family's health history and discover hereditary patterns</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => setShowMedicalInfo(!showMedicalInfo)}
            >
              <Heart className="mr-2 h-4 w-4" />
              {showMedicalInfo ? "Hide" : "Show"} Health Info
            </Button>

            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => setZoom((prev) => Math.min(1.5, prev + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <Tabs defaultValue="view" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-900/50 border border-gray-800/50 p-1 mb-4">
              <TabsTrigger
                value="view"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-white"
              >
                View Tree
              </TabsTrigger>
              <TabsTrigger
                value="manage"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-white"
              >
                Manage Members
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="mt-0">
              <Card className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-gray-800/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-white">Family Tree</CardTitle>
                    <CardDescription className="text-gray-400">Visualize your family health history</CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Family Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900/95 border border-gray-800 text-white backdrop-blur-md">
                        <DialogHeader>
                          <DialogTitle>{editingMember ? "Edit Family Member" : "Add Family Member"}</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            {editingMember
                              ? "Update the information for this family member."
                              : "Add a new member to your family tree."}
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                                  Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="name"
                                  value={newMember.name}
                                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                  placeholder="Full name"
                                  className="bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="birthYear" className="text-sm font-medium text-gray-300">
                                  Birth Year
                                </Label>
                                <Input
                                  id="birthYear"
                                  value={newMember.birthYear}
                                  onChange={(e) => setNewMember({ ...newMember, birthYear: e.target.value })}
                                  placeholder="YYYY"
                                  className="bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="relation" className="text-sm font-medium text-gray-300">
                                  Relation <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={newMember.relation}
                                  onValueChange={(value) => setNewMember({ ...newMember, relation: value })}
                                  required
                                >
                                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white">
                                    <SelectValue placeholder="Select relation" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    {relationOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-medium text-gray-300">
                                  Gender <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={newMember.gender}
                                  onValueChange={(value) => setNewMember({ ...newMember, gender: value })}
                                  required
                                >
                                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {newMember.relation !== "self" && (
                              <div className="space-y-2">
                                <Label htmlFor="parentId" className="text-sm font-medium text-gray-300">
                                  Related To
                                </Label>
                                <Select
                                  value={newMember.parentId || undefined}
                                  onValueChange={(value) => setNewMember({ ...newMember, parentId: value })}
                                >
                                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white">
                                    <SelectValue placeholder="Select family member" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="none">None (Root member)</SelectItem>
                                    {parentOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="medicalConditions" className="text-sm font-medium text-gray-300">
                                Medical Conditions
                              </Label>
                              <Textarea
                                id="medicalConditions"
                                value={newMember.medicalConditions}
                                onChange={(e) => setNewMember({ ...newMember, medicalConditions: e.target.value })}
                                placeholder="List any medical conditions, separated by commas"
                                className="bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white min-h-[80px]"
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false)
                                setEditingMember(null)
                                setNewMember({
                                  name: "",
                                  relation: "",
                                  gender: "",
                                  birthYear: "",
                                  medicalConditions: "",
                                  parentId: null,
                                })
                              }}
                              className="border-gray-700 text-gray-300 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                            >
                              {editingMember ? "Update Member" : "Add Member"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {familyMembers.length === 0 && (
                      <Button
                        onClick={generateSampleTree}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                      >
                        Generate Sample Tree
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent
                  className="p-0 relative overflow-x-auto overflow-y-auto"
                  style={{ minHeight: "500px", maxHeight: "70vh" }}
                >
                  {familyMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
                      <div className="w-24 h-24 mb-6 opacity-20">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full"
                        >
                          <path
                            d="M12 3v18M12 7l-3-3M12 7l3-3M5 12h14M7 12l-3 3M7 12l-3-3M17 12l3 3M17 12l3-3M12 17l-3 3M12 17l3 3"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-white mb-2">No Family Members Yet</h3>
                      <p className="text-gray-400 max-w-md mb-6">
                        Start building your family health tree by adding family members and their medical history.
                      </p>
                      <div className="flex gap-4">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                              <Plus className="mr-2 h-4 w-4" />
                              Add First Member
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        <Button
                          onClick={generateSampleTree}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                        >
                          Generate Sample Tree
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-10 flex justify-center items-start min-w-max"
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: "top center",
                        transition: "transform 0.3s ease",
                      }}
                    >
                      {rootMember ? (
                        <FamilyMemberNode
                          member={rootMember}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          isRoot={true}
                          onPositionChange={handlePositionChange}
                        />
                      ) : (
                        <div className="flex flex-col gap-10">
                          {organizedMembers.map((member) => (
                            <FamilyMemberNode
                              key={member.id}
                              member={member}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              isRoot={true}
                              onPositionChange={handlePositionChange}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t border-gray-800/50 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-400"></div>
                      <span className="text-xs text-gray-400">Male</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-pink-400"></div>
                      <span className="text-xs text-gray-400">Female</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                      <span className="text-xs text-gray-400">Other</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">{familyMembers.length} family members</div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="mt-0">
              <Card className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-gray-800/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-white">Manage Family Members</CardTitle>
                    <CardDescription className="text-gray-400">
                      Add, edit, or remove family members from your tree
                    </CardDescription>
                  </div>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Family Member
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardHeader>

                <CardContent className="p-0">
                  {familyMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
                      <p className="text-gray-400 mb-4">No family members added yet.</p>
                      <Button
                        onClick={generateSampleTree}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                      >
                        Generate Sample Tree
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800/50">
                      {familyMembers.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                member.gender === "male"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : member.gender === "female"
                                    ? "bg-pink-500/20 text-pink-400"
                                    : "bg-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              <User size={16} />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{member.name}</h4>
                                {member.relation === "self" && (
                                  <Badge className="bg-emerald-900/20 text-emerald-400 border-emerald-500/20 text-[10px]">
                                    You
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="capitalize">{member.relation.replace("_", " ")}</span>
                                {member.birthYear && (
                                  <>
                                    <span className="text-gray-600">•</span>
                                    <span>Born {member.birthYear}</span>
                                  </>
                                )}
                                {member.parentId && (
                                  <>
                                    <span className="text-gray-600">•</span>
                                    <span>
                                      Related to{" "}
                                      {familyMembers.find((m) => m.id === member.parentId)?.name || "Unknown"}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {member.medicalConditions && (
                            <div className="hidden md:flex items-center gap-1.5 max-w-xs">
                              <Heart size={12} className="text-red-400 flex-shrink-0" />
                              <p className="text-xs text-gray-400 truncate" title={member.medicalConditions}>
                                {member.medicalConditions}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                              onClick={() => handleEdit(member)}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                              onClick={() => handleDelete(member.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

