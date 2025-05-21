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
    
    const responseData = await response.json();
    
    // Check if the response is in the format {statusCode, message, data}
    // If so, return the data directly for convenience
    if (responseData && 
        typeof responseData === 'object' && 
        'statusCode' in responseData && 
        'data' in responseData && 
        responseData.data !== null && 
        typeof responseData.data === 'object') {
      console.log("API response contains nested data, extracting it");
      return responseData.data;
    }
    
    // Otherwise, return the full response
    return responseData;
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
        
        // Get token for authorization
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        // IMPORTANT: Match the exact approach from treeview/page.tsx
        // Step 1: Fetch basic member data
        const memberResponse = await fetch(`http://localhost:3001/family-members/${cleanMemberId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!memberResponse.ok) {
          throw new Error(`Failed to fetch member: ${memberResponse.status}`);
        }
        
        const memberData = await memberResponse.json();
        console.log("Member data from API:", memberData);
        
        // Extract the actual member data (handle nested response)
        const actualMemberData = memberData.data || memberData;
        
        // Validate member data
        if (!actualMemberData || typeof actualMemberData !== 'object' || !actualMemberData._id) {
          console.error("Invalid member data received:", actualMemberData);
          throw new Error("Invalid member data received from API");
        }
        
        setMemberData(actualMemberData);
        console.log("Set member data:", actualMemberData);
        
        // Step 2: Get processed suggestions
        let processedSuggestions = [];
        try {
          const processedResponse = await fetch(`http://localhost:3001/notifications/processed-suggestions/${cleanMemberId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          
          if (processedResponse.ok) {
            const processedData = await processedResponse.json();
            processedSuggestions = processedData.data || [];
          }
        } catch (err) {
          console.warn(`Error fetching processed suggestions:`, err);
        }
        
        console.log("Processed suggestions:", processedSuggestions);
        setAppliedSuggestions(processedSuggestions);
        
        // Step 3: Get member similarities (suggestions)
        try {
          const suggestionsResponse = await fetch(`http://localhost:3001/notifications/member-similarities/${cleanMemberId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          
          if (!suggestionsResponse.ok) {
            console.warn(`Suggestions API returned ${suggestionsResponse.status}`);
            // Initialize with empty data
            setSuggestionsData({
              count: 0,
              suggestionCount: 0,
              similarMembers: [],
              hasMore: false
            });
          } else {
            // Process normal suggestions response
            const suggestionsData = await suggestionsResponse.json();
            console.log("Suggestions data from API:", suggestionsData);
            
            // Extract data from response
            const actualSuggestionsData = suggestionsData.data;
            
            // Filter out processed suggestions
            if (actualSuggestionsData && actualSuggestionsData.similarMembers) {
              const filteredSimilarMembers = actualSuggestionsData.similarMembers
                .map((similar: any) => ({
                  ...similar,
                  suggestions: similar.suggestions.filter(
                    (suggestion: string) => !processedSuggestions.includes(suggestion)
                  )
                }))
                .filter((similar: any) => similar.suggestions && similar.suggestions.length > 0);
              
              // Count suggestions
              const filteredSuggestionCount = filteredSimilarMembers.reduce(
                (count: number, member: { suggestions: string[] }) => count + member.suggestions.length, 
                0
              );
              
              // Update UI
              setSuggestionsData({
                count: filteredSimilarMembers.length,
                suggestionCount: filteredSuggestionCount,
                similarMembers: filteredSimilarMembers,
                hasMore: false
              });
            } else {
              setSuggestionsData({
                count: 0,
                suggestionCount: 0,
                similarMembers: [],
                hasMore: false
              });
            }
          }
        } catch (err) {
          console.error("Error fetching suggestions:", err);
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
      
      // Ask for confirmation before proceeding with parent addition
      const confirmed = window.confirm(`Do you want to add a father for this family member? This will create a new parent node in your family tree.`);
      
      if (!confirmed) {
        console.log("User declined to add father");
        return;
      }
      
      // Mark this suggestion as special and don't process it like regular field changes
      updateData._specialAction = "addFather";
      
      // Try to extract father's name if available
      const fatherNameMatch = suggestion.match(/adding father "([^"]+)"/i);
      if (fatherNameMatch && fatherNameMatch[1]) {
        updateData._fatherName = fatherNameMatch[1].trim();
        console.log("Extracted father name:", updateData._fatherName);
        
        // Try to extract surname if the name has a format "FirstName Surname"
        const nameParts = updateData._fatherName.split(' ');
        if (nameParts.length > 1) {
          updateData._fatherSurname = nameParts[nameParts.length - 1];
          console.log("Extracted father surname:", updateData._fatherSurname);
        }
      }
      
      // Also try to extract surname directly if available
      const fatherSurnameMatch = suggestion.match(/surname "([^"]+)"/i) || suggestion.match(/with surname "([^"]+)"/i);
      if (fatherSurnameMatch && fatherSurnameMatch[1]) {
        updateData._fatherSurname = fatherSurnameMatch[1].trim();
        console.log("Directly extracted father surname:", updateData._fatherSurname);
      }
      
      // Try different possible formats
      let sourceMemberMatch = suggestion.match(/similar to member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/from member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/source member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member ID: (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member[^\w]+(\w{24})/i); // Match MongoDB ObjectIds
      
      if (sourceMemberMatch && sourceMemberMatch[1]) {
        updateData._sourceMemberId = sourceMemberMatch[1].trim();
        console.log("Extracted source member ID:", updateData._sourceMemberId);
      }
      
    } else if (suggestion.includes("adding mother") || suggestion.includes("Consider adding mother")) {
      console.log("Found mother suggestion:", suggestion);
      
      // Ask for confirmation before proceeding with parent addition
      const confirmed = window.confirm(`Do you want to add a mother for this family member? This will create a new parent node in your family tree.`);
      
      if (!confirmed) {
        console.log("User declined to add mother");
        return;
      }
      
      // Mark this suggestion as special and don't process it like regular field changes
      updateData._specialAction = "addMother";
      
      // Try to extract mother's name if available
      const motherNameMatch = suggestion.match(/adding mother "([^"]+)"/i);
      if (motherNameMatch && motherNameMatch[1]) {
        updateData._motherName = motherNameMatch[1].trim();
        console.log("Extracted mother name:", updateData._motherName);
        
        // Try to extract surname if the name has a format "FirstName Surname"
        const nameParts = updateData._motherName.split(' ');
        if (nameParts.length > 1) {
          updateData._motherSurname = nameParts[nameParts.length - 1];
          console.log("Extracted mother surname:", updateData._motherSurname);
        }
      }
      
      // Try different possible formats to find source member ID
      let sourceMemberMatch = suggestion.match(/similar to member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/from member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/source member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member ID: (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member[^\w]+(\w{24})/i); // Match MongoDB ObjectIds
      
      if (sourceMemberMatch && sourceMemberMatch[1]) {
        updateData._sourceMemberId = sourceMemberMatch[1].trim();
        console.log("Extracted source member ID:", updateData._sourceMemberId);
      }
    } else if (suggestion.includes("adding partner") || suggestion.includes("Consider adding partner")) {
      console.log("Found partner suggestion:", suggestion);
      
      // Ask for confirmation before proceeding with partner addition
      const confirmed = window.confirm(`Do you want to add a partner for this family member? This will create a new partner node in your family tree.`);
      
      if (!confirmed) {
        console.log("User declined to add partner");
        return;
      }
      
      // Mark this suggestion as special and don't process it like regular field changes
      updateData._specialAction = "addPartner";
      
      // Try to extract partner's name if available
      const partnerNameMatch = suggestion.match(/adding partner "([^"]+)"/i);
      if (partnerNameMatch && partnerNameMatch[1]) {
        updateData._partnerName = partnerNameMatch[1].trim();
        console.log("Extracted partner name:", updateData._partnerName);
        
        // Try to extract surname if the name has a format "FirstName Surname"
        const nameParts = updateData._partnerName.split(' ');
        if (nameParts.length > 1) {
          updateData._partnerSurname = nameParts[nameParts.length - 1];
          console.log("Extracted partner surname:", updateData._partnerSurname);
        }
      }
      
      // Try different possible formats to find source member ID
      let sourceMemberMatch = suggestion.match(/similar to member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/from member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/source member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member ID: (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member[^\w]+(\w{24})/i); // Match MongoDB ObjectIds
      
      if (sourceMemberMatch && sourceMemberMatch[1]) {
        updateData._sourceMemberId = sourceMemberMatch[1].trim();
        console.log("Extracted source member ID:", updateData._sourceMemberId);
      }
      
      // Store the partner suggestion in pending changes
      setPendingChanges(prevState => {
        return {
          changes: { 
            ...prevState.changes, 
            "_addPartnerAction": updateData
          },
          sourceSuggestions: [...prevState.sourceSuggestions, suggestion]
        };
      });
      
      // Mark suggestion as applied to update the UI
      setAppliedSuggestions(current => [...current, suggestion]);
      toast.success(`Partner will be added when you apply all changes`);
      return;
    } else if (suggestion.includes("adding child") || suggestion.includes("adding children") || 
               suggestion.includes("more children")) {
      console.log("Found child suggestion:", suggestion);
      
      // Ask for confirmation before proceeding with child addition
      const confirmed = window.confirm(`Do you want to add the suggested children for this family member? This will create new nodes in your family tree.`);
      
      if (!confirmed) {
        console.log("User declined to add children");
        return;
      }
      
      // Try to extract single child name if available
      let childrenNames: string[] = [];
      const childNameMatch = suggestion.match(/adding child "([^"]+)"/i);
      if (childNameMatch && childNameMatch[1]) {
        childrenNames = [childNameMatch[1].trim()];
        console.log("Extracted single child name:", childrenNames);
      }
      
      // Try to extract multiple child names if available
      const childrenNamesMatch = suggestion.match(/adding children "([^"]+)"/i);
      if (childrenNamesMatch && childrenNamesMatch[1]) {
        // Split by ", " pattern if multiple names are in the format "name1", "name2", "name3"
        const rawNames = childrenNamesMatch[1].split('", "');
        childrenNames = rawNames.map(name => name.trim().replace(/"/g, ''));
        console.log("Extracted multiple child names:", childrenNames);
      }
      
      // Extract count if mentioned
      let childrenCount: number | undefined;
      const countMatch = suggestion.match(/adding (\d+) more children/i);
      if (countMatch && countMatch[1]) {
        childrenCount = parseInt(countMatch[1], 10);
        console.log("Extracted children count:", childrenCount);
      }
      
      // Try to extract sample names if available in the "including X and Y and others" format
      const sampleNamesMatch = suggestion.match(/including "([^"]+)" and others/i) || 
                              suggestion.match(/including "([^"]+)", "([^"]+)" and others/i);
      if (sampleNamesMatch) {
        if (sampleNamesMatch[1]) childrenNames.push(sampleNamesMatch[1]);
        if (sampleNamesMatch[2]) childrenNames.push(sampleNamesMatch[2]);
        console.log("Extracted sample child names:", childrenNames);
      }
      
      // Try different possible formats to find source member ID
      let sourceMemberId: string | undefined;
      let sourceMemberMatch = suggestion.match(/similar to member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/from member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/source member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member ID: (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member[^\w]+(\w{24})/i); // Match MongoDB ObjectIds
      
      if (sourceMemberMatch && sourceMemberMatch[1]) {
        sourceMemberId = sourceMemberMatch[1].trim();
        console.log("Extracted source member ID:", sourceMemberId);
      }
      
      // Extract the clean member ID
      const cleanMemberId = typeof memberId === 'object' 
        ? (memberId as any).toString()
        : String(memberId);
        
      // If we have specific child names, create individual pending changes for each child
      if (childrenNames.length > 0) {
        // Create separate pending changes for each child
        for (let i = 0; i < childrenNames.length; i++) {
          const childName = childrenNames[i];
          
          // Store one child per action with a unique key
          // Use a timestamp and random number to ensure uniqueness even across multiple suggestions
          const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${i}`;
          const actionKey = `_addChildAction_${uniqueSuffix}`;
          
          // Get current member ID in a clean format
          const currentMemberId = typeof memberId === 'object' 
            ? (memberId as any).toString()
            : String(memberId);
            
          // Create the action data with proper parent relationships
          const actionData: any = {
            _specialAction: "addChildren",
            _childrenNames: [childName],
            _childrenCount: 1,
            _sourceMemberId: sourceMemberId,
            targetMemberId: currentMemberId,
            _parentId: currentMemberId // Explicitly set parent ID to ensure relationship
          };
          
          // Set appropriate parent fields based on gender
          if (memberData && memberData.gender === "male") {
            actionData.fatherId = currentMemberId;
            // Check if there's a partner to set as the other parent
            if (memberData.partnerId && memberData.partnerId.length > 0) {
              actionData.motherId = memberData.partnerId[0];
            }
          } else if (memberData && memberData.gender === "female") {
            actionData.motherId = currentMemberId;
            // Check if there's a partner to set as the other parent
            if (memberData.partnerId && memberData.partnerId.length > 0) {
              actionData.fatherId = memberData.partnerId[0];
            }
          }
          
          setPendingChanges(prevState => {
            return {
              changes: { 
                ...prevState.changes, 
                [actionKey]: actionData
              },
              sourceSuggestions: [...prevState.sourceSuggestions, suggestion]
            };
          });
        }
        
        toast.success(`${childrenNames.length} children will be added separately when you apply changes`);
      } else {
        // No specific names, use the count only
        const actualCount = childrenCount || 1;
        
        // For unnamed children, create generic placeholders
        for (let i = 0; i < actualCount; i++) {
          const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${i}`;
          const actionKey = `_addChildAction_${uniqueSuffix}`;
          
          // Get current member ID in a clean format
          const currentMemberId = typeof memberId === 'object' 
            ? (memberId as any).toString()
            : String(memberId);
            
          // Create the action data with proper parent relationships
          const actionData: any = {
            _specialAction: "addChildren",
            _childrenNames: [`Child ${i + 1}`],
            _childrenCount: 1,
            _sourceMemberId: sourceMemberId,
            targetMemberId: currentMemberId,
            _parentId: currentMemberId // Explicitly set parent ID to ensure relationship
          };
            
          // Set appropriate parent fields based on gender
          if (memberData && memberData.gender === "male") {
            actionData.fatherId = currentMemberId;
            // Check if there's a partner to set as the other parent
            if (memberData.partnerId && memberData.partnerId.length > 0) {
              actionData.motherId = memberData.partnerId[0];
            }
          } else if (memberData && memberData.gender === "female") {
            actionData.motherId = currentMemberId;
            // Check if there's a partner to set as the other parent
            if (memberData.partnerId && memberData.partnerId.length > 0) {
              actionData.fatherId = memberData.partnerId[0];
            }
          }
          
          setPendingChanges(prevState => {
            return {
              changes: { 
                ...prevState.changes, 
                [actionKey]: actionData
              },
              sourceSuggestions: [...prevState.sourceSuggestions, suggestion]
            };
          });
        }
        
        toast.success(`${actualCount} children will be added when you apply changes`);
      }
      
      // Mark suggestion as applied to update the UI
      setAppliedSuggestions(current => [...current, suggestion]);
      return;
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
        
        // Get the clean member ID for API calls
        const cleanMemberId = typeof memberId === 'object' 
          ? (memberId as any).toString()
          : String(memberId);
        
        console.log("Working with member ID:", cleanMemberId);
        
        // ALWAYS fetch fresh data to ensure we have the latest
        console.log("Fetching fresh member data...");
        let validMemberData: MemberData;
        
        try {
          const freshMemberResponse = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`);
          console.log("API returned response:", freshMemberResponse);
          
          // Extract the actual member data from the response structure
          // The API returns { statusCode, message, data } where data is the actual member object
          let actualMemberData;
          
          // Check if we have a nested response structure
          if (freshMemberResponse && typeof freshMemberResponse === 'object') {
            if (freshMemberResponse.data && typeof freshMemberResponse.data === 'object') {
              console.log("Extracting member data from nested response");
              actualMemberData = freshMemberResponse.data;
            } else {
              // If not nested, assume the response itself is the member data
              actualMemberData = freshMemberResponse;
            }
          }
          
          console.log("Extracted member object:", actualMemberData);
          
          // Validate that we have a proper object with _id
          if (!actualMemberData || typeof actualMemberData !== 'object' || !actualMemberData._id) {
            console.error("API returned invalid member data:", actualMemberData);
            toast.error("Could not retrieve valid member data");
            return;
          }
          
          // Update component state with fresh data
          setMemberData(actualMemberData);
          validMemberData = actualMemberData;
        } catch (fetchError) {
          console.error("Failed to fetch member data:", fetchError);
          toast.error("Failed to get member data");
          return;
        }
        
        console.log("Using validated member data:", validMemberData);
        console.log("Adding parent from suggestion:", updateData);
        
        // Double-check that we have a valid ID before proceeding
        if (!validMemberData._id) {
          console.error("Member data is missing ID:", validMemberData);
          toast.error("Cannot add parent: Missing member ID");
          return;
        }
        
        // Store the parent suggestion in pending changes instead of applying immediately
        const relation = updateData._specialAction === "addFather" ? "father" : "mother";
        
        // Prepare data for the new parent
        const parentData: {
          name: string;
          surname: string;
          gender: string;
          status: string;
          country: string;
          occupation: string;
          birthDate?: string;
          deathDate?: string;
        } = {
          name: updateData._specialAction === "addFather" 
            ? (updateData._fatherName || "Unknown")
            : (updateData._motherName || "Unknown"),
          surname: updateData._specialAction === "addFather"
            ? (updateData._fatherSurname || validMemberData.surname || "Unknown")
            : (updateData._motherSurname || validMemberData.surname || "Unknown"),
          gender: updateData._specialAction === "addFather" ? "male" : "female",
          status: "alive",
          country: validMemberData.country || "",
          occupation: ""
        };
        
        // Try to get additional details from source member if available
        if (updateData._sourceMemberId) {
          try {
            console.log(`Fetching details from source member ${updateData._sourceMemberId}`);
            const sourceResponse = await makeApiCall(`http://localhost:3001/family-members/${updateData._sourceMemberId}`);
            
            if (sourceResponse && (sourceResponse.data || sourceResponse)) {
              const sourceData = sourceResponse.data || sourceResponse;
              console.log("Found source member data:", sourceData);
              
              // Use source member's surname instead of child's surname
              if (sourceData.surname) parentData.surname = sourceData.surname;
              
              // Copy relevant fields if they exist
              if (sourceData.birthDate) parentData.birthDate = sourceData.birthDate;
              if (sourceData.deathDate) parentData.deathDate = sourceData.deathDate;
              if (sourceData.status) parentData.status = sourceData.status;
              if (sourceData.country) parentData.country = sourceData.country;
              if (sourceData.occupation) parentData.occupation = sourceData.occupation;
            }
          } catch (sourceError) {
            console.warn("Could not fetch source member data:", sourceError);
            // Continue with the basic data we have
          }
        }
        
        // Create a serializable version of the parent data for pending changes
        const pendingParentAddition = {
          _specialAction: updateData._specialAction,
          parentData: parentData,
          targetMemberId: validMemberData._id
        };
        
        // Store previous data for comparison
        prevMemberDataRef.current = memberData ? { ...memberData } : null;
        
        // Add to pending changes, merging with any existing pending changes
        setPendingChanges(prev => {
          const newChanges = { ...prev.changes };
          
          // Add the parent addition action to pending changes
          // Use a unique key so it won't conflict with other changes
          const actionKey = updateData._specialAction === "addFather" ? "_addFatherAction" : "_addMotherAction";
          newChanges[actionKey] = pendingParentAddition;
          
          return {
            changes: newChanges,
            sourceSuggestions: [...prev.sourceSuggestions, suggestion],
          };
        });
        
        // Store the suggestion text to filter it out from the UI first
        setAppliedSuggestions(prev => [...prev, suggestion]);
        
        // Update the UI to indicate the pending change
        const displayName = relation === "father" ? "Father" : "Mother";
        const displayValue = parentData.name + " " + parentData.surname;
        
        toast.success(`${displayName} "${displayValue}" will be added after saving changes`);
        
        return;
        
      } catch (error) {
        console.error("Error preparing parent addition:", error);
        toast.error(`Failed to prepare parent addition: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    } else if (updateData._specialAction === "addPartner") {
      // Handle partner addition
      // First ensure we have valid member data
      if (!memberData) {
        toast.error("Cannot add partner: Missing member data");
        return;
      }
      
      // Determine relation based on gender
      const partnerGender = memberData.gender === 'male' ? 'female' : 'male';
      const relation = partnerGender === 'male' ? 'husband' : 'wife';
      
      // Prepare data for the new partner
      const partnerData = {
        name: updateData._partnerName || "Unknown",
        surname: updateData._partnerSurname || memberData.surname || "Unknown",
        gender: partnerGender,
        status: "alive",
        country: memberData.country || "",
        occupation: ""
      };
      
      // Create a synthetic node for the member
      const syntheticNode = {
        id: memberData._id,
        _id: memberData._id,
        name: memberData.name,
        gender: memberData.gender || "unknown",
        fid: memberData.fatherId || null,
        mid: memberData.motherId || null,
        pids: memberData.partnerId || []
      };
      
      // Create a refresh function for the handleAddMember call
      const refreshFunction = async () => {
        try {
          // Re-fetch the member data
          const refreshedMemberData = await makeApiCall(`http://localhost:3001/family-members/${memberData._id}`);
          setMemberData(refreshedMemberData);
        } catch (refreshError) {
          console.error("Error refreshing member data:", refreshError);
        }
      };
      
      // Import the handler function on demand
      try {
        setLoading(true);
        // Dynamically import the service
        const { handleAddMember } = await import("../../treeview/service/familyService");
        
        // Call the handler to add the partner
        console.log(`Adding ${relation} with data:`, partnerData);
        const result = await handleAddMember(
          localStorage.getItem("token") || "", 
          syntheticNode, 
          relation, 
          refreshFunction, 
          partnerData
        );
        
        console.log(`Partner addition result:`, result);
        
        // Mark suggestion as processed in the backend as well
        if (memberId) {
          const cleanMemberId = typeof memberId === 'object' 
            ? (memberId as any).toString()
            : String(memberId);
            
          await markSuggestionAsProcessed(cleanMemberId, suggestion);
        }
        
        toast.success(`Added partner "${partnerData.name}"`);
        
        // Set flag in sessionStorage to indicate tree should refresh
        sessionStorage.setItem('treeNeedsRefresh', 'true');
      } catch (error) {
        console.error("Error adding partner:", error);
        toast.error(`Failed to add partner: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
      
      return;
    } else if (updateData._specialAction === "addChildren") {
      // Handle adding children
      console.log("Adding children from suggestion:", updateData);
      
      // First ensure we have valid member data
      if (!memberData) {
        toast.error("Cannot add children: Missing member data");
        return;
      }
      
      // Create a synthetic node for the member
      const syntheticNode = {
        id: memberData._id,
        _id: memberData._id,
        name: memberData.name,
        gender: memberData.gender || "unknown",
        fid: memberData.fatherId || null,
        mid: memberData.motherId || null,
        pids: memberData.partnerId || []
      };
      
      // Create a refresh function for the handleAddMember call
      const refreshFunction = async () => {
        try {
          // Re-fetch the member data
          const refreshedMemberData = await makeApiCall(`http://localhost:3001/family-members/${memberData._id}`);
          setMemberData(refreshedMemberData);
        } catch (refreshError) {
          console.error("Error refreshing member data:", refreshError);
        }
      };
      
      try {
        // Import the handler function on demand
        const { handleAddMember } = await import("../../treeview/service/familyService");
        
        const childrenNames = updateData._childrenNames || [];
        const childrenCount = updateData._childrenCount || childrenNames.length || 1;
        
        // Add each child one by one
        for (let i = 0; i < childrenCount; i++) {
          const childName = i < childrenNames.length 
            ? childrenNames[i] 
            : `Child ${i + 1}`;
          
          // Determine gender from child name
          const childGender = determineGenderFromName(childName);
          const relation = childGender === "male" ? "son" : "daughter";
          
          // Get current member ID in a clean format
          const currentMemberId = typeof memberId === 'object' 
            ? (memberId as any).toString()
            : String(memberId);
            
          // Create basic child data with type declaration to handle dynamic properties
          const childData: any = {
            name: childName,
            surname: memberData.surname || "",
            gender: childGender,
            status: "alive",
            country: memberData.country || "",
            occupation: "",
            _parentId: currentMemberId // Explicitly set parent ID to establish relationship
          };
          
          // Check if there's a partner to set as the other parent
          const hasPartner = syntheticNode.pids && syntheticNode.pids.length > 0;
          
          // Set appropriate parent fields based on gender
          if (syntheticNode.gender === "male") {
            childData.fatherId = currentMemberId;
            if (hasPartner) {
              childData.motherId = syntheticNode.pids[0];
            }
          } else if (syntheticNode.gender === "female") {
            childData.motherId = currentMemberId;
            if (hasPartner) {
              childData.fatherId = syntheticNode.pids[0];
            }
          }
          
          console.log(`Adding child ${i + 1}/${childrenCount} with relation ${relation}:`, childData);
          
          try {
            // Call the handler to add the child
            await handleAddMember(
              localStorage.getItem("token") || "", 
              syntheticNode, 
              relation, 
              refreshFunction, 
              childData
            );
            
            // Since we now handle children individually, we don't need pauses between them
            // unless it's the legacy bundled format
            if (i < childrenCount - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (childError) {
            console.error(`Error adding child ${i + 1}:`, childError);
            toast.error(`Failed to add child ${childName}: ${childError instanceof Error ? childError.message : 'Unknown error'}`);
          }
        }
        
        console.log(`Finished adding ${childrenCount} children`);
        
        // Final refresh of data
        await refreshFunction();
        
        // Show success message
        if (childrenCount === 1) {
          const childName = childrenNames.length > 0 ? childrenNames[0] : "Child";
          toast.success(`Added child: ${childName}`);
        } else {
          toast.success(`Added ${childrenCount} children`);
        }
      } catch (error) {
        console.error("Error adding children:", error);
        toast.error(`Failed to add children: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      return;
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
      })).filter(similar => similar.suggestions.length > 0);
      
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
      
      // Handle special actions separately
      const regularChanges: Record<string, any> = {};
      const specialActions: Array<{action: string, data: any}> = [];
      
      for (const [key, value] of Object.entries(pendingChanges.changes)) {
        if (key === "_addFatherAction" || 
            key === "_addMotherAction" || 
            key === "_addChildrenAction" || 
            key.startsWith("_addChildAction_") || 
            key === "_addPartnerAction") {
          specialActions.push({action: key, data: value});
        } else {
          regularChanges[key] = value;
        }
      }
      
      // First apply regular changes if any
      if (Object.keys(regularChanges).length > 0) {
        console.log(`Sending PATCH request to update member ${cleanMemberId} with data:`, regularChanges);
        
        const result = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`, {
          method: "PATCH",
          body: JSON.stringify(regularChanges)
        });
        
        console.log("Update successful, response:", result);
      }
      
      // Then handle special actions (parent additions or child additions)
      if (specialActions.length > 0) {
        // Import the handler function on demand
        const { handleAddMember } = await import("../../treeview/service/familyService");
        
        for (const action of specialActions) {
          try {
            console.log(`Processing special action:`, action);
            
            // Create synthetic node representing the target member
            const syntheticNode = {
              id: cleanMemberId,
              _id: cleanMemberId,
              name: memberData.name,
              gender: memberData.gender || "unknown",
              fid: memberData.fatherId || null,
              mid: memberData.motherId || null,
              pids: memberData.partnerId || []
            };
            
            // Create a refresh function for the handleAddMember call
            const refreshFunction = async () => {
              try {
                // Re-fetch the member data
                const refreshedMemberData = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`);
                setMemberData(refreshedMemberData);
              } catch (refreshError) {
                console.error("Error refreshing member data:", refreshError);
              }
            };
            
            if (action.data._specialAction === "addFather" || action.data._specialAction === "addMother") {
              // Handle parent addition
              // Determine relation
              const relation = action.data._specialAction === "addFather" ? "father" : "mother";
              
              // Call the handler to add the parent
              console.log(`Adding ${relation} with data:`, action.data.parentData);
              const result = await handleAddMember(
                localStorage.getItem("token") || "", 
                syntheticNode, 
                relation, 
                refreshFunction, 
                action.data.parentData
              );
              
              console.log(`${relation} addition result:`, result);
            } 
            else if (action.data._specialAction === "addPartner") {
              // Handle partner addition
              // First ensure we have valid member data
              if (!memberData) {
                toast.error("Cannot add partner: Missing member data");
                return;
              }
              
              // Determine relation based on gender
              const partnerGender = memberData.gender === 'male' ? 'female' : 'male';
              const relation = partnerGender === 'male' ? 'husband' : 'wife';
              
              // Prepare data for the new partner
              const partnerData = {
                name: action.data._partnerName || "Unknown",
                surname: action.data._partnerSurname || memberData.surname || "Unknown",
                gender: partnerGender,
                status: "alive",
                country: memberData.country || "",
                occupation: ""
              };
              
              // Call the handler to add the partner
              console.log(`Adding ${relation} with data:`, partnerData);
              const result = await handleAddMember(
                localStorage.getItem("token") || "", 
                syntheticNode, 
                relation, 
                refreshFunction, 
                partnerData
              );
              
              console.log(`Partner addition result:`, result);
              toast.success(`Added partner "${partnerData.name}"`);
            }
            else if (action.data._specialAction === "addChildren") {
              // Handle adding children
              console.log("Adding children from suggestion:", action.data);
              
              const childrenNames = action.data._childrenNames || [];
              const childrenCount = action.data._childrenCount || childrenNames.length || 1;
              
              // Add each child one by one
              for (let i = 0; i < childrenCount; i++) {
                const childName = i < childrenNames.length 
                  ? childrenNames[i] 
                  : `Child ${i + 1}`;
                
                // Determine gender from child name
                const childGender = determineGenderFromName(childName);
                const relation = childGender === "male" ? "son" : "daughter";
                
                // Create basic child data
                const childData = {
                  name: childName,
                  surname: memberData.surname || "",
                  gender: childGender,
                  status: "alive",
                  country: memberData.country || "",
                  occupation: "",
                  _parentId: cleanMemberId, // Explicitly set parent ID to establish relationship
                  // Also set proper MongoDB parent fields based on gender
                  fatherId: syntheticNode.gender === "male" ? cleanMemberId : undefined,
                  motherId: syntheticNode.gender === "female" ? cleanMemberId : undefined
                };
                

                
                try {
                  // Call the handler to add the child
                  await handleAddMember(
                    localStorage.getItem("token") || "", 
                    syntheticNode, 
                    relation, 
                    refreshFunction, 
                    childData
                  );
                  
                  // Since we now handle children individually, we don't need pauses between them
                  // unless it's the legacy bundled format
                  if (action.action === "_addChildrenAction" && i < childrenCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                } catch (childError) {
                  console.error(`Error adding child ${i + 1}:`, childError);
                  toast.error(`Failed to add child ${childName}: ${childError instanceof Error ? childError.message : 'Unknown error'}`);
                }
              }
              

              
              // Final refresh of data
              await refreshFunction();
              
              // Show success message
              if (childrenCount === 1) {
                const childName = childrenNames.length > 0 ? childrenNames[0] : "Child";
                toast.success(`Added child: ${childName}`);
              } else {
                toast.success(`Added ${childrenCount} children`);
              }
            }
          } catch (actionError) {
            console.error(`Error processing action:`, actionError);
            toast.error(`Failed to add family member: ${actionError instanceof Error ? actionError.message : 'Unknown error'}`);
          }
        }
      }
      
      // Mark all applied suggestions as processed in the database
      if (pendingChanges.sourceSuggestions.length > 0) {

        
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
      // Get token for authorization
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      // Check if this is a child suggestion (to also mark it for the partner)
      const isChildSuggestion = suggestionText.includes("adding child") || 
                               suggestionText.includes("adding children") ||
                               suggestionText.match(/child "[^"]+"/i);
      
      // Mark as processed for the current member
      const response = await fetch(`http://localhost:3001/notifications/mark-suggestion-processed`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          memberId,
          suggestionText
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark suggestion as processed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // If this is a child suggestion and the member has a partner, also mark it as processed for the partner
      if (isChildSuggestion && memberData && memberData.partnerId && memberData.partnerId.length > 0) {
        try {
          // Extract the child name from the suggestion
          let childName = "";
          const childNameMatch = suggestionText.match(/child "([^"]+)"/i);
          if (childNameMatch && childNameMatch[1]) {
            childName = childNameMatch[1].trim();
          }
          
          // For each partner, find and mark similar suggestions as processed
          for (const partnerId of memberData.partnerId) {
            // If we have a child name, we should find the exact matching suggestion for the partner
            if (childName) {
              // Make an API call to get partner's suggestions
              const partnerSuggestions = await makeApiCall(`http://localhost:3001/notifications/member-similarities/${partnerId}`);
              
              if (partnerSuggestions && partnerSuggestions.similarMembers) {
                // Look for matching child suggestions
                for (const similar of partnerSuggestions.similarMembers) {
                  if (similar.suggestions) {
                    for (const partnerSuggestion of similar.suggestions) {
                      // Check if this suggestion mentions the same child
                      if (partnerSuggestion.includes(childName) && 
                          (partnerSuggestion.includes("adding child") || partnerSuggestion.includes("adding children"))) {
                        // Mark this suggestion as processed for the partner
                        await fetch(`http://localhost:3001/notifications/mark-suggestion-processed`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            memberId: partnerId,
                            suggestionText: partnerSuggestion
                          })
                        });
                      }
                    }
                  }
                }
              }
            } else {
              // If we don't have a specific child name, mark the original suggestion as processed for the partner
              await fetch(`http://localhost:3001/notifications/mark-suggestion-processed`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  memberId: partnerId,
                  suggestionText: suggestionText
                })
              });
            }
          }
        } catch (partnerError) {
          console.error("Error marking suggestion as processed for partner:", partnerError);
          // Don't throw this error to avoid breaking the main flow
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error marking suggestion as processed:", error);
      return false;
    }
  };

  const SuggestionCard = ({ similarMember }: { similarMember: any }) => {
    // Add debugging logs
    console.log("Rendering SuggestionCard with:", {
      memberName: similarMember.name,
      suggestionsCount: similarMember.suggestions?.length || 0,
      appliedSuggestionsCount: appliedSuggestions.length
    });
    
    // Don't render if no suggestions
    if (!similarMember.suggestions || similarMember.suggestions.length === 0) {
      console.log("Skipping card - no suggestions");
      return null;
    }
    
    // Filter out any suggestions that have already been applied
    const filteredSuggestions = similarMember.suggestions.filter(
      (suggestion: string) => !appliedSuggestions.includes(suggestion)
    );
    
    console.log("Filtered suggestions count:", filteredSuggestions.length);
    
    // Don't render if all suggestions have been applied
    if (filteredSuggestions.length === 0) {
      console.log("Skipping card - all suggestions applied");
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

  // Helper function to determine gender from child name
  const determineGenderFromName = (name: string): "male" | "female" => {
    // Check for explicit gender in name
    if (name.toLowerCase().includes("son") && !name.toLowerCase().includes("daughter")) {
      return "male";
    }
    if (name.toLowerCase().includes("daughter")) {
      return "female";
    }
    
    // For names with clear gender indicators
    const maleNamePatterns = ["miko", "kyle son", "mika son"];
    const femaleNamePatterns = ["mika daughter", "kyla", "kyle daughter"];
    
    const lowerName = name.toLowerCase();
    
    // Check against known patterns
    for (const pattern of maleNamePatterns) {
      if (lowerName.includes(pattern)) {
        return "male";
      }
    }
    
    for (const pattern of femaleNamePatterns) {
      if (lowerName.includes(pattern)) {
        return "female";
      }
    }
    
    // Default to random assignment if no patterns match
    return Math.random() > 0.5 ? "male" : "female";
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
                    {Object.entries(pendingChanges.changes).map(([field, value]) => {
                      // Handle special actions for adding parents
                      if (field === "_addFatherAction") {
                        const parentData = (value as any).parentData;
                        return (
                          <div key={field} className="flex justify-between items-center p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/30">
                            <div>
                              <div className="text-sm text-yellow-200/70">Add Father</div>
                              <div className="text-yellow-100">
                                {parentData.name} {parentData.surname}
                              </div>
                            </div>
                          </div>
                        );
                      } 
                      else if (field === "_addMotherAction") {
                        const parentData = (value as any).parentData;
                        return (
                          <div key={field} className="flex justify-between items-center p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/30">
                            <div>
                              <div className="text-sm text-yellow-200/70">Add Mother</div>
                              <div className="text-yellow-100">
                                {parentData.name} {parentData.surname}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      else if (field === "_addPartnerAction") {
                        const partnerData = (value as any);
                        return (
                          <div key={field} className="flex justify-between items-center p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/30">
                            <div>
                              <div className="text-sm text-yellow-200/70">Add Partner</div>
                              <div className="text-yellow-100">
                                {partnerData._partnerName} {partnerData._partnerSurname || ''}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      // Handle both legacy _addChildrenAction and new individual child actions
                      else if (field === "_addChildrenAction" || field.startsWith("_addChildAction_")) {
                        const childrenData = (value as any);
                        return (
                          <div key={field} className="flex justify-between items-center p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/30">
                            <div>
                              <div className="text-sm text-yellow-200/70">Add Child</div>
                              <div className="text-yellow-100">
                                {childrenData._childrenNames && childrenData._childrenNames.length > 0 
                                  ? childrenData._childrenNames[0]
                                  : `Child`}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      // Regular field changes
                      else {
                        return (
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
                        );
                      }
                    })}
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
                    
                    // Log data for debugging
                    console.log("Rendering suggestions section with data:", {
                      similarMembersLength: suggestionsData.similarMembers.length,
                      suggestionCount: suggestionsData.suggestionCount,
                      appliedSuggestions
                    });
                    
                    // Modified condition to check if we have similarMembers with actual suggestions after filtering
                    const hasSimilarMembers = suggestionsData.similarMembers.some(similar => 
                      similar.suggestions && similar.suggestions.filter(
                        suggestion => !appliedSuggestions.includes(suggestion)
                      ).length > 0
                    );
                    
                    if (!hasSimilarMembers) {
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