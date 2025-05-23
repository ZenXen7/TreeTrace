"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import AIChatSidebar from "@/components/AIChatSidebar"
import AIChatToggle from "@/components/AIChatToggle"
import { AIService } from "@/services/ai.service"
import jsPDF from "jspdf"
import "jspdf-autotable"
import {
  ArrowLeft,
  Download,
  FileText,
  Filter,
  Heart,
  Users,
  Activity,
  Droplets,
  BarChart3,
  RefreshCw,
  X,
  AlertTriangle,
  Check,
  TreePine,
} from "lucide-react"

interface Member {
  _id: string
  name: string
  surname?: string
  fatherId?: string
  motherId?: string
  birthDate?: string
  status?: string
  generation: number
  medicalConditions: string[]
  bloodType?: string
  partnerId?: string | string[]
}

function exportToCSV(members: Member[], conditions: string[]) {
  const header = ["Name", "Generation", "Blood Type", ...conditions]
  const rows = members.map((m) => [
    `${m.name} ${m.surname || ""}`.trim(),
    m.generation,
    m.bloodType || "",
    ...conditions.map((cond) => (m.medicalConditions.includes(cond) ? "Yes" : "")),
  ])
  const csvContent = [header, ...rows].map((r) => r.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "health-overview.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function HealthOverviewPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCondition, setSelectedCondition] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "generation">("generation")
  const [sortAsc, setSortAsc] = useState(true)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [allFamilyData, setAllFamilyData] = useState<any[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportPrompt, setReportPrompt] = useState("")
  const [reportDraft, setReportDraft] = useState("")
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    uniqueConditions: 0,
    mostCommonCondition: "",
    mostCommonBloodType: "",
  })

  useEffect(() => {
    async function fetchAllData() {
      const token = localStorage.getItem("token")
      if (!token) return
      // 1. Fetch all family members
      const res = await fetch("http://localhost:3001/family-members", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const familyMembers = (await res.json()).data || []
      // 2. For each member, fetch their medical history
      const allData = await Promise.all(
        familyMembers.map(async (member: any) => {
          let medicalHistory = null
          try {
            const medRes = await fetch(`http://localhost:3001/medical-history/family-member/${member._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (medRes.ok) {
              medicalHistory = (await medRes.json()).data
            }
          } catch {}
          return { ...member, medicalHistory }
        }),
      )
      setAllFamilyData(allData)
    }
    fetchAllData()
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch("http://localhost:3001/family-members", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        const membersRaw = data.data || []
        const memberPromises = membersRaw.map(async (member: any) => {
          let medicalConditions: string[] = []
          let bloodType: string | undefined = undefined
          try {
            const medRes = await fetch(`http://localhost:3001/medical-history/family-member/${member._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (medRes.ok) {
              const medData = await medRes.json()
              if (medData.data && medData.data.healthConditions) {
                medicalConditions = Object.entries(medData.data.healthConditions)
                  .filter(([_, checked]) => checked)
                  .map(([condition]) => condition)
              }
              if (medData.data && medData.data.bloodType) {
                bloodType = medData.data.bloodType
              }
            }
          } catch {}
          return {
            _id: member._id,
            name: member.name,
            surname: member.surname,
            fatherId: member.fatherId,
            motherId: member.motherId,
            birthDate: member.birthDate,
            status: member.status,
            generation: 1, // Placeholder, will be calculated below
            medicalConditions,
            bloodType,
            partnerId: member.partnerId,
          }
        })
        let membersWithConditions: Member[] = await Promise.all(memberPromises)
        // Calculate generations
        const memberMap = new Map<string, Member>()
        membersWithConditions.forEach((m) => memberMap.set(m._id, m))
        function getGeneration(member: Member, visited = new Set<string>()): number {
          if (visited.has(member._id)) return 1
          visited.add(member._id)
          let fatherGen = 0,
            motherGen = 0
          if (member.fatherId && memberMap.has(member.fatherId)) {
            fatherGen = getGeneration(memberMap.get(member.fatherId)!, visited)
          }
          if (member.motherId && memberMap.has(member.motherId)) {
            motherGen = getGeneration(memberMap.get(member.motherId)!, visited)
          }
          return 1 + Math.max(fatherGen, motherGen)
        }
        membersWithConditions = membersWithConditions.map((m) => ({
          ...m,
          generation: getGeneration(m),
        }))
        // Collect all unique conditions
        const allConditions = new Set<string>()
        membersWithConditions.forEach((m) => m.medicalConditions.forEach((c: string) => allConditions.add(c)))
        setMembers(membersWithConditions)
        setConditions(Array.from(allConditions))

        // Calculate statistics
        calculateStats(membersWithConditions, Array.from(allConditions))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const calculateStats = (members: Member[], conditions: string[]) => {
    // Count condition occurrences
    const conditionCounts: Record<string, number> = {}
    conditions.forEach((condition) => {
      conditionCounts[condition] = members.filter((m) => m.medicalConditions.includes(condition)).length
    })

    // Find most common condition
    let mostCommonCondition = ""
    let maxCount = 0
    Object.entries(conditionCounts).forEach(([condition, count]) => {
      if (count > maxCount) {
        mostCommonCondition = condition
        maxCount = count
      }
    })

    // Count blood types
    const bloodTypeCounts: Record<string, number> = {}
    members.forEach((member) => {
      if (member.bloodType) {
        bloodTypeCounts[member.bloodType] = (bloodTypeCounts[member.bloodType] || 0) + 1
      }
    })

    // Find most common blood type
    let mostCommonBloodType = ""
    maxCount = 0
    Object.entries(bloodTypeCounts).forEach(([bloodType, count]) => {
      if (count > maxCount) {
        mostCommonBloodType = bloodType
        maxCount = count
      }
    })

    setStats({
      totalMembers: members.length,
      uniqueConditions: conditions.length,
      mostCommonCondition: mostCommonCondition
        ? mostCommonCondition.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
        : "None",
      mostCommonBloodType: mostCommonBloodType || "Unknown",
    })
  }

  // Filtering and sorting
  let filteredMembers = members
  if (selectedCondition) {
    filteredMembers = filteredMembers.filter((m) => m.medicalConditions.includes(selectedCondition))
  }
  filteredMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === "generation") {
      return sortAsc ? a.generation - b.generation : b.generation - a.generation
    } else {
      const nameA = `${a.name} ${a.surname || ""}`.toLowerCase()
      const nameB = `${b.name} ${b.surname || ""}`.toLowerCase()
      if (nameA < nameB) return sortAsc ? -1 : 1
      if (nameA > nameB) return sortAsc ? 1 : -1
      return 0
    }
  })

  async function handleGenerateReport() {
    setReportLoading(true)
    setReportError(null)
    try {
      const ai = AIService.getInstance()
      const prompt = `${reportPrompt}

      Please follow these formatting guidelines strictly:
      1. Keep paragraphs short and concise (max 4-5 lines)
      2. Add a single line break between paragraphs
      3. Use clear section headers followed by a colon
      4. Use single line breaks between sections
      5. For lists, use simple dashes (-) and keep items on separate lines
      6. Maintain consistent spacing throughout the document
      7. Do NOT use any markdown, bold, or special formatting
      8. Keep content aligned and avoid large gaps between text

      Format sections like this:
      SECTION TITLE:
      Main content here, keeping it concise.

      NEXT SECTION:
      - List item one
      - List item two

      Please provide the report following these guidelines.`

      const draft = await ai.askGemini(prompt, allFamilyData)
      setReportDraft(draft)
    } catch (err: any) {
      setReportError("Failed to generate report. Please try again.")
    } finally {
      setReportLoading(false)
    }
  }

  function exportReportAsPDF() {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 15
    const contentWidth = pageWidth - 2 * margin

    // Set document properties
    doc.setProperties({
      title: "TreeTrace Health Report",
      subject: "Family Health Overview",
      author: localStorage.getItem("userName") || "TreeTrace User",
      creator: "TreeTrace",
      keywords: "health report, family tree, medical history",
    })

    // Add gradient header background
    doc.setFillColor(0, 128, 128) // Teal color
    doc.rect(0, 0, pageWidth, 50, "F")
    doc.setFillColor(0, 0, 0, 0.1)
    doc.rect(0, 0, pageWidth, 50, "F")
    doc.setFillColor(0, 0, 0)

    // Add TreeTrace logo and title
    const now = new Date()
    const dateString = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Add header content
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("TreeTrace", margin, 25)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Health Report", margin, 35)

    doc.setFontSize(10)
    doc.text(`Generated: ${dateString} at ${timeString}`, pageWidth - margin, 25, { align: "right" })

    let yPos = 70

    // Add report sections with modern styling
    const sections = reportDraft.split(/\n\n|(?=\n[A-Z][^\n]+:)/g)

    sections.forEach((section, index) => {
      const trimmedSection = section.trim()

      // Check if we need a new page
      if (yPos > pageHeight - 50) {
        addFooter(doc.internal.pages.length)
        doc.addPage()
        yPos = 30
        // Reset text properties after new page
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(60, 60, 60)
      }

      // Check if this is a section header
      if (trimmedSection.match(/^[A-Z][^:]+:/)) {
        const headerMatch = trimmedSection.match(/^([A-Z][^:]+):(.*)/s)
        if (headerMatch) {
          const [_, header, content] = headerMatch

          // Add section header with accent bar
          doc.setFillColor(0, 128, 128)
          doc.rect(margin, yPos, 3, 8, "F")

          doc.setFont("helvetica", "bold")
          doc.setFontSize(14)
          doc.setTextColor(0, 128, 128)
          doc.text(header, margin + 8, yPos + 6)
          yPos += 15

          // Add section content
          doc.setFont("helvetica", "normal")
          doc.setFontSize(11)
          doc.setTextColor(60, 60, 60)

          const contentLines = doc.splitTextToSize(content.trim(), contentWidth)
          contentLines.forEach((line: string) => {
            // Check if we need a new page
            if (yPos > pageHeight - 50) {
              addFooter(doc.internal.pages.length)
              doc.addPage()
              yPos = 30
              // Reset text properties after new page
              doc.setFontSize(11)
              doc.setFont("helvetica", "normal")
              doc.setTextColor(60, 60, 60)
            }
            doc.text(line, margin, yPos)
            yPos += 6
          })
        }
      } else {
        // Regular paragraph with improved typography
        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
        doc.setTextColor(60, 60, 60)

        const lines = doc.splitTextToSize(trimmedSection, contentWidth)
        lines.forEach((line: string) => {
          // Check if we need a new page
          if (yPos > pageHeight - 50) {
            addFooter(doc.internal.pages.length)
            doc.addPage()
            yPos = 30
            // Reset text properties after new page
            doc.setFontSize(11)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(60, 60, 60)
          }
          doc.text(line, margin, yPos)
          yPos += 6
        })
      }

      // Add spacing between sections
      yPos += 8
    })

    // Add final footer
    addFooter(doc.internal.pages.length)

    function addFooter(pageNum: number) {
      const footerTop = pageHeight - 25

      // Add gradient footer background
      doc.setFillColor(245, 245, 245)
      doc.rect(0, footerTop - 10, pageWidth, 35, "F")

      // Add footer content
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        "This report is for informational purposes only and does not constitute medical advice.",
        margin,
        footerTop,
      )
      doc.text("For personalized advice, consult a qualified healthcare professional.", margin, footerTop + 5)

      // Add page number with circle design
      doc.setFillColor(0, 128, 128)
      doc.circle(pageWidth - margin - 12, footerTop, 8, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.text(pageNum.toString(), pageWidth - margin - 12, footerTop + 1, { align: "center" })

      // Add TreeTrace branding
      doc.setTextColor(0, 128, 128)
      doc.setFontSize(8)
      doc.text("TreeTrace © " + new Date().getFullYear(), margin, footerTop + 12)
    }

    // Save the PDF
    doc.save("TreeTrace-Health-Report.pdf")
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin"></div>
            <div
              className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-r-blue-500/50 animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
          <p className="text-teal-300 text-lg font-medium">Loading health data...</p>
          <p className="text-gray-400 text-sm mt-2">Analyzing family medical information</p>
        </div>
      </div>
    )

  if (members.length === 0)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 mx-auto bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-teal-400" />
        </div>
        <div className="text-2xl mb-4 font-light text-center">No family members found.</div>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Add family members to your tree first to view health information and generate reports.
        </p>
        <Link
          href="/dashboard/treeview"
          className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-all duration-300 shadow-lg flex items-center gap-2"
        >
          <TreePine className="w-5 h-5" />
          Back to Tree View
        </Link>
      </div>
    )

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-black text-white font-sans relative"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />

        <div className="container mx-auto px-4 py-8 relative max-w-7xl">
          {/* Header Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/dashboard/treeview"
                className="group flex items-center gap-3 text-gray-400 hover:text-teal-400 transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-teal-900/30 transition-colors">
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                </div>
                <span className="font-medium">Back to Family Tree</span>
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <Heart className="h-4 w-4 text-teal-400" />
                  <span className="text-sm text-gray-300">Health Overview</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Family Health Overview
              </h1>
              <p className="text-gray-400 max-w-3xl mx-auto text-lg">
                Visualize health conditions across your family tree to identify patterns and potential hereditary risks.
              </p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-teal-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-teal-400" />
                </div>
                <span className="text-xs text-teal-400 font-medium px-2 py-1 bg-teal-500/10 rounded-full">Members</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Family Members</h3>
              <p className="text-3xl font-bold text-white">{stats.totalMembers}</p>
            </div>

            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-xs text-blue-400 font-medium px-2 py-1 bg-blue-500/10 rounded-full">
                  Conditions
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Unique Health Conditions</h3>
              <p className="text-3xl font-bold text-white">{stats.uniqueConditions}</p>
            </div>

            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-xs text-purple-400 font-medium px-2 py-1 bg-purple-500/10 rounded-full">
                  Common
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Most Common Condition</h3>
              <div>
                <p className="text-xl font-bold text-white truncate">{stats.mostCommonCondition}</p>
              </div>
            </div>

            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-red-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <Droplets className="h-6 w-6 text-red-400" />
                </div>
                <span className="text-xs text-red-400 font-medium px-2 py-1 bg-red-500/10 rounded-full">Blood</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Most Common Blood Type</h3>
              <p className="text-3xl font-bold text-white">{stats.mostCommonBloodType}</p>
            </div>
          </motion.div>

          {/* Main Content Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 overflow-hidden mb-8 shadow-2xl"
          >
            {/* Controls Header */}
            <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-6 border-b border-gray-700/50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-lg">
                    <Heart className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Health Condition Matrix</h2>
                    <p className="text-sm text-gray-400">Visualize health patterns across family members</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-gray-800/80 rounded-lg px-4 py-2.5 shadow-inner border border-gray-700/50">
                    <Filter className="h-4 w-4 text-teal-400 mr-2" />
                    <select
                      id="conditionFilter"
                      className="bg-transparent text-white border-none focus:ring-0 focus:outline-none text-sm"
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                    >
                      <option value="">All Conditions</option>
                      {conditions.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    onClick={() => exportToCSV(filteredMembers, conditions)}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    onClick={() => setShowReportModal(true)}
                  >
                    <FileText className="h-4 w-4" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-white text-sm">
                <thead className="sticky top-0 bg-gray-900/90 z-20 select-none">
                  <tr>
                    <th
                      className="border-b border-gray-800 px-6 py-4 text-left font-medium text-teal-300 cursor-pointer hover:text-teal-200 transition-colors"
                      onClick={() => {
                        setSortBy("name")
                        setSortAsc(sortBy !== "name" ? true : !sortAsc)
                      }}
                      aria-sort={sortBy === "name" ? (sortAsc ? "ascending" : "descending") : undefined}
                    >
                      <div className="flex items-center">
                        Member
                        <span className="ml-1 opacity-70">{sortBy === "name" ? (sortAsc ? "▲" : "▼") : ""}</span>
                      </div>
                    </th>
                    <th className="border-b border-gray-800 px-6 py-4 text-left font-medium text-teal-300">Parents</th>
                    <th className="border-b border-gray-800 px-6 py-4 text-left font-medium text-teal-300">Partner</th>
                    <th
                      className="border-b border-gray-800 px-6 py-4 text-left font-medium text-teal-300 cursor-pointer hover:text-teal-200 transition-colors"
                      onClick={() => {
                        setSortBy("generation")
                        setSortAsc(sortBy !== "generation" ? true : !sortAsc)
                      }}
                      aria-sort={sortBy === "generation" ? (sortAsc ? "ascending" : "descending") : undefined}
                    >
                      <div className="flex items-center">
                        Generation
                        <span className="ml-1 opacity-70">{sortBy === "generation" ? (sortAsc ? "▲" : "▼") : ""}</span>
                      </div>
                    </th>
                    <th className="border-b border-gray-800 px-6 py-4 text-left font-medium text-teal-300">
                      Blood Type
                    </th>
                    {conditions.map((cond) => (
                      <th key={cond} className="border-b border-gray-800 px-6 py-4 text-left font-medium text-teal-300">
                        {cond.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5 + conditions.length} className="text-center py-12 text-gray-400">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                            <Filter className="w-8 h-8 text-gray-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
                          <p className="text-gray-400 mb-4">No members found with the selected condition.</p>
                          <button
                            onClick={() => setSelectedCondition("")}
                            className="px-4 py-2 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Filter className="w-4 h-4" />
                            Clear Filter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member, index) => (
                      <tr
                        key={member._id}
                        className={`
                        transition-colors hover:bg-gray-800/60
                        ${index % 2 === 0 ? "bg-gray-900/40" : "bg-gray-900/20"}
                      `}
                      >
                        <td className="border-b border-gray-800/50 px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/dashboard/medical-history/${member._id}`}
                            className="text-teal-400 hover:text-teal-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-50 rounded px-1 flex items-center gap-2"
                            tabIndex={0}
                            title={`Birthdate: ${member.birthDate || "N/A"}\nStatus: ${member.status || "N/A"}`}
                          >
                            <Heart className="w-3.5 h-3.5" />
                            <span>
                              {member.name} {member.surname}
                            </span>
                          </Link>
                        </td>
                        <td className="border-b border-gray-800/50 px-6 py-4 whitespace-nowrap text-gray-300">
                          {(() => {
                            const father = members.find((m) => m._id === member.fatherId)
                            const mother = members.find((m) => m._id === member.motherId)
                            const fatherName = father ? `${father.name} ${father.surname || ""}`.trim() : ""
                            const motherName = mother ? `${mother.name} ${mother.surname || ""}`.trim() : ""
                            if (fatherName && motherName) return `${fatherName} / ${motherName}`
                            if (fatherName) return fatherName
                            if (motherName) return motherName
                            return "Unknown"
                          })()}
                        </td>
                        <td className="border-b border-gray-800/50 px-6 py-4 whitespace-nowrap text-gray-300">
                          {(() => {
                            const partnerIds = Array.isArray(member.partnerId)
                              ? member.partnerId
                              : member.partnerId
                                ? [member.partnerId]
                                : []
                            if (!partnerIds.length) return "No partner"
                            const partnerNames = partnerIds
                              .map((pid) => {
                                const partner = members.find((m) => m._id === pid)
                                return partner ? `${partner.name} ${partner.surname || ""}`.trim() : ""
                              })
                              .filter(Boolean)
                            return partnerNames.length ? partnerNames.join(" / ") : "No partner"
                          })()}
                        </td>
                        <td className="border-b border-gray-800/50 px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-gray-800 text-teal-300 text-xs font-medium">
                            {member.generation}
                          </span>
                        </td>
                        <td className="border-b border-gray-800/50 px-6 py-4 text-center whitespace-nowrap">
                          {member.bloodType ? (
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full bg-red-900/30 text-red-300 text-xs font-medium border border-red-900/50">
                              {member.bloodType}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        {conditions.map((cond) => (
                          <td key={cond} className="border-b border-gray-800/50 px-6 py-4 text-center align-middle">
                            <div className="flex justify-center items-center h-full w-full min-h-[24px] min-w-[24px]">
                              {member.medicalConditions.includes(cond) ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                                  <Check className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="w-7 h-7 rounded-full"></span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Additional Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl bg-gradient-to-r from-teal-900/20 to-blue-900/20 backdrop-blur-sm p-6 border border-teal-500/20 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Health Reports</h3>
                <p className="text-gray-300 mb-4">
                  Generate custom health reports to analyze patterns, identify potential hereditary risks, and gain
                  insights into your family's health history.
                </p>
                <button
                  className="group px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  onClick={() => setShowReportModal(true)}
                >
                  <FileText className="w-5 h-5 group-hover:animate-pulse" />
                  Create Custom Health Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        allFamilyData={allFamilyData}
        title="Health Medical Expert"
      />
      <AIChatToggle onClick={() => setIsAIChatOpen(!isAIChatOpen)} isOpen={isAIChatOpen} />

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-2xl w-full relative border border-gray-700/50"
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-teal-400 transition-colors p-2 rounded-full hover:bg-gray-800/50"
              onClick={() => setShowReportModal(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-teal-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-teal-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Generate Health Report</h2>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-300 text-sm font-medium">
                Describe the report you want to generate:
              </label>
              <textarea
                className="w-full p-4 rounded-lg bg-gray-800/80 text-white border border-gray-700/50 focus:border-teal-500 focus:ring focus:ring-teal-500/20 transition-all mb-2 placeholder-gray-500 shadow-inner"
                rows={3}
                value={reportPrompt}
                onChange={(e) => setReportPrompt(e.target.value)}
                placeholder="e.g. Summarize all members with hypertension and their generations."
              />
              <p className="text-xs text-gray-500">Be specific about what health information you want to analyze.</p>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                className={`
                  flex-1 px-4 py-3 rounded-lg text-white transition-all flex items-center justify-center gap-2
                  ${
                    reportLoading || !reportPrompt.trim()
                      ? "bg-gray-700 cursor-not-allowed opacity-70"
                      : "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-lg hover:shadow-xl"
                  }
                `}
                onClick={handleGenerateReport}
                disabled={reportLoading || !reportPrompt.trim()}
              >
                {reportLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Generate Draft
                  </>
                )}
              </button>

              <button
                className="px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700/50 flex items-center gap-2"
                onClick={() => {
                  setReportPrompt("")
                  setReportDraft("")
                }}
                disabled={reportLoading}
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>

            {reportError && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 text-sm">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>{reportError}</span>
                </div>
              </div>
            )}

            {reportDraft && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Draft Report</h3>
                </div>

                <div className="bg-gray-800/80 p-5 rounded-lg text-white whitespace-pre-wrap max-h-80 overflow-y-auto border border-gray-700/50 shadow-inner mb-6">
                  {reportDraft}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transition-colors shadow-lg flex items-center gap-2"
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>

                  <button
                    className="px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-colors shadow-lg flex items-center gap-2"
                    onClick={exportReportAsPDF}
                  >
                    <Download className="w-4 h-4" />
                    Export as PDF
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </>
  )
}
