"use client"
import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, TreePine, Heart, FileText, Settings, Sparkles, Lightbulb, ChevronDown, Info } from "lucide-react"

export default function UserGuidePage() {
  const [activeCard, setActiveCard] = useState<number | null>(null)

  const features = [
    {
      icon: <TreePine className="w-8 h-8 text-teal-400" />,
      title: "Family Tree (TreeView)",
      description: "Build and explore your family connections",
      color: "from-teal-500/10 to-teal-600/10",
      borderColor: "border-teal-500/20",
      hoverBorderColor: "border-teal-500/70",
      hoverBgColor: "from-teal-500/20 to-teal-600/20",
      iconBgColor: "bg-teal-500/20",
      details: [
        "Navigate to My Tree from the sidebar to view your family tree",
        "Click on a family member to view details, add relatives, or edit information",
        "Use the add or edit buttons to update relationships, add children, partners, or parents",
        "Hover over nodes for quick info, or click for full details and actions",
        "Use the Share button to share your tree with others",
      ],
    },
    {
      icon: <Heart className="w-8 h-8 text-pink-400" />,
      title: "Health Overview",
      description: "Track health patterns across generations",
      color: "from-pink-500/10 to-pink-600/10",
      borderColor: "border-pink-500/20",
      hoverBorderColor: "border-pink-500/70",
      hoverBgColor: "from-pink-500/20 to-pink-600/20",
      iconBgColor: "bg-pink-500/20",
      details: [
        "Go to Health Overview in the sidebar to see a summary of health conditions across your family",
        "Filter by specific health conditions using the dropdown at the top",
        "Sort by generation or name to spot hereditary patterns",
        "Export the overview as a CSV or generate a custom health report (PDF) using the provided buttons",
      ],
    },
    {
      icon: <FileText className="w-8 h-8 text-blue-400" />,
      title: "Health Condition Form",
      description: "Manage detailed health information",
      color: "from-blue-500/10 to-blue-600/10",
      borderColor: "border-blue-500/20",
      hoverBorderColor: "border-blue-500/70",
      hoverBgColor: "from-blue-500/20 to-blue-600/20",
      iconBgColor: "bg-blue-500/20",
      details: [
        "Click on a family member and select Medical History to view or edit their health information",
        "Fill out the health condition checkboxes, allergies, medications, surgeries, and other relevant fields",
        "Save the form to update the member's medical history. You can update this information anytime",
      ],
    },
    {
      icon: <Sparkles className="w-8 h-8 text-orange-400" />,
      title: "Suggestions & Similar Trees",
      description: "Discover potential family connections",
      color: "from-orange-500/10 to-orange-600/10",
      borderColor: "border-orange-500/20",
      hoverBorderColor: "border-orange-500/70",
      hoverBgColor: "from-orange-500/20 to-orange-600/20",
      iconBgColor: "bg-orange-500/20",
      details: [
        "When viewing your family tree, you may see an orange circle on certain nodes or in the sidebar",
        "This indicates that TreeTrace has found similar family members or trees from other users that may match your relatives",
        "Click the orange circle or the suggestion icon to view details about the suggested match",
        "You can review the suggested information and choose to add the suggested member or tree to your own family tree if it matches",
        "This feature helps you discover new connections and expand your family history with data from the TreeTrace community",
      ],
    },
    {
      icon: <Settings className="w-8 h-8 text-purple-400" />,
      title: "Other Features",
      description: "Additional tools and settings",
      color: "from-purple-500/10 to-purple-600/10",
      borderColor: "border-purple-500/20",
      hoverBorderColor: "border-purple-500/70",
      hoverBgColor: "from-purple-500/20 to-purple-600/20",
      iconBgColor: "bg-purple-500/20",
      details: [
        "Search Users: Use the search function in the sidebar to find and connect with other users or family members",
        "Settings: Update your profile, privacy preferences, and notification settings in the Settings page",
        "AI Health Assistant: Use the AI chat sidebar for health advice, risk analysis, or to ask questions about your family's health data",
        "Report Generation: On the Health Overview page, generate custom health reports using AI and export them as PDF for sharing or record-keeping",
      ],
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-yellow-400" />,
      title: "Tips & Support",
      description: "Get the most out of TreeTrace",
      color: "from-yellow-500/10 to-yellow-600/10",
      borderColor: "border-yellow-500/20",
      hoverBorderColor: "border-yellow-500/70",
      hoverBgColor: "from-yellow-500/20 to-yellow-600/20",
      iconBgColor: "bg-yellow-500/20",
      details: [
        "Hover over buttons and icons for tooltips and extra info",
        "For privacy, you control who can see your family and health data",
        "If you need help, check this guide or contact support from the Settings page",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white">
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto py-12 px-4 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <Link
            href="/dashboard/main"
            className="group flex items-center gap-3 text-gray-400 hover:text-teal-400 transition-all duration-200 mb-8"
          >
            <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-teal-900/30 transition-colors">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="font-medium">Back to Dashboard</span>
          </Link>

          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              User Guide
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">Learn how to use TreeTrace effectively</p>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Info className="w-4 h-4" />
              <span>Hover over any card to see detailed instructions</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </div>
          </div>
        </motion.div>

        {/* Main Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`
                rounded-2xl bg-gradient-to-br ${activeCard === index ? feature.hoverBgColor : feature.color} 
                backdrop-blur-sm border ${activeCard === index ? feature.hoverBorderColor : feature.borderColor} 
                transition-all duration-500 ease-in-out cursor-pointer
                ${activeCard === index ? "shadow-lg shadow-black/30" : "hover:shadow-md hover:shadow-black/20"}
              `}
              onMouseEnter={() => setActiveCard(index)}
              onMouseLeave={() => setActiveCard(null)}
              style={{
                minHeight: activeCard === index ? "320px" : "180px",
                height: "auto",
                transition: "min-height 500ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div className="p-6 h-full flex flex-col">
                {/* Header - Always visible */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${feature.iconBgColor} transition-colors`}>{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    <p className="text-gray-300 text-sm">{feature.description}</p>
                  </div>
                </div>

                {/* Indicator - Only visible when not active */}
                {activeCard !== index && (
                  <div className="mt-auto flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <span>Hover for details</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                )}

                {/* Details - Only visible when active */}
                {activeCard === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="mt-4 space-y-3"
                  >
                    {feature.details.map((detail, detailIndex) => (
                      <motion.div
                        key={detailIndex}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.2 + detailIndex * 0.1,
                          ease: "easeOut",
                        }}
                        className="flex items-start gap-3 text-gray-200 text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{detail}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="rounded-2xl bg-gradient-to-r from-teal-900/30 to-blue-900/30 backdrop-blur-sm border border-teal-500/20 p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Begin your family tree journey and discover your health heritage
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/treeview">
                <button className="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center">
                  <TreePine className="w-5 h-5" />
                  Build Your Tree
                </button>
              </Link>
              <Link href="/dashboard/health-overview">
                <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all duration-300 border border-gray-700 flex items-center gap-2 justify-center">
                  <Heart className="w-5 h-5" />
                  View Health Data
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
