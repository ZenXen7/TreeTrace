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
} from "lucide-react"
import React from "react"
import {
  getMedicalHistory,
  saveMedicalHistory,
  formatHealthConditionsFromAPI,
} from "../services/medicalHistoryService";
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

  // Expanded list of health conditions
  const [healthConditions, setHealthConditions] = useState({
    diabetes: false,
    hypertension: false,
    asthma: false,
    cancer: false,
    heartDisease: false,
    stroke: false,
    alzheimers: false,
    arthritis: false,
    depression: false,
    anxiety: false,
    adhd: false,
    allergies: false,
    anemia: false,
    autism: false,
    bronchitis: false,
    chronicFatigue: false,
    chronicPain: false,
    cirrhosis: false,
    crohnsDisease: false,
    dementia: false,
    dermatitis: false,
    eczema: false,
    emphysema: false,
    epilepsy: false,
    fibromyalgia: false,
    glaucoma: false,
    gout: false,
    hemophilia: false,
    hepatitis: false,
    highCholesterol: false,
    hiv: false,
    hypothyroidism: false,
    hyperthyroidism: false,
    ibs: false,
    kidneyDisease: false,
    leukemia: false,
    lupus: false,
    lymphoma: false,
    migraines: false,
    multiplesclerosis: false,
    osteoporosis: false,
    parkinsons: false,
    pneumonia: false,
    psoriasis: false,
    ptsd: false,
    rheumatoidArthritis: false,
    schizophrenia: false,
    sciatica: false,
    scoliosis: false,
    sleepApnea: false,
    thyroidDisorder: false,
    tuberculosis: false,
    ulcer: false,
    ulcerativeColitis: false,
  })

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
        const memberResponse = await fetch(`http://localhost:3001/family-members/${memberId}`, {
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

          if (medicalHistory) {
            setMedicalHistoryId(medicalHistory._id)

            // Process health conditions - convert from Map to object if needed
            const formattedHealthConditions = formatHealthConditionsFromAPI(medicalHistory.healthConditions)

            // Update state with existing data
            setHealthConditions((prevState) => ({
              ...prevState,
              ...formattedHealthConditions,
            }))

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

  const handleConditionChange = (condition: string) => {
    setHealthConditions((prev) => ({
      ...prev,
      [condition]: !prev[condition as keyof typeof prev],
    }))
  }

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

      // Prepare data for submission
      const medicalData = {
        _id: medicalHistoryId, // Will be included for updates, undefined for new records
        familyMemberId: memberId,
        healthConditions,
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
          href="/dashboard/treeview"
          className="group flex items-center gap-3 text-gray-400 hover:text-teal-400 transition-colors"
        >
          <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors">
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="font-medium">Back to Family Tree</span>
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

              <div className="p-8">
                {/* Health Conditions Section */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Health Conditions</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                    {Object.entries(healthConditions).map(([condition, checked], index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={condition}
                          checked={checked}
                          onChange={() => handleConditionChange(condition)}
                          className="h-5 w-5 rounded border-gray-600 text-pink-500 focus:ring-pink-500 bg-gray-700"
                        />
                        <label htmlFor={condition} className="text-gray-200 capitalize">
                          {condition.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blood Type Section */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Droplets className="h-5 w-5 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Blood Type</h3>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors appearance-none cursor-pointer"
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
                </div>

                {/* Allergies Section */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Allergies</h3>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                    <textarea
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 text-white px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                      placeholder="Enter any allergies (medications, foods, environmental)..."
                    />
                  </div>
                </div>

                {/* Medications Section */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Pill className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Current Medications</h3>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                    <textarea
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 text-white px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      placeholder="List medications, dosage, and frequency..."
                    />
                  </div>
                </div>

                {/* Surgeries Section */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Surgeries & Hospitalizations</h3>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                    <textarea
                      value={surgeries}
                      onChange={(e) => setSurgeries(e.target.value)}
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 text-white px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                      placeholder="List surgeries or procedures with dates if known..."
                    />
                  </div>
                </div>

                {/* Immunizations Section */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Syringe className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Immunization History</h3>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                    <textarea
                      value={immunizations}
                      onChange={(e) => setImmunizations(e.target.value)}
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 text-white px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                      placeholder="List vaccines and dates if known..."
                    />
                  </div>
                </div>

                {/* Family Medical History Section */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <FileText className="h-5 w-5 text-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Family Medical History Notes</h3>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                    <textarea
                      value={familyHistory}
                      onChange={(e) => setFamilyHistory(e.target.value)}
                      className="w-full rounded-xl bg-gray-800/50 border border-gray-700/50 text-white px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      placeholder="Note any relevant family medical conditions..."
                    />
                  </div>
                </div>

                {/* Status Messages */}
                <div className="h-16 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: saveSuccess ? 1 : 0, y: saveSuccess ? 0 : -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center text-teal-400 bg-teal-500/10 px-6 py-4 rounded-xl border border-teal-500/20"
                  >
                    <Check className="h-5 w-5 mr-3" />
                    <span>Medical history saved successfully!</span>
                  </motion.div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-8 py-4 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 ${
                      saving ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span>Saved Successfully</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>{medicalHistoryId ? "Update" : "Create"} Medical History</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 mb-8 max-w-2xl mx-auto">
              <p className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                This information is kept private and secure. Only you have access to this medical data.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Add Lock icon import
import { Lock } from "lucide-react"
