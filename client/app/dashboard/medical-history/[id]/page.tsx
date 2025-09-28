"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Save,
  Heart,
  AlertCircle,
  Check,
  Droplets,
  Pill,
  Stethoscope,
  Syringe,
  FileText,
  X,
  Lock,
} from "lucide-react"
import React from "react"
import { getMedicalHistory, saveMedicalHistory } from "../services/medicalHistoryService"
import { toast } from "sonner"
import Link from "next/link"
import AnimatedNodes from "@/components/animated-nodes"

// Define the params type
interface PageParams {
  id: string
}

export default function MedicalHistoryPage(props: { params: any }) {
  // Unwrap params safely with type assertion
  const params = React.use(props.params) as PageParams
  const memberId = params.id

  const router = useRouter()
  const [memberName, setMemberName] = useState("Family Member")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [medicalHistoryId, setMedicalHistoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Replace the existing healthConditions state with this:
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Add this list of all available health conditions
  const allHealthConditions = [
    "Diabetes",
    "Hypertension",
    "Asthma",
    "Cancer",
    "Heart Disease",
    "Stroke",
    "Alzheimer's",
    "Arthritis",
    "Depression",
    "Anxiety",
    "ADHD",
    "Allergies",
    "Anemia",
    "Autism",
    "Bronchitis",
    "Chronic Fatigue",
    "Chronic Pain",
    "Cirrhosis",
    "Crohn's Disease",
    "Dementia",
    "Dermatitis",
    "Eczema",
    "Emphysema",
    "Epilepsy",
    "Fibromyalgia",
    "Glaucoma",
    "Gout",
    "Hemophilia",
    "Hepatitis",
    "High Cholesterol",
    "HIV",
    "Hypothyroidism",
    "Hyperthyroidism",
    "IBS",
    "Kidney Disease",
    "Leukemia",
    "Lupus",
    "Lymphoma",
    "Migraines",
    "Multiple Sclerosis",
    "Osteoporosis",
    "Parkinson's",
    "Pneumonia",
    "Psoriasis",
    "PTSD",
    "Rheumatoid Arthritis",
    "Schizophrenia",
    "Sciatica",
    "Scoliosis",
    "Sleep Apnea",
    "Thyroid Disorder",
    "Tuberculosis",
    "Ulcer",
    "Ulcerative Colitis",
  ]

  // Additional medical information
  const [allergies, setAllergies] = useState("")
  const [medications, setMedications] = useState("")
  const [surgeries, setSurgeries] = useState("")
  const [familyHistory, setFamilyHistory] = useState("")
  const [bloodType, setBloodType] = useState("")
  const [immunizations, setImmunizations] = useState("")

  // Fetch member details and medical history
  useEffect(() => {
    const fetchData = async () => {
      setError(null)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/auth/login")
          return
        }

        if (!memberId) {
          setError("Member ID is undefined")
          setLoading(false)
          return
        }

        // Fetch member details
        const memberResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/family-members/${memberId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (memberResponse.ok) {
          const memberData = await memberResponse.json()

          if (memberData.data) {
            setMemberName(`${memberData.data.name} ${memberData.data.surname || ""}`)
          }
        } else {
          if (memberResponse.status === 404) {
            setError("Family member not found")
            setLoading(false)
            return
          } else {
            setError(`Error fetching family member: ${memberResponse.statusText}`)
            setLoading(false)
            return
          }
        }

        try {
          // Fetch medical history if it exists
          const medicalHistory = await getMedicalHistory(token, memberId)

          // In the useEffect, replace the healthConditions update section with:
          if (medicalHistory) {
            setMedicalHistoryId(medicalHistory._id)

            // Convert old format to new format if needed
            if (medicalHistory.healthConditions) {
              if (Array.isArray(medicalHistory.healthConditions)) {
                setSelectedConditions(medicalHistory.healthConditions)
              } else {
                // Convert from old object format to array
                const conditions = Object.entries(medicalHistory.healthConditions)
                  .filter(([_, value]) => value === true)
                  .map(([key, _]) => key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()))
                setSelectedConditions(conditions)
              }
            }

            setAllergies(medicalHistory.allergies || "")
            setMedications(medicalHistory.medications || "")
            setSurgeries(medicalHistory.surgeries || "")
            setFamilyHistory(medicalHistory.familyHistory || "")
            setBloodType(medicalHistory.bloodType || "")
            setImmunizations(medicalHistory.immunizations || "")
          }
          // If no medical history exists yet, we'll use the default empty values
        } catch (historyError: any) {
          if (historyError.message && historyError.message.includes("not found")) {
            // This is okay - no medical history exists yet
            console.log("No medical history exists yet for this family member")
          } else {
            console.error("Error fetching medical history:", historyError)
            // Not setting error here since we can still create a new record
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError(error.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [memberId, router])

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      const condition = searchTerm.trim()
      if (!selectedConditions.includes(condition)) {
        setSelectedConditions((prev) => [...prev, condition])
      }
      setSearchTerm("")
    }
  }

  const handleConditionSelect = (condition: string) => {
    if (!selectedConditions.includes(condition)) {
      setSelectedConditions((prev) => [...prev, condition])
    }
    setSearchTerm("")
  }

  const handleConditionRemove = (conditionToRemove: string) => {
    setSelectedConditions((prev) => prev.filter((condition) => condition !== conditionToRemove))
  }

  const filteredConditions = allHealthConditions.filter(
    (condition) =>
      condition.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedConditions.includes(condition),
  )

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/auth/login")
        return
      }

      // In handleSave, replace the medicalData object with:
      const medicalData = {
        _id: medicalHistoryId,
        familyMemberId: memberId,
        healthConditions: selectedConditions, // Changed from object to array
        allergies,
        medications,
        surgeries,
        familyHistory,
        bloodType,
        immunizations,
      }

      // Save the data
      const result = await saveMedicalHistory(token, medicalData)

      // Update the ID if it's a new record
      if (result && result._id && !medicalHistoryId) {
        setMedicalHistoryId(result._id)
      }

      setSaveSuccess(true)
      toast.success("Medical history saved successfully")

      // Reset success state after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error("Error saving medical history:", error)
      setError(error.message || "Failed to save medical history")
      toast.error(error.message || "Failed to save medical history")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />
      <AnimatedNodes />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between p-6 lg:p-8">
        <Link
          href="/dashboard/health-overview"
          className="group flex items-center gap-3 text-gray-400 hover:text-teal-400 transition-colors"
        >
          <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors">
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="font-medium">Back to Health Overview</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Heart className="h-4 w-4 text-pink-400" />
            <span className="text-sm text-gray-300">Medical History</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative max-w-5xl">
        {/* Member Name Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
            {memberName}
          </h1>
          <p className="text-xl text-gray-300">Medical History Record</p>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64"
          >
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin"></div>
              <div
                className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-r-blue-500/50 animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              ></div>
            </div>
            <p className="text-pink-300 text-lg font-medium">Loading medical data...</p>
            <p className="text-gray-400 text-sm mt-2">Retrieving health information</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/30 backdrop-blur-sm border border-red-700/50 rounded-xl p-8 mb-8 text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg transition-all duration-300 shadow-lg"
            >
              Go Back
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {!medicalHistoryId && (
              <div className="mb-8 bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6 max-w-3xl mx-auto">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">New Medical Record</h3>
                    <p className="text-blue-300">
                      No medical history record exists yet. Fill in the form below and click Save to create a new
                      record.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 overflow-hidden shadow-2xl mb-8">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-500/20 rounded-xl">
                    <Heart className="h-8 w-8 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Health Information</h2>
                    <p className="text-gray-400 text-sm">
                      Record medical conditions and health details for {memberName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Health Conditions Section - Compact */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Stethoscope className="h-4 w-4 text-pink-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Health Conditions</h3>
                  </div>

                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                    {/* Search Bar - Compact */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        placeholder="Search conditions and press Enter..."
                        className="w-full h-10 pl-3 pr-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500/30 focus:border-pink-500 transition-colors text-sm"
                      />

                      {/* Search Suggestions - Compact */}
                      {isSearchFocused && searchTerm && filteredConditions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto">
                          {filteredConditions.slice(0, 6).map((condition, index) => (
                            <button
                              key={index}
                              onClick={() => handleConditionSelect(condition)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-700 text-gray-200 transition-colors text-sm first:rounded-t-lg last:rounded-b-lg"
                            >
                              {condition}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Conditions - Compact */}
                    {selectedConditions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-400">Selected:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedConditions.map((condition, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1.5 bg-pink-500/20 text-pink-200 px-2.5 py-1 rounded-md border border-pink-500/30 text-sm"
                            >
                              <span>{condition}</span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleConditionRemove(condition)
                                }}
                                className="text-pink-300 hover:text-pink-100 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedConditions.length === 0 && (
                      <p className="text-gray-400 text-xs">No conditions selected. Search above to add.</p>
                    )}
                  </div>
                </div>

                {/* Two Column Layout for Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Blood Type */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-500/20 rounded-md">
                        <Droplets className="h-4 w-4 text-red-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Blood Type</h3>
                    </div>
                    <select
                    id="bloodtypeFilter"
                    style={{
                    backgroundColor: "#1f2937",
                    color: "#fff",
                    border: "none",
                    boxShadow: "none",
                    }}
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-colors appearance-none cursor-pointer text-sm"
                    >
                      <option value="">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  {/* Quick Actions or Summary could go here */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-500/20 rounded-md">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Quick Summary</h3>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <p className="text-xs text-gray-400">
                        {selectedConditions.length} condition{selectedConditions.length !== 1 ? "s" : ""} • Blood type:{" "}
                        {bloodType || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compact Text Areas in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Allergies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500/20 rounded-md">
                        <AlertCircle className="h-4 w-4 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Allergies</h3>
                    </div>
                    <textarea
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full rounded-lg bg-gray-800/50 border border-gray-700/50 text-white px-3 py-2 h-20 focus:outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm resize-none"
                      placeholder="Medications, foods, environmental..."
                    />
                  </div>

                  {/* Medications */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/20 rounded-md">
                        <Pill className="h-4 w-4 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Medications</h3>
                    </div>
                    <textarea
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      className="w-full rounded-lg bg-gray-800/50 border border-gray-700/50 text-white px-3 py-2 h-20 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 transition-colors text-sm resize-none"
                      placeholder="Current medications, dosage..."
                    />
                  </div>

                  {/* Surgeries */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-500/20 rounded-md">
                        <Stethoscope className="h-4 w-4 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Surgeries</h3>
                    </div>
                    <textarea
                      value={surgeries}
                      onChange={(e) => setSurgeries(e.target.value)}
                      className="w-full rounded-lg bg-gray-800/50 border border-gray-700/50 text-white px-3 py-2 h-20 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500 transition-colors text-sm resize-none"
                      placeholder="Surgeries, procedures, dates..."
                    />
                  </div>

                  {/* Immunizations */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-500/20 rounded-md">
                        <Syringe className="h-4 w-4 text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Immunizations</h3>
                    </div>
                    <textarea
                      value={immunizations}
                      onChange={(e) => setImmunizations(e.target.value)}
                      className="w-full rounded-lg bg-gray-800/50 border border-gray-700/50 text-white px-3 py-2 h-20 focus:outline-none focus:ring-1 focus:ring-green-500/30 focus:border-green-500 transition-colors text-sm resize-none"
                      placeholder="Vaccines, dates..."
                    />
                  </div>
                </div>

                {/* Family History - Full Width */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-500/20 rounded-md">
                      <FileText className="h-4 w-4 text-teal-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Family Medical History</h3>
                  </div>
                  <textarea
                    value={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.value)}
                    className="w-full rounded-lg bg-gray-800/50 border border-gray-700/50 text-white px-3 py-2 h-20 focus:outline-none focus:ring-1 focus:ring-teal-500/30 focus:border-teal-500 transition-colors text-sm resize-none"
                    placeholder="Relevant family medical conditions and history..."
                  />
                </div>

                {/* Status Messages - Compact */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: saveSuccess ? 1 : 0, y: saveSuccess ? 0 : -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center text-teal-400 bg-teal-500/10 px-4 py-2 rounded-lg border border-teal-500/20"
                >
                  <Check className="h-4 w-4 mr-2" />
                  <span className="text-sm">Medical history saved successfully!</span>
                </motion.div>

                {/* Save Button - Compact */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 text-sm ${
                      saving ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{medicalHistoryId ? "Update" : "Save"} Medical History</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 mb-4 max-w-xl mx-auto">
              <p className="flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Private and secure - only you have access to this data
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}


