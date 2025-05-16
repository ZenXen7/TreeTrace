"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  fatherId?: string;
  motherId?: string;
  partnerId?: string[];
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
  
  // New state for pending changes
  const [pendingChanges, setPendingChanges] = useState<{
    changes: Record<string, any>;
    sourceSuggestions: string[];
  }>({
    changes: {},
    sourceSuggestions: []
  });
  
  // Track which suggestions have been applied
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  
  // Flag to indicate if there are pending changes
  const hasPendingChanges = Object.keys(pendingChanges.changes).length > 0;
  
  // Store previous values to detect changes
  const prevMemberDataRef = useRef<MemberData | null>(null);
  
  // Track which fields have been updated
  const [updatedFields, setUpdatedFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        if (!memberId) {
          throw new Error("No member ID provided");
        }
        
        // Ensure we have a clean string ID
        const cleanMemberId = typeof memberId === 'object' 
          ? (memberId as any).toString()
          : String(memberId);
        
        console.log("Fetching data for member ID:", cleanMemberId);
        
        // Fetch member data, suggestions, and processed suggestions in parallel
        const [memberResponse, suggestionsResult, processedSuggestionsResult] = await Promise.all([
          makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`),
          makeApiCall(`http://localhost:3001/notifications/member-similarities/${cleanMemberId}`),
          makeApiCall(`http://localhost:3001/notifications/processed-suggestions/${cleanMemberId}`)
        ]);
        
        console.log("Member data:", memberResponse);
        console.log("Suggestions data:", suggestionsResult);
        console.log("Processed suggestions:", processedSuggestionsResult);
        
        setMemberData(memberResponse);
        
        // Add processed suggestions to our local state
        if (processedSuggestionsResult && processedSuggestionsResult.data) {
          setAppliedSuggestions(processedSuggestionsResult.data);
        }
        
        // Filter out already applied suggestions
        if (suggestionsResult && suggestionsResult.data) {
          // Get all processed suggestions to filter out
          const processedSuggestions = processedSuggestionsResult && processedSuggestionsResult.data 
            ? processedSuggestionsResult.data 
            : [];
            
          // Combine with local applied suggestions
          const allAppliedSuggestions = [...appliedSuggestions, ...processedSuggestions];
          
          // Filter out any suggestions that were already applied
          const filteredSimilarMembers = suggestionsResult.data.similarMembers.map((similar: any) => ({
            ...similar,
            suggestions: similar.suggestions.filter(
              (suggestion: string) => !allAppliedSuggestions.includes(suggestion)
            )
          })).filter((similar: any) => similar.suggestions.length > 0);
          
          // Update suggestion counts
          const filteredSuggestionCount = filteredSimilarMembers.reduce(
            (count: number, member: { suggestions: string[] }) => count + member.suggestions.length, 0
          );
          
          // Update the suggestions data state
          setSuggestionsData({
            ...suggestionsResult.data,
            similarMembers: filteredSimilarMembers,
            suggestionCount: filteredSuggestionCount,
            count: filteredSimilarMembers.length
          });
        } else {
          setSuggestionsData(suggestionsResult.data);
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

  // Effect to detect changes in member data and highlight recently changed fields
  useEffect(() => {
    if (!memberData || !prevMemberDataRef.current) {
      prevMemberDataRef.current = memberData;
      return;
    }
    
    const changedFields: Record<string, boolean> = {};
    
    // Compare current and previous values
    Object.keys(memberData).forEach(key => {
      if (key in prevMemberDataRef.current! && 
          JSON.stringify(memberData[key as keyof MemberData]) !== 
          JSON.stringify(prevMemberDataRef.current![key as keyof MemberData])) {
        changedFields[key] = true;
      }
    });
    
    // Set updated fields
    if (Object.keys(changedFields).length > 0) {
      setUpdatedFields(changedFields);
      
      // Clear highlighting after 2 seconds
      const timer = setTimeout(() => {
        setUpdatedFields({});
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // Update the ref for next comparison
    prevMemberDataRef.current = memberData;
  }, [memberData]);

  // Modified to stage changes instead of applying them immediately
  const handleApplySuggestion = async (suggestion: string) => {
    // Parse the suggestion and extract the data to update
    let updateData: any = {};
    
    console.log("Parsing suggestion:", suggestion);
    
    if (suggestion.includes("birth date")) {
      console.log("Found birth date suggestion:", suggestion);
      
      // Handle "Birth date may be X (recorded by another user) instead of Y" pattern
      let birthDateMatch = suggestion.match(/Birth date may be ([^(]+) \(recorded by another user\) instead of/i);
      if (birthDateMatch && birthDateMatch[1]) {
        updateData.birthDate = birthDateMatch[1].trim();
        console.log("Extracted birth date from 'may be' format:", updateData.birthDate);
      }
      // Handle "Consider updating birth date from X to Y" pattern
      else if (suggestion.includes("Consider updating birth date from")) {
        const updateMatch = suggestion.match(/Consider updating birth date from [^ ]+ to ([^ ]+)/i);
        if (updateMatch && updateMatch[1]) {
          updateData.birthDate = updateMatch[1].trim();
          console.log("Extracted birth date from 'updating from/to' format:", updateData.birthDate);
        }
      }
      // Handle "Consider adding birth date (X)" pattern
      else if (suggestion.includes("Consider adding birth date")) {
        const addMatch = suggestion.match(/Consider adding birth date \(([^)]+)\)/i);
        if (addMatch && addMatch[1]) {
          updateData.birthDate = addMatch[1].trim();
          console.log("Extracted birth date from 'adding' format:", updateData.birthDate);
        }
      }
      // Handle "Confirm birth date X" pattern
      else if (suggestion.includes("Confirm birth date")) {
        const confirmMatch = suggestion.match(/Confirm birth date ([^ ]+)/i);
        if (confirmMatch && confirmMatch[1]) {
          updateData.birthDate = confirmMatch[1].trim();
          console.log("Extracted birth date from 'confirm' format:", updateData.birthDate);
        }
      }
      // Fallback to looking for any date pattern
      else {
        const match = suggestion.match(/(\d{4}-\d{2}-\d{2})/);
        if (match) {
          updateData.birthDate = match[0];
          console.log("Extracted birth date from generic pattern:", updateData.birthDate);
        }
      }
    } else if (suggestion.includes("death date")) {
      console.log("Found death date suggestion:", suggestion);
      
      // Handle "Death date may be X (recorded by another user) instead of Y" pattern
      let deathDateMatch = suggestion.match(/Death date may be ([^(]+) \(recorded by another user\) instead of/i);
      if (deathDateMatch && deathDateMatch[1]) {
        updateData.deathDate = deathDateMatch[1].trim();
        console.log("Extracted death date from 'may be' format:", updateData.deathDate);
      }
      // Handle "Consider updating death date from X to Y" pattern
      else if (suggestion.includes("Consider updating death date from")) {
        const updateMatch = suggestion.match(/Consider updating death date from [^ ]+ to ([^ ]+)/i);
        if (updateMatch && updateMatch[1]) {
          updateData.deathDate = updateMatch[1].trim();
          console.log("Extracted death date from 'updating from/to' format:", updateData.deathDate);
        }
      }
      // Handle "Consider adding death date (X)" pattern
      else if (suggestion.includes("Consider adding death date")) {
        const addMatch = suggestion.match(/Consider adding death date \(([^)]+)\)/i);
        if (addMatch && addMatch[1]) {
          updateData.deathDate = addMatch[1].trim();
          console.log("Extracted death date from 'adding' format:", updateData.deathDate);
        }
      }
      // Handle "Confirm death date X" pattern
      else if (suggestion.includes("Confirm death date")) {
        const confirmMatch = suggestion.match(/Confirm death date ([^ ]+)/i);
        if (confirmMatch && confirmMatch[1]) {
          updateData.deathDate = confirmMatch[1].trim();
          console.log("Extracted death date from 'confirm' format:", updateData.deathDate);
        }
      }
      // Fallback to looking for any date pattern
      else {
        const match = suggestion.match(/(\d{4}-\d{2}-\d{2})/);
        if (match) {
          updateData.deathDate = match[0];
          console.log("Extracted death date from generic pattern:", updateData.deathDate);
        }
      }
    } else if (suggestion.includes("country")) {
      console.log("Found country suggestion:", suggestion);
      
      // Improved regex to handle different formats of country suggestions
      // First try to match "Country may be X (recorded by another user) instead of Y" pattern
      let countryMatch = suggestion.match(/Country may be ([^(]+) \(recorded by another user\) instead of/i);
      if (countryMatch && countryMatch[1]) {
        updateData.country = countryMatch[1].trim();
        console.log("Extracted country from 'may be' format:", updateData.country);
      } 
      // Try "Consider updating country to X" pattern
      else if (suggestion.includes("Consider updating country to")) {
        const updateMatch = suggestion.match(/Consider updating country to "([^"]+)"/i);
        if (updateMatch && updateMatch[1]) {
          updateData.country = updateMatch[1].trim();
          console.log("Extracted country from 'updating to' format:", updateData.country);
        }
      }
      // Try "Consider updating country from X to Y" pattern
      else if (suggestion.includes("Consider updating country from")) {
        const updateFromMatch = suggestion.match(/Consider updating country from "([^"]+)" to "([^"]+)"/i);
        if (updateFromMatch && updateFromMatch[2]) {
          updateData.country = updateFromMatch[2].trim();
          console.log("Extracted country from 'updating from/to' format:", updateData.country);
        }
      }
      // Try "Consider adding country X" pattern
      else if (suggestion.includes("Consider adding country")) {
        const addMatch = suggestion.match(/Consider adding country "([^"]+)"/i);
        if (addMatch && addMatch[1]) {
          updateData.country = addMatch[1].trim();
          console.log("Extracted country from 'adding' format:", updateData.country);
        }
      }
      // Try "Confirm country X" pattern
      else if (suggestion.includes("Confirm country")) {
        const confirmMatch = suggestion.match(/Confirm country "([^"]+)"/i);
        if (confirmMatch && confirmMatch[1]) {
          updateData.country = confirmMatch[1].trim();
          console.log("Extracted country from 'confirm' format:", updateData.country);
        }
      }
      // Try other patterns
      else {
        const countryRegex = /country "([^"]+)"|"([^"]+)" country|country from "([^"]+)"|country to "([^"]+)"|adding country "([^"]+)"|country ([A-Za-z]+)/i;
        const match = suggestion.match(countryRegex);
        
        console.log("Country regex match:", match);
        
        if (match) {
          // Find the first non-undefined group which contains the country
          const country = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
          if (country) {
            updateData.country = country;
            console.log("Extracted country:", updateData.country);
          } else {
            console.log("No country value found in match groups");
          }
        } else {
          console.log("Country regex didn't match the suggestion");
        }
      }
    } else if (suggestion.includes("dead") || suggestion.includes("deceased")) {
      console.log("Found status suggestion (dead):", suggestion);
      
      // Handle different patterns for dead/deceased status
      if (suggestion.includes("Consider updating status to") || 
          suggestion.includes("This family member may be") ||
          suggestion.includes("Confirm dead status")) {
        updateData.status = "dead";
        console.log("Setting status to dead");
      }
    } else if (suggestion.includes("alive")) {
      console.log("Found status suggestion (alive):", suggestion);
      
      // Handle different patterns for alive status
      if (suggestion.includes("Verify status") || 
          suggestion.includes("recorded as alive")) {
        updateData.status = "alive";
        console.log("Setting status to alive");
      }
    } else if (suggestion.includes("Consider adding father") || suggestion.includes("adding father")) {
      console.log("Found father suggestion:", suggestion);
      
      // Mark this suggestion as special and don't process it like regular field changes
      updateData._specialAction = "addFather";
      
      // Try to extract father's name if available
      const fatherNameMatch = suggestion.match(/adding father "([^"]+)"/i);
      if (fatherNameMatch && fatherNameMatch[1]) {
        updateData._fatherName = fatherNameMatch[1].trim();
        console.log("Extracted father name:", updateData._fatherName);
      }
      
    } else if (suggestion.includes("Consider adding mother") || suggestion.includes("adding mother")) {
      console.log("Found mother suggestion:", suggestion);
      
      // Mark this suggestion as special and don't process it like regular field changes
      updateData._specialAction = "addMother";
      
      // Try to extract mother's name if available
      const motherNameMatch = suggestion.match(/adding mother "([^"]+)"/i);
      if (motherNameMatch && motherNameMatch[1]) {
        updateData._motherName = motherNameMatch[1].trim();
        console.log("Extracted mother name:", updateData._motherName);
      }
    }
    
    // Only proceed if we have something to update
    if (Object.keys(updateData).length === 0) {
      toast.error("Couldn't parse the suggestion to apply it");
      return;
    }
    
    // Handle special parent addition actions immediately
    if (updateData._specialAction === "addFather" || updateData._specialAction === "addMother") {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        if (!memberData) {
          throw new Error("Member data not available");
        }
        
        // Create a synthetic node that mimics the FamilyTree node structure
        const syntheticNode = {
          id: memberData._id,
          gender: memberData.gender,
          fid: memberData.fatherId,
          mid: memberData.motherId,
          pids: memberData.partnerId || []
        };
        
        const relation = updateData._specialAction === "addFather" ? "father" : "mother";
        
        // Prepare data for the new parent
        const parentData = {
          name: updateData._specialAction === "addFather" 
            ? (updateData._fatherName || "Unknown")
            : (updateData._motherName || "Unknown"),
          surname: memberData.surname || "Unknown",
          gender: updateData._specialAction === "addFather" ? "male" : "female",
          status: "alive"
        };
        
        // Import the handler function
        const { handleAddMember } = await import("../../treeview/service/familyService");
        
        // Call the handler function to add the parent
        await handleAddMember(token, syntheticNode, relation, async () => {
          // Refresh data after parent is added
          try {
            setLoading(true);
            setError(null);
            
            // Ensure we have a clean string ID
            const cleanMemberId = typeof memberId === 'object' 
              ? (memberId as any).toString()
              : String(memberId);
            
            // Fetch member data, suggestions, and processed suggestions in parallel
            const [memberResponse, suggestionsResult, processedSuggestionsResult] = await Promise.all([
              makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`),
              makeApiCall(`http://localhost:3001/notifications/member-similarities/${cleanMemberId}`),
              makeApiCall(`http://localhost:3001/notifications/processed-suggestions/${cleanMemberId}`)
            ]);
            
            setMemberData(memberResponse);
            
            // Add processed suggestions to our local state
            if (processedSuggestionsResult && processedSuggestionsResult.data) {
              setAppliedSuggestions(processedSuggestionsResult.data);
            }
            
            // Filter out already applied suggestions
            if (suggestionsResult && suggestionsResult.data) {
              // Get all processed suggestions to filter out
              const processedSuggestions = processedSuggestionsResult && processedSuggestionsResult.data 
                ? processedSuggestionsResult.data 
                : [];
                
              // Combine with local applied suggestions
              const allAppliedSuggestions = [...appliedSuggestions, ...processedSuggestions];
              
              // Filter out any suggestions that were already applied
              const filteredSimilarMembers = suggestionsResult.data.similarMembers.map((similar: any) => ({
                ...similar,
                suggestions: similar.suggestions.filter(
                  (suggestion: string) => !allAppliedSuggestions.includes(suggestion)
                )
              })).filter((similar: any) => similar.suggestions.length > 0);
              
              // Update suggestion counts
              const filteredSuggestionCount = filteredSimilarMembers.reduce(
                (count: number, member: { suggestions: string[] }) => count + member.suggestions.length, 0
              );
              
              // Update the suggestions data state
              setSuggestionsData({
                ...suggestionsResult.data,
                similarMembers: filteredSimilarMembers,
                suggestionCount: filteredSuggestionCount,
                count: filteredSimilarMembers.length
              });
            } else {
              setSuggestionsData(suggestionsResult.data);
            }
          } catch (error) {
            console.error("Error refreshing data after adding parent:", error);
            setError(error instanceof Error ? error.message : "An unknown error occurred");
          } finally {
            setLoading(false);
          }
        }, parentData);
        
        // Mark the suggestion as processed
        await markSuggestionAsProcessed(memberId, suggestion);
        
        toast.success(`${relation === "father" ? "Father" : "Mother"} added successfully!`);
        
        // Return early as we've already handled this suggestion
        return;
      } catch (error) {
        console.error("Error adding parent:", error);
        toast.error(`Failed to add ${updateData._specialAction === "addFather" ? "father" : "mother"}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    }
    
    // Format any dates for display
    if (updateData.birthDate) {
      try {
        // Ensure the date is in the correct format
        const parsedDate = new Date(updateData.birthDate);
        updateData.birthDate = parsedDate.toISOString().split('T')[0];
        console.log("Formatted birth date:", updateData.birthDate);
      } catch (error) {
        console.error("Error formatting birth date:", error);
      }
    }
    
    if (updateData.deathDate) {
      try {
        // Ensure the date is in the correct format
        const parsedDate = new Date(updateData.deathDate);
        updateData.deathDate = parsedDate.toISOString().split('T')[0];
        console.log("Formatted death date:", updateData.deathDate);
      } catch (error) {
        console.error("Error formatting death date:", error);
      }
    }
    
    console.log("Adding to pending changes:", updateData);
    
    // Save previous data for comparison
    prevMemberDataRef.current = memberData ? { ...memberData } : null;
    
    // Add to pending changes, merging with any existing pending changes
    setPendingChanges(prev => {
      const newChanges = { ...prev.changes };
      
      // Merge the updateData with existing pending changes
      for (const key in updateData) {
        newChanges[key] = updateData[key];
      }
      
      return {
        changes: newChanges,
        sourceSuggestions: [...prev.sourceSuggestions, suggestion],
      };
    });
    
    // Store the suggestion text to filter it out from the UI first
    setAppliedSuggestions(prev => [...prev, suggestion]);
    
    // Update suggestions UI by filtering out the applied suggestion
    if (suggestionsData) {
      const updatedSimilarMembers = suggestionsData.similarMembers.map((similar: any) => ({
        ...similar,
        suggestions: similar.suggestions.filter((s: string) => s !== suggestion)
      })).filter((similar: any) => similar.suggestions.length > 0);
      
      const updatedSuggestionCount = updatedSimilarMembers.reduce(
        (count: number, member: any) => count + member.suggestions.length, 0
      );
      
      setSuggestionsData({
        ...suggestionsData,
        similarMembers: updatedSimilarMembers,
        suggestionCount: updatedSuggestionCount,
        count: updatedSimilarMembers.length
      });
    }
    
    // Update the UI to reflect the pending change LAST, so animation is triggered
    if (memberData) {
      // Create a new object with the updated member data
      const updatedMemberData = {
        ...memberData,
        ...updateData
      };
      
      console.log("Previous member data:", prevMemberDataRef.current);
      console.log("Updating member data in UI:", updatedMemberData);
      
      // Identify which fields are being updated
      const fieldsBeingUpdated: Record<string, boolean> = {};
      Object.keys(updateData).forEach(key => {
        fieldsBeingUpdated[key] = true;
      });
      
      // Set updated fields first
      setUpdatedFields(fieldsBeingUpdated);
      
      // Then update the actual data
      setMemberData(updatedMemberData);
      
      // Schedule removal of highlighting
      setTimeout(() => {
        setUpdatedFields({});
      }, 2000);
    }
    
    toast.success("Suggestion applied");
    
    // Mark the suggestion as processed in the backend as well
    if (memberId) {
      const cleanMemberId = typeof memberId === 'object' 
        ? (memberId as any).toString()
        : String(memberId);
        
      await markSuggestionAsProcessed(cleanMemberId, suggestion);
    }
  };
  
  // Function to apply all pending changes
  const applyPendingChanges = async () => {
    if (!hasPendingChanges || !memberData) return;
    
    try {
      setLoading(true);
      
      // Ensure we have a clean string ID
      const cleanMemberId = typeof memberId === 'object' 
        ? (memberId as any).toString()
        : String(memberId);
      
      console.log(`Sending PATCH request to update member ${cleanMemberId} with data:`, pendingChanges.changes);
      
      const result = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`, {
        method: "PATCH",
        body: JSON.stringify(pendingChanges.changes)
      });
      
      console.log("Update successful, response:", result);
      
      // Handle both result formats to ensure we get the updated member data
      const updatedMember = result.data || result;
      
      // Mark all applied suggestions as processed in the database
      if (pendingChanges.sourceSuggestions.length > 0) {
        console.log("Marking suggestions as processed:", pendingChanges.sourceSuggestions);
        
        for (const suggestion of pendingChanges.sourceSuggestions) {
          await markSuggestionAsProcessed(cleanMemberId, suggestion);
        }
      }
      
      // Clear pending changes regardless of whether marking succeeded
      setPendingChanges({
        changes: {},
        sourceSuggestions: []
      });
      
      // Explicitly fetch the latest member data to ensure we have the most up-to-date information
      const refreshedMemberData = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`);
      console.log("Refreshed member data:", refreshedMemberData);
      
      // Update the member data with the refreshed data
      setMemberData(refreshedMemberData);
      
      toast.success("All changes applied successfully");
      
      // Set flag in sessionStorage to indicate tree should refresh
      sessionStorage.setItem('treeNeedsRefresh', 'true');
      
      // If there are no more suggestions, set suggestionsData to empty state
      if (suggestionsData && suggestionsData.similarMembers.length === 0) {
        setSuggestionsData({
          count: 0,
          suggestionCount: 0,
          similarMembers: [],
          hasMore: false
        });
      }
      
      // Also refresh the suggestions data
      try {
        const refreshedSuggestions = await makeApiCall(`http://localhost:3001/notifications/member-similarities/${cleanMemberId}`);
        const processedSuggestions = await makeApiCall(`http://localhost:3001/notifications/processed-suggestions/${cleanMemberId}`);
        
        if (refreshedSuggestions && refreshedSuggestions.data && processedSuggestions && processedSuggestions.data) {
          // Filter out processed suggestions
          const allProcessedSuggestions = processedSuggestions.data;
          
          const filteredSimilarMembers = refreshedSuggestions.data.similarMembers.map((similar: any) => ({
            ...similar,
            suggestions: similar.suggestions.filter(
              (suggestion: string) => !allProcessedSuggestions.includes(suggestion)
            )
          })).filter((similar: any) => similar.suggestions.length > 0);
          
          // Update suggestion counts
          const filteredSuggestionCount = filteredSimilarMembers.reduce(
            (count: number, member: any) => count + member.suggestions.length, 0
          );
          
          // Update the suggestions data state
          setSuggestionsData({
            ...refreshedSuggestions.data,
            similarMembers: filteredSimilarMembers,
            suggestionCount: filteredSuggestionCount,
            count: filteredSimilarMembers.length
          });
        }
      } catch (error) {
        console.error("Error refreshing suggestions:", error);
      }
      
    } catch (error) {
      console.error("Error applying changes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to apply changes");
    } finally {
      setLoading(false);
    }
  };
  
  // Function to cancel all pending changes
  const cancelPendingChanges = async () => {
    // Store the suggestions that need to be restored
    const suggestionsToRestore = [...pendingChanges.sourceSuggestions];
    
    // Clear pending changes
    setPendingChanges({
      changes: {},
      sourceSuggestions: []
    });
    
    // Revert member data to its original state by re-fetching it
    if (memberId) {
      try {
        const cleanMemberId = typeof memberId === 'object' 
          ? (memberId as any).toString()
          : String(memberId);
          
        const memberResponse = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`);
        setMemberData(memberResponse);
      } catch (error) {
        console.error("Failed to refresh member data after canceling:", error);
      }
    }
    
    // If there are suggestions to restore, refresh the suggestions data
    if (suggestionsToRestore.length > 0 && memberId) {
      try {
        const cleanMemberId = typeof memberId === 'object' 
          ? (memberId as any).toString()
          : String(memberId);
          
        const suggestionsResult = await makeApiCall(`http://localhost:3001/notifications/member-similarities/${cleanMemberId}`);
        if (suggestionsResult && suggestionsResult.data) {
          setSuggestionsData(suggestionsResult.data);
        }
      } catch (error) {
        console.error("Failed to refresh suggestions after canceling:", error);
      }
    }
    
    toast.success("Pending changes canceled");
  };
  
  // Helper to format field names for display
  const formatFieldName = (field: string): string => {
    switch (field) {
      case 'birthDate': return 'Birth Date';
      case 'deathDate': return 'Death Date';
      case 'status': return 'Status';
      default: return field.charAt(0).toUpperCase() + field.slice(1);
    }
  };
  
  // Helper to format field values for display
  const formatFieldValue = (field: string, value: any): string => {
    switch (field) {
      case 'birthDate':
      case 'deathDate':
        return new Date(value).toLocaleDateString();
      default:
        return value?.toString() || '';
    }
  };

  // Function to mark a suggestion as processed
  const markSuggestionAsProcessed = async (memberId: string, suggestionText: string) => {
    try {
      console.log(`Marking suggestion as processed: "${suggestionText}"`);
      
      const result = await makeApiCall(`http://localhost:3001/notifications/mark-suggestion-processed`, {
        method: "POST",
        body: JSON.stringify({
          memberId,
          suggestionText
        })
      });
      
      console.log("Suggestion marked as processed:", result);
      return true;
    } catch (error) {
      console.error("Error marking suggestion as processed:", error);
      return false;
    }
  };

  const SuggestionCard = ({ similarMember }: { similarMember: any }) => {
    // Don't render if no suggestions
    if (!similarMember.suggestions || similarMember.suggestions.length === 0) {
      return null;
    }
    
    // Filter out any suggestions that have already been applied
    const filteredSuggestions = similarMember.suggestions.filter(
      (suggestion: string) => !appliedSuggestions.includes(suggestion)
    );
    
    // Don't render if all suggestions have been applied
    if (filteredSuggestions.length === 0) {
      return null;
    }
    
    return (
      <div className="bg-gray-800/70 rounded-lg border border-gray-700/50 p-5 mb-4">
        <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
          <span className="flex-grow">Suggestions from similar member</span>
          <span className="text-sm bg-gray-700 rounded-full px-3 py-1 text-gray-300">
            {filteredSuggestions.length} suggestion{filteredSuggestions.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <div className="text-sm text-gray-400 mb-3">
          Source: {similarMember.name || 'Unknown'}
          {similarMember.similarity && (
            <span className="ml-2">
              ({Math.round(similarMember.similarity * 100)}% similarity)
            </span>
          )}
        </div>
        <div className="space-y-3">
          {filteredSuggestions.map((suggestion: string, idx: number) => (
            <div key={idx} className="flex items-start space-x-2 bg-gray-700/50 rounded-lg p-3 border border-gray-600/30">
              <div className="flex-grow">
                <p className="text-gray-300">{suggestion}</p>
              </div>
              <button
                onClick={() => handleApplySuggestion(suggestion)}
                className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition-colors text-sm flex-shrink-0"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add this function to help format dates consistently
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return as is if it's not a valid date
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return as is if there's an error
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
            onClick={() => {
              // Set flag to refresh tree when returning
              if (pendingChanges.sourceSuggestions.length > 0) {
                sessionStorage.setItem('treeNeedsRefresh', 'true');
              }
              router.push("/dashboard/treeview");
            }}
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
                      <motion.div 
                        className={`text-white font-medium ${updatedFields.name || updatedFields.surname ? 'bg-emerald-800/30 px-2 py-1 rounded' : ''}`}
                        animate={{ 
                          backgroundColor: updatedFields.name || updatedFields.surname ? 'rgba(6, 95, 70, 0.3)' : 'rgba(0, 0, 0, 0)',
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {memberData.name || 'Unknown'} {memberData.surname || ''}
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Birth Date</div>
                      <motion.div 
                        className={`text-white font-medium ${updatedFields.birthDate ? 'bg-emerald-800/30 px-2 py-1 rounded' : ''}`}
                        animate={{ 
                          backgroundColor: updatedFields.birthDate ? 'rgba(6, 95, 70, 0.3)' : 'rgba(0, 0, 0, 0)',
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {memberData.birthDate ? formatDate(memberData.birthDate) : 'Not specified'}
                      </motion.div>
                    </div>
                  </div>

                  {memberData.deathDate && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Death Date</div>
                        <motion.div 
                          className={`text-white font-medium ${updatedFields.deathDate ? 'bg-emerald-800/30 px-2 py-1 rounded' : ''}`}
                          animate={{ 
                            backgroundColor: updatedFields.deathDate ? 'rgba(6, 95, 70, 0.3)' : 'rgba(0, 0, 0, 0)',
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          {formatDate(memberData.deathDate)}
                        </motion.div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center">
                      <Info className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Status</div>
                      <motion.div 
                        className={`text-white font-medium capitalize ${updatedFields.status ? 'bg-emerald-800/30 px-2 py-1 rounded' : ''}`}
                        animate={{ 
                          backgroundColor: updatedFields.status ? 'rgba(6, 95, 70, 0.3)' : 'rgba(0, 0, 0, 0)',
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {memberData.status || 'Unknown'}
                      </motion.div>
                    </div>
                  </div>
                  
                  {(memberData.country || pendingChanges.changes.country) && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center">
                        <Flag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Country</div>
                        <motion.div 
                          className={`text-white font-medium ${updatedFields.country ? 'bg-emerald-800/30 px-2 py-1 rounded' : ''}`}
                          animate={{ 
                            backgroundColor: updatedFields.country ? 'rgba(6, 95, 70, 0.3)' : 'rgba(0, 0, 0, 0)',
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          {memberData.country || 'Not specified'}
                        </motion.div>
                      </div>
                    </div>
                  )}
                  
                  {(memberData.occupation || pendingChanges.changes.occupation) && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Occupation</div>
                        <motion.div 
                          className={`text-white font-medium ${updatedFields.occupation ? 'bg-emerald-800/30 px-2 py-1 rounded' : ''}`}
                          animate={{ 
                            backgroundColor: updatedFields.occupation ? 'rgba(6, 95, 70, 0.3)' : 'rgba(0, 0, 0, 0)',
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          {memberData.occupation || 'Not specified'}
                        </motion.div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Pending Changes Card */}
            {hasPendingChanges && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl bg-yellow-900/20 backdrop-blur-sm border border-yellow-700/30 overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-yellow-300 flex items-center">
                    <span className="mr-2">Pending Changes</span>
                    <span className="bg-yellow-700/70 text-yellow-100 text-xs rounded-full px-2 py-1">
                      {Object.keys(pendingChanges.changes).length}
                    </span>
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    {Object.entries(pendingChanges.changes).map(([field, value]) => (
                      <div key={field} className="flex justify-between items-center p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/30">
                        <div>
                          <div className="text-sm text-yellow-200/70">{formatFieldName(field)}</div>
                          <div className="text-yellow-100">
                            {field === 'birthDate' || field === 'deathDate' 
                              ? formatDate(value as string)
                              : value?.toString() || ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={applyPendingChanges}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={cancelPendingChanges}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
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
                  {(() => {
                    // Calculate suggestion count directly from the current data
                    let displayCount = 0;
                    if (suggestionsData && suggestionsData.similarMembers) {
                      // Count all suggestions that haven't been applied
                      displayCount = suggestionsData.similarMembers.reduce(
                        (count, member) => count + member.suggestions.filter(
                          suggestion => !appliedSuggestions.includes(suggestion)
                        ).length,
                        0
                      );
                    }
                    
                    console.log("Calculated suggestion count:", displayCount);
                    console.log("Applied suggestions:", appliedSuggestions);
                    console.log("Suggestion data:", suggestionsData);
                    
                    return (
                      <span className="bg-orange-500 text-white rounded-full min-w-10 h-10 flex items-center justify-center text-base font-bold px-3 border-2 border-white shadow-lg">
                        {displayCount}
                      </span>
                    );
                  })()}
                  Suggestions
                </h2>

                <div className="space-y-4">
                  {(() => {
                    if (!suggestionsData || !suggestionsData.similarMembers) {
                      return (
                        <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600/50">
                          <p className="text-gray-300">No suggestions available</p>
                        </div>
                      );
                    }
                    
                    if (suggestionsData.similarMembers.length === 0 || 
                        suggestionsData.suggestionCount === 0) {
                      return (
                        <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600/50">
                          <p className="text-gray-300">No suggestions available for this member</p>
                        </div>
                      );
                    }
                    
                    // Count suggestions that haven't been applied yet
                    const availableSuggestions = suggestionsData.similarMembers.flatMap(similar => 
                      similar.suggestions.filter(suggestion => !appliedSuggestions.includes(suggestion))
                    );
                    
                    if (availableSuggestions.length === 0) {
                      return (
                        <div className="p-4 rounded-lg bg-green-900/30 border border-green-700/50">
                          <p className="text-green-300">All suggestions have been applied!</p>
                        </div>
                      );
                    }
                    
                    // Return the actual component rendering
                    return suggestionsData.similarMembers.map((similar, index) => (
                      <SuggestionCard key={index} similarMember={similar} />
                    ));
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 