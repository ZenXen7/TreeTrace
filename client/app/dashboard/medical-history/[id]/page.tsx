"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import React from "react";
import { getMedicalHistory, saveMedicalHistory, formatHealthConditionsFromAPI } from "../services/medicalHistoryService";
import { toast } from "react-hot-toast";

// Define the params type
interface PageParams {
  id: string;
}

export default function MedicalHistoryPage(props: { params: any }) {
  // Unwrap params safely with type assertion
  const params = React.use(props.params) as PageParams;
  const memberId = params.id;
  
  const router = useRouter();
  const [memberName, setMemberName] = useState("Family Member");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicalHistoryId, setMedicalHistoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    ulcerativeColitis: false
  });
  
  // Additional medical information
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [immunizations, setImmunizations] = useState("");
  
  // Fetch member details and medical history
  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        
        if (!memberId) {
          setError("Member ID is undefined");
          setLoading(false);
          return;
        }
        
        // Fetch member details
        const memberResponse = await fetch(`http://localhost:3001/family-members/${memberId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (memberResponse.ok) {
          const memberData = await memberResponse.json();
          
          if (memberData.data) {
            setMemberName(`${memberData.data.name} ${memberData.data.surname || ""}`);
          }
        } else {
          if (memberResponse.status === 404) {
            setError("Family member not found");
            setLoading(false);
            return;
          } else {
            setError(`Error fetching family member: ${memberResponse.statusText}`);
            setLoading(false);
            return;
          }
        }
        
        try {
          // Fetch medical history if it exists
          const medicalHistory = await getMedicalHistory(token, memberId);
          
          if (medicalHistory) {
            setMedicalHistoryId(medicalHistory._id);
            
            // Process health conditions - convert from Map to object if needed
            const formattedHealthConditions = formatHealthConditionsFromAPI(medicalHistory.healthConditions);
            
            // Update state with existing data
            setHealthConditions(prevState => ({
              ...prevState,
              ...formattedHealthConditions
            }));
            
            setAllergies(medicalHistory.allergies || "");
            setMedications(medicalHistory.medications || "");
            setSurgeries(medicalHistory.surgeries || "");
            setFamilyHistory(medicalHistory.familyHistory || "");
            setBloodType(medicalHistory.bloodType || "");
            setImmunizations(medicalHistory.immunizations || "");
          }
          // If no medical history exists yet, we'll use the default empty values
        } catch (historyError: any) {
          if (historyError.message && historyError.message.includes("not found")) {
            // This is okay - no medical history exists yet
            console.log("No medical history exists yet for this family member");
          } else {
            console.error("Error fetching medical history:", historyError);
            // Not setting error here since we can still create a new record
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [memberId, router]);
  
  const handleConditionChange = (condition: string) => {
    setHealthConditions(prev => ({
      ...prev,
      [condition]: !prev[condition as keyof typeof prev]
    }));
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        return;
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
        immunizations
      };
      
      // Save the data
      const result = await saveMedicalHistory(token, medicalData);
      
      // Update the ID if it's a new record
      if (result && result._id && !medicalHistoryId) {
        setMedicalHistoryId(result._id);
      }
      
      toast.success("Medical history saved successfully");
    } catch (error: any) {
      console.error("Error saving medical history:", error);
      setError(error.message || "Failed to save medical history");
      toast.error(error.message || "Failed to save medical history");
    } finally {
      setSaving(false);
    }
  };
  
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
      
      <div className="container mx-auto px-4 py-8 relative max-w-4xl">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Family Tree</span>
          </button>
        </motion.div>
        
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
            Medical History
          </h1>
          <p className="text-xl text-gray-300 mt-2">{memberName}</p>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-10 w-10 rounded-full border-2 border-t-teal-500 border-teal-500/20 animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 backdrop-blur-sm border border-red-700/50 rounded-xl p-6 mb-8 text-center">
            <p className="text-red-300 text-lg">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {!medicalHistoryId && (
              <div className="mb-4 bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-4">
                <p className="text-blue-300">
                  No medical history record exists yet. Fill in the form below and click Save to create a new record.
                </p>
              </div>
            )}
            
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent uppercase mb-6">
                Medical History
              </h2>
              
              {/* Health Conditions Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-white mb-3">
                  Select all applicable health conditions:
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(healthConditions).map(([condition, checked], index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={condition}
                        checked={checked}
                        onChange={() => handleConditionChange(condition)}
                        className="h-5 w-5 rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
                      />
                      <label htmlFor={condition} className="text-gray-200 capitalize">
                        {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Allergies Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Member have any known allergies? If yes, please list:
                </h3>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 text-white px-4 py-3 h-20 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter any allergies (medications, foods, environmental)..."
                />
              </div>
              
              {/* Medications Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Current medications and supplements:
                </h3>
                <textarea
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 text-white px-4 py-3 h-20 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="List medications, dosage, and frequency..."
                />
              </div>
              
              {/* Surgeries Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Past surgeries or hospitalizations:
                </h3>
                <textarea
                  value={surgeries}
                  onChange={(e) => setSurgeries(e.target.value)}
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 text-white px-4 py-3 h-20 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="List surgeries or procedures with dates if known..."
                />
              </div>
              
              {/* Blood Type Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Blood Type:
                </h3>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 text-white px-4 py-3 focus:ring-teal-500 focus:border-teal-500"
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
              
              {/* Immunizations Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Immunization history:
                </h3>
                <textarea
                  value={immunizations}
                  onChange={(e) => setImmunizations(e.target.value)}
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 text-white px-4 py-3 h-20 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="List vaccines and dates if known..."
                />
              </div>
              
              {/* Family Medical History Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Family medical history notes:
                </h3>
                <textarea
                  value={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.value)}
                  className="w-full rounded-lg bg-gray-700/50 border border-gray-600 text-white px-4 py-3 h-20 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Note any relevant family medical conditions..."
                />
              </div>
              
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white rounded-lg transition-all duration-300 flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-t-white border-white/20 animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>{medicalHistoryId ? 'Update' : 'Create'} Medical History</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 mb-8">
              <p>This information is kept private and secure. Only the current user have access.</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 