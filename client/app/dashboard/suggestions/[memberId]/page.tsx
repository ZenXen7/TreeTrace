"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Calendar, Flag, Briefcase, Info } from "lucide-react";
import { toast } from "react-hot-toast";

interface SuggestionData {
  count: number;
  suggestionCount: number;
  similarMembers: Array<{
    memberId: string;
    name: string;
    similarity: number;
    similarFields: string[];
    userId: string;
    suggestions: string[];
  }>;
  hasMore: boolean;
}

interface MemberData {
  _id: string;
  name: string;
  surname: string;
  gender: string;
  status: string;
  birthDate?: string;
  deathDate?: string;
  country?: string;
  occupation?: string;
  imageUrl?: string;
}

// Helper function for making consistent API calls
async function makeApiCall(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  
  // Set default headers
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers
  };
  
  console.log("Making API call to:", url);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // If not OK, try to parse the error response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      
      let errorMessage = `API error (${response.status})`;
      try {
        // If the response is JSON, extract the message
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Not JSON, use text as is
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

export default function MemberSuggestionsPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [suggestionsData, setSuggestionsData] = useState<SuggestionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        if (!memberId) {
          throw new Error("No member ID provided");
        }
        
        // Process the ID to ensure it's clean
        let cleanMemberId = memberId;
        
        // Remove any encoded template characters if present
        if (cleanMemberId.includes('%7B') || cleanMemberId.includes('%7D')) {
          // This was an encoded template string like {id}
          console.log("Found template string in ID, attempting to use real ID from URL");
          
          // Display error but don't throw yet - in case we are debugging
          setError("Invalid member ID format. Please return to the tree view and try again.");
          
          // Allow the page to show an error instead of just crashing
          throw new Error("Invalid member ID format: " + cleanMemberId);
        }
        
        console.log("Fetching data for member ID:", cleanMemberId);
        
        // Fetch member details
        try {
          const memberResponse = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`);
          setMemberData(memberResponse);
        } catch (memberError) {
          console.error("Failed to fetch member details:", memberError);
          throw new Error(`Failed to fetch member details: ${memberError instanceof Error ? memberError.message : 'Unknown error'}`);
        }
        
        try {
          const suggestionsResult = await makeApiCall(`http://localhost:3001/notifications/member-similarities/${cleanMemberId}`);
          console.log("Suggestions data received:", suggestionsResult);
          setSuggestionsData(suggestionsResult.data);
        } catch (suggestionsError) {
          console.warn("Failed to fetch suggestions (continuing with member data):", suggestionsError);
          // Don't throw here, allow the page to render with just member data
          setSuggestionsData({
            count: 0,
            suggestionCount: 0,
            similarMembers: [],
            hasMore: false
          });
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [memberId, router]);

  const handleApplySuggestion = async (suggestion: string) => {
    // Parse the suggestion and extract the data to update
    let updateData: any = {};
    
    if (suggestion.includes("birth date")) {
      const match = suggestion.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) {
        updateData.birthDate = match[0];
      }
    } else if (suggestion.includes("death date")) {
      const match = suggestion.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) {
        updateData.deathDate = match[0];
      }
    } else if (suggestion.includes("country")) {
      // Improved regex to handle different formats like 'country is "USA"' or '"USA" as country'
      const match = suggestion.match(/country (?:is |as |)"(.*?)"/i) || suggestion.match(/"(.*?)" (?:as |for |)country/i);
      if (match && match[1]) {
        updateData.country = match[1];
      }
    } else if (suggestion.includes("deceased") || suggestion.includes("dead")) {
      updateData.status = "dead";
    } else if (suggestion.includes("alive")) {
      updateData.status = "alive";
    }
    
    console.log("Parsed suggestion into update data:", updateData);
    
    try {
      // Only proceed if we have something to update
      if (Object.keys(updateData).length === 0) {
        toast.error("Couldn't parse the suggestion to apply it");
        return;
      }
      
      // Ensure we have a clean string ID
      const cleanId = typeof memberId === 'object' 
        ? (memberId as any).toString()
        : String(memberId);
      
      console.log(`Sending PATCH request to update member ${cleanId} with data:`, updateData);
      
      const result = await makeApiCall(`http://localhost:3001/family-members/${cleanId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData)
      });
      
      console.log("Update successful, response:", result);
      
      // Handle both result formats to ensure we get the updated member data
      const updatedMember = result.data || result;
      if (updatedMember) {
        setMemberData(updatedMember);
        toast.success("Suggestion applied successfully");
      } else {
        toast.error("Suggestion applied but couldn't refresh member data");
      }
      
      // Refresh suggestions data
      try {
        const suggestionsResult = await makeApiCall(`http://localhost:3001/notifications/member-similarities/${cleanId}`);
        if (suggestionsResult && suggestionsResult.data) {
          setSuggestionsData(suggestionsResult.data);
        }
      } catch (error) {
        console.error("Failed to refresh suggestions after applying:", error);
      }
    } catch (error) {
      console.error("Error applying suggestion:", error);
      toast.error(error instanceof Error ? error.message : "Failed to apply suggestion");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-gray-100 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-gray-100 flex flex-col items-center justify-center p-6">
        <div className="text-red-400 text-xl mb-4">Error: {error}</div>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-gray-100 flex flex-col items-center justify-center p-6">
        <div className="text-gray-400 text-xl mb-4">Member not found</div>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0B1120] text-gray-100"
    >
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/treeview")}
            className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Family Tree</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Member Details Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <div className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-6 text-white">Member Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Name</div>
                      <div className="text-white font-medium">{memberData.name} {memberData.surname}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Birth Date</div>
                      <div className="text-white font-medium">
                        {memberData.birthDate ? new Date(memberData.birthDate).toLocaleDateString() : 'Not specified'}
                      </div>
                    </div>
                  </div>

                  {memberData.deathDate && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Death Date</div>
                        <div className="text-white font-medium">
                          {new Date(memberData.deathDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center">
                      <Info className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Status</div>
                      <div className="text-white font-medium capitalize">{memberData.status}</div>
                    </div>
                  </div>
                  
                  {memberData.country && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center">
                        <Flag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Country</div>
                        <div className="text-white font-medium">{memberData.country}</div>
                      </div>
                    </div>
                  )}
                  
                  {memberData.occupation && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Occupation</div>
                        <div className="text-white font-medium">{memberData.occupation}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Suggestions Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2"
          >
            <div className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
                  <span className="bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center text-sm text-white font-medium">
                    {suggestionsData?.suggestionCount || 0}
                  </span>
                  Suggestions
                </h2>

                {!suggestionsData || suggestionsData.suggestionCount === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="mb-4">No suggestions available for this member</div>
                    <p>Suggestions appear when other users have potentially conflicting or additional information</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestionsData.similarMembers.flatMap((similar, index) => 
                      similar.suggestions.map((suggestion, subIndex) => (
                        <div 
                          key={`${index}-${subIndex}`} 
                          className="p-4 rounded-lg bg-gray-700/50 border border-gray-600/50 hover:border-orange-500/50 transition-colors"
                        >
                          <div className="mb-3 text-gray-300">{suggestion}</div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                              From similar member: <span className="text-orange-400">{similar.name}</span>
                            </div>
                            <button 
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 