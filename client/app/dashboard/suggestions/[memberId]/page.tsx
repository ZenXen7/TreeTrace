"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Calendar, Flag, Briefcase, Info, TreePine, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import AnimatedNodes from "@/components/animated-nodes";

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
  childId?: string[];
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
  

  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // If not OK, try to parse the error response
    if (!response.ok) {
      const errorText = await response.text();
      
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
      return responseData.data;
    }
    
    // Otherwise, return the full response
    return responseData;
  } catch (error) {
    throw error;
  }
}

// Helper function to fetch gender from source member
const fetchGenderFromSourceMember = async (sourceMemberId: string): Promise<string | undefined> => {
  if (!sourceMemberId) return undefined;
  
  try {
    const token = localStorage.getItem("token");
    if (!token) return undefined;
    
    const sourceResponse = await fetch(`http://localhost:3001/family-members/${sourceMemberId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });
    
    if (sourceResponse.ok) {
      const sourceData = await sourceResponse.json();
      const sourceMember = sourceData.data || sourceData;
      if (sourceMember && sourceMember.gender) {
        // Always normalize gender to "male" or "female"
        return sourceMember.gender.toLowerCase() === "male" ? "male" : "female";
      }
    }
  } catch (err) {
    // Could not fetch source member for gender
  }
  
  return undefined;
};

export default function MemberSuggestionsPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  // State for the component
  const [memberData, setMemberData] = useState<any>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  const [suggestionsData, setSuggestionsData] = useState<{
    count: number;
    suggestionCount: number;
    similarMembers: any[];
    hasMore: boolean;
  }>({
    count: 0,
    suggestionCount: 0,
    similarMembers: [],
    hasMore: false
  });
  const [pendingChanges, setPendingChanges] = useState<{
    changes: Record<string, any>;
    sourceSuggestions: string[];
  }>({
    changes: {},
    sourceSuggestions: []
  });
  const [partnerInfo, setPartnerInfo] = useState<{name: string, id: string}[]>([]);
  const [childInfo, setChildInfo] = useState<{name: string, id: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track which fields have been updated
  const [updatedFields, setUpdatedFields] = useState<Record<string, boolean>>({});
  
  // Store previous values to detect changes
  const prevMemberDataRef = useRef<MemberData | null>(null);

  // Flag to indicate if there are pending changes
  const hasPendingChanges = Object.keys(pendingChanges.changes).length > 0;

  useEffect(() => {
    async function fetchData() {
      if (!memberId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        // Fetch member data
        const response = await makeApiCall(`http://localhost:3001/family-members/${memberId}`);
        
        const extractedMember = response?.data || response;
        
        // Validate member data structure
        if (!extractedMember || !extractedMember._id) {
          throw new Error("Invalid member data structure received from API");
        }
        
        setMemberData(extractedMember);
        
        // Fetch partner information if the member has partners
        if (extractedMember.partnerId && extractedMember.partnerId.length > 0) {
          try {
            const partnerPromises = extractedMember.partnerId.map(async (partnerId: string) => {
              const partnerResponse = await fetch(`http://localhost:3001/family-members/${partnerId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              });
              
              if (partnerResponse.ok) {
                const partnerData = await partnerResponse.json();
                const partner = partnerData.data || partnerData;
                return {
                  id: partnerId,
                  name: partner.name || "Unknown Partner"
                };
              }
              return { id: partnerId, name: "Unknown Partner" };
            });
            
            const partnerInfo = await Promise.all(partnerPromises);
            setPartnerInfo(partnerInfo);
            
            // Fetch child information
            let childrenInfo: { name: string; id: string }[] = [];
            if (extractedMember.childId && extractedMember.childId.length > 0) {
              
              const childPromises = extractedMember.childId.map(async (childId: string) => {
                const childResponse = await makeApiCall(`http://localhost:3001/family-members/${childId}`);
                return {
                  id: childId,
                  name: childResponse?.name || "Unknown Child"
                };
              });
              
              childrenInfo = await Promise.all(childPromises);
              setChildInfo(childrenInfo);
            } else {
              setChildInfo([]);
            }
          } catch (err) {
            // Error fetching partner information
          }
        }
        
        // Step 2: Get processed suggestions
        let processedSuggestions = [];
        try {
          const processedResponse = await fetch(`http://localhost:3001/notifications/processed-suggestions/${memberId}`, {
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

        }
        
        setAppliedSuggestions(processedSuggestions);
        
        // Step 3: Get member similarities (suggestions)
        try {
          const suggestionsResponse = await fetch(`http://localhost:3001/notifications/member-similarities/${memberId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          
          if (!suggestionsResponse.ok) {

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
          setSuggestionsData({
            count: 0,
            suggestionCount: 0,
            similarMembers: [],
            hasMore: false
          });
        }
      } catch (error) {
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
    
    if (suggestion.includes("birth date")) {
      
      // Handle "Birth date may be X (recorded by another user) instead of Y" pattern
      let birthDateMatch = suggestion.match(/Birth date may be ([^(]+) \(recorded by another user\) instead of/i);
      if (birthDateMatch && birthDateMatch[1]) {
        updateData.birthDate = birthDateMatch[1].trim();
      }
      // Handle "Consider updating birth date from X to Y" pattern
      else if (suggestion.includes("Consider updating birth date from")) {
        const updateMatch = suggestion.match(/Consider updating birth date from [^ ]+ to ([^ ]+)/i);
        if (updateMatch && updateMatch[1]) {
          updateData.birthDate = updateMatch[1].trim();
        }
      }
      // Handle "Consider adding birth date (X)" pattern
      else if (suggestion.includes("Consider adding birth date")) {
        const addMatch = suggestion.match(/Consider adding birth date \(([^)]+)\)/i);
        if (addMatch && addMatch[1]) {
          updateData.birthDate = addMatch[1].trim();
        }
      }
      // Handle "Confirm birth date X" pattern
      else if (suggestion.includes("Confirm birth date")) {
        const confirmMatch = suggestion.match(/Confirm birth date ([^ ]+)/i);
        if (confirmMatch && confirmMatch[1]) {
          updateData.birthDate = confirmMatch[1].trim();
        }
      }
      // Fallback to looking for any date pattern
      else {
        const match = suggestion.match(/(\d{4}-\d{2}-\d{2})/);
        if (match) {
          updateData.birthDate = match[0];
        }
      }
    } else if (suggestion.includes("death date")) {
      
      // Handle "Death date may be X (recorded by another user) instead of Y" pattern
      let deathDateMatch = suggestion.match(/Death date may be ([^(]+) \(recorded by another user\) instead of/i);
      if (deathDateMatch && deathDateMatch[1]) {
        updateData.deathDate = deathDateMatch[1].trim();
        updateData.status = "dead"; // Set status to dead when death date is provided
      }
      // Handle "Consider updating death date from X to Y" pattern
      else if (suggestion.includes("Consider updating death date from")) {
        const updateMatch = suggestion.match(/Consider updating death date from [^ ]+ to ([^ ]+)/i);
        if (updateMatch && updateMatch[1]) {
          updateData.deathDate = updateMatch[1].trim();
          updateData.status = "dead"; // Set status to dead when death date is provided
        }
      }
      // Handle "Consider adding death date (X)" pattern
      else if (suggestion.includes("Consider adding death date")) {
        const addMatch = suggestion.match(/Consider adding death date \(([^)]+)\)/i);
        if (addMatch && addMatch[1]) {
          updateData.deathDate = addMatch[1].trim();
          updateData.status = "dead"; // Set status to dead when death date is provided
        }
      }
      // Handle "Confirm death date X" pattern
      else if (suggestion.includes("Confirm death date")) {
        const confirmMatch = suggestion.match(/Confirm death date ([^ ]+)/i);
        if (confirmMatch && confirmMatch[1]) {
          updateData.deathDate = confirmMatch[1].trim();
          updateData.status = "dead"; // Set status to dead when death date is provided
        }
      }
      // Fallback to looking for any date pattern
      else {
        const match = suggestion.match(/(\d{4}-\d{2}-\d{2})/);
        if (match) {
          updateData.deathDate = match[0];
          updateData.status = "dead"; // Set status to dead when death date is provided
        }
      }
    } else if (suggestion.includes("country")) {
      
      // Improved regex to handle different formats of country suggestions
      // First try to match "Country may be X (recorded by another user) instead of Y" pattern
      let countryMatch = suggestion.match(/Country may be ([^(]+) \(recorded by another user\) instead of/i);
      if (countryMatch && countryMatch[1]) {
        updateData.country = countryMatch[1].trim();
      } 
      // Try "Consider updating country to X" pattern
      else if (suggestion.includes("Consider updating country to")) {
        const updateMatch = suggestion.match(/Consider updating country to "([^"]+)"/i);
        if (updateMatch && updateMatch[1]) {
          updateData.country = updateMatch[1].trim();
        }
      }
      // Try "Consider updating country from X to Y" pattern
      else if (suggestion.includes("Consider updating country from")) {
        const updateFromMatch = suggestion.match(/Consider updating country from "([^"]+)" to "([^"]+)"/i);
        if (updateFromMatch && updateFromMatch[2]) {
          updateData.country = updateFromMatch[2].trim();
        }
      }
      // Try "Consider adding country X" pattern
      else if (suggestion.includes("Consider adding country")) {
        const addMatch = suggestion.match(/Consider adding country "([^"]+)"/i);
        if (addMatch && addMatch[1]) {
          updateData.country = addMatch[1].trim();
        }
      }
      // Try "Confirm country X" pattern
      else if (suggestion.includes("Confirm country")) {
        const confirmMatch = suggestion.match(/Confirm country "([^"]+)"/i);
        if (confirmMatch && confirmMatch[1]) {
          updateData.country = confirmMatch[1].trim();
        }
      }
      // Try other patterns
      else {
        const countryRegex = /country "([^"]+)"|"([^"]+)" country|country from "([^"]+)"|country to "([^"]+)"|adding country "([^"]+)"|country ([A-Za-z]+)/i;
        const match = suggestion.match(countryRegex);
        
        if (match) {
          // Find the first non-undefined group which contains the country
          const country = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
          if (country) {
            updateData.country = country;
          }
        }
      }
    } else if (suggestion.includes("occupation")) {
      
      // Handle "Occupation may be X (recorded by another user) instead of Y" pattern
      let occupationMatch = suggestion.match(/Occupation may be "([^"]+)" \(recorded by another user\) instead of/i);
      if (occupationMatch && occupationMatch[1]) {
        updateData.occupation = occupationMatch[1].trim();
      } 
      // Handle "Consider updating occupation to X" pattern
      else if (suggestion.includes("Consider updating occupation to")) {
        const updateMatch = suggestion.match(/Consider updating occupation to "([^"]+)"/i);
        if (updateMatch && updateMatch[1]) {
          updateData.occupation = updateMatch[1].trim();
        }
      }
      // Handle "Consider updating occupation from X to Y" pattern
      else if (suggestion.includes("Consider updating occupation from")) {
        const updateFromMatch = suggestion.match(/Consider updating occupation from "([^"]+)" to "([^"]+)"/i);
        if (updateFromMatch && updateFromMatch[2]) {
          updateData.occupation = updateFromMatch[2].trim();
        }
      }
      // Handle "Consider adding occupation X" pattern
      else if (suggestion.includes("Consider adding occupation")) {
        const addMatch = suggestion.match(/Consider adding occupation "([^"]+)"/i);
        if (addMatch && addMatch[1]) {
          updateData.occupation = addMatch[1].trim();
        }
      }
      // Handle "Confirm occupation X" pattern
      else if (suggestion.includes("Confirm occupation")) {
        const confirmMatch = suggestion.match(/Confirm occupation "([^"]+)"/i);
        if (confirmMatch && confirmMatch[1]) {
          updateData.occupation = confirmMatch[1].trim();
        }
      }
      // Try other patterns
      else {
        const occupationRegex = /occupation "([^"]+)"|"([^"]+)" occupation|occupation from "([^"]+)"|occupation to "([^"]+)"|adding occupation "([^"]+)"/i;
        const match = suggestion.match(occupationRegex);
        
        if (match) {
          // Find the first non-undefined group which contains the occupation
          const occupation = match[1] || match[2] || match[3] || match[4] || match[5];
          if (occupation) {
            updateData.occupation = occupation;
          }
        }
      }
    } else if (suggestion.includes("dead") || suggestion.includes("deceased")) {
      
      // Handle different patterns for dead/deceased status
      if (suggestion.includes("Consider updating status to") || 
          suggestion.includes("This family member may be") ||
          suggestion.includes("Confirm dead status")) {
        updateData.status = "dead";
      }
    } else if (suggestion.includes("alive")) {
      
      // Handle different patterns for alive status
      if (suggestion.includes("Verify status") || 
          suggestion.includes("recorded as alive")) {
        updateData.status = "alive";
      }
    } else if (suggestion.includes("Consider adding father") || suggestion.includes("adding father")) {

      
      // Ask for confirmation before proceeding with parent addition
      const confirmed = window.confirm(`Do you want to add a father for this family member? This will create a new parent node in your family tree.`);
      
      if (!confirmed) {
 
        return;
      }
      
      // Mark this suggestion as special and don't process it like regular field changes
      updateData._specialAction = "addFather";
      
      // Fix father name extraction to never extract surname from name
      const fatherNameMatch = suggestion.match(/adding father "([^"]+)"/i);
      if (fatherNameMatch && fatherNameMatch[1]) {
        updateData._fatherName = fatherNameMatch[1].trim();
  
        
        // NEVER extract surname from name - it should come from explicit surname field only
      }
      
      // Only use explicitly mentioned surname
      const fatherSurnameMatch = suggestion.match(/surname "([^"]+)"/i) || suggestion.match(/with surname "([^"]+)"/i);
      if (fatherSurnameMatch && fatherSurnameMatch[1]) {
        updateData._fatherSurname = fatherSurnameMatch[1].trim();

      }
      
      // Try different possible formats
      let sourceMemberMatch = suggestion.match(/similar to member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/from member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/source member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member ID: (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member[^\w]+(\w{24})/i); // Match MongoDB ObjectIds
      
      if (sourceMemberMatch && sourceMemberMatch[1]) {
        updateData._sourceMemberId = sourceMemberMatch[1].trim();

      }
      
    } else if (suggestion.includes("adding mother") || suggestion.includes("Consider adding mother")) {

      
      // Ask for confirmation before proceeding with parent addition
      const confirmed = window.confirm(`Do you want to add a mother for this family member? This will create a new parent node in your family tree.`);
      
      if (!confirmed) {
        return;
      }
      
      // Mark this suggestion as special and don't process it like regular field changes
      updateData._specialAction = "addMother";
      
      // Fix mother name extraction to never extract surname from name
      const motherNameMatch = suggestion.match(/adding mother "([^"]+)"/i);
      if (motherNameMatch && motherNameMatch[1]) {
        updateData._motherName = motherNameMatch[1].trim();

        
        // NEVER extract surname from name - it should come from explicit surname field only
      }
      
      // Only use explicitly mentioned surname
      const motherSurnameMatch = suggestion.match(/surname "([^"]+)"/i) || suggestion.match(/with surname "([^"]+)"/i);
      if (motherSurnameMatch && motherSurnameMatch[1]) {
        updateData._motherSurname = motherSurnameMatch[1].trim();

      }
      
      // Try different possible formats to find source member ID
      let sourceMemberMatch = suggestion.match(/similar to member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/from member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/source member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member ID: (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member[^\w]+(\w{24})/i); // Match MongoDB ObjectIds
      
      if (sourceMemberMatch && sourceMemberMatch[1]) {
        updateData._sourceMemberId = sourceMemberMatch[1].trim();

      }
    } else if (suggestion.includes("adding partner") || suggestion.includes("Consider adding partner")) {

      
      // Ask for confirmation before proceeding with partner addition
      const confirmed = window.confirm(`Do you want to add a partner for this family member? This will create a new partner node in your family tree.`);
      
      if (!confirmed) {

        return;
      }
      
      // Mark this suggestion as special and don't process it like regular field changes
      updateData._specialAction = "addPartner";
      
      // Fix partner name extraction to preserve the full name
      const partnerNameMatch = suggestion.match(/partner "([^"]+)"/i);
      if (partnerNameMatch && partnerNameMatch[1]) {
        // Preserve the full name without splitting or extracting surnames
        updateData._partnerName = partnerNameMatch[1].trim();

      }
      
      // Only use explicitly mentioned surname
      const partnerSurnameMatch = suggestion.match(/surname "([^"]+)"/i) || suggestion.match(/with surname "([^"]+)"/i);
      if (partnerSurnameMatch && partnerSurnameMatch[1]) {
        updateData._partnerSurname = partnerSurnameMatch[1].trim();

      }
      
      // Try different possible formats to find source member ID
      let sourceMemberMatch = suggestion.match(/similar to member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/from member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/source member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member ID: (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member[^\w]+(\w{24})/i); // Match MongoDB ObjectIds
      
      if (sourceMemberMatch && sourceMemberMatch[1]) {
        updateData._sourceMemberId = sourceMemberMatch[1].trim();

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
      
      // Don't mark as applied yet - keep suggestion visible until Save Changes is clicked
      toast.success(`Partner will be added when you apply all changes`);
      return;
    } else if (suggestion.includes("adding child") || suggestion.includes("adding children") || 
               suggestion.includes("more children") || suggestion.includes("adding son") || 
               suggestion.includes("adding daughter")) {
      // Ask for confirmation before proceeding with child addition
      
      // Removed comprehensive debugging logs for performance
      
      // Extract child name from the suggestion
      let childName = "";
      
      // Try multiple patterns to extract the child name
      let childNameMatch = suggestion.match(/(?:daughter|son) "([^"]+)"/i);
      if (!childNameMatch) {
        childNameMatch = suggestion.match(/child "([^"]+)"/i);
      }
      
      if (childNameMatch && childNameMatch[1]) {
        childName = childNameMatch[1].trim();

      } else {

        // Fallback: try to find any quoted name in the suggestion
        const fallbackMatch = suggestion.match(/"([^"]+)"/);
        if (fallbackMatch && fallbackMatch[1] && !fallbackMatch[1].toLowerCase().includes("kyle")) {
          childName = fallbackMatch[1].trim();

        } else {
          childName = "Child"; // Default fallback

        }
      }
      
      // Ask for confirmation before proceeding with child addition
      const confirmed = window.confirm(`Do you want to add child "${childName}" to this family member? This will create a new node in your family tree.`);
      
      if (!confirmed) {

        return;
      }

      // Try to extract source member ID
      let sourceMemberId: string | undefined;
      let sourceMemberMatch = suggestion.match(/similar to member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/from member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/source member (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member ID: (\w+)/i);
      if (!sourceMemberMatch) sourceMemberMatch = suggestion.match(/member[^\w]+(\w{24})/i); // Match MongoDB ObjectIds
      
      if (sourceMemberMatch && sourceMemberMatch[1]) {
        sourceMemberId = sourceMemberMatch[1].trim();

      }
      
      // Extract the clean member ID
      const cleanMemberId = typeof memberId === 'object' 
        ? (memberId as any).toString()
        : String(memberId);
      
      // ALWAYS try to fetch gender from source member first
      let childGender = "unknown";
      let relation = "child"; // Default neutral relation

      if (sourceMemberId) {
        try {

          const sourceGender = await fetchGenderFromSourceMember(sourceMemberId);
          if (sourceGender) {
            childGender = sourceGender;
            relation = childGender === "male" ? "son" : "daughter";

          } else {

          }
        } catch (err) {

        }
      } else {

      }

      // If still no gender, check for relation in suggestion text
      if (childGender === "unknown") {
        // First check for explicit relation mentioned in the suggestion
        if (suggestion.toLowerCase().includes("adding son")) {
          childGender = "male";
          relation = "son";

        } 
        else if (suggestion.toLowerCase().includes("adding daughter")) {
          childGender = "female";
          relation = "daughter";

        }
        // Then look for relation mentioned elsewhere in the suggestion
        else if (suggestion.toLowerCase().includes("this son for this person")) {
          childGender = "male";
          relation = "son";

        } 
        else if (suggestion.toLowerCase().includes("this daughter for this person")) {
          childGender = "female";
          relation = "daughter";
  
        }
        // Generic gender references as fallback
        else if (suggestion.toLowerCase().includes("male")) {
          childGender = "male";
          relation = "son";

        } 
        else {
          // Default to female if no gender information in suggestion
          childGender = "female";
          relation = "daughter";

        }
      }

      // CRITICAL: Final check before saving action data - ensure relation and gender match
      // We prioritize relation mentioned in suggestion text over gender from source member
      if (suggestion.toLowerCase().includes("adding son") || suggestion.toLowerCase().includes("this son for this person")) {
        childGender = "male";
        relation = "son";

      }
      else if (suggestion.toLowerCase().includes("adding daughter") || suggestion.toLowerCase().includes("this daughter for this person")) {
        childGender = "female";
        relation = "daughter";

      }

      // Store one child action with a unique key
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const actionKey = `_addChildAction_${uniqueSuffix}`;

      // Create the action data with proper parent relationships
      const actionData: any = {
        _specialAction: "addChildren",
        _childrenNames: [childName],
        _childrenCount: 1,
        _sourceMemberId: sourceMemberId,
        gender: childGender, // Use the gender we determined
        // The family service ensures relation matches gender, so we must be consistent
        relation: childGender === "male" ? "son" : "daughter",
        targetMemberId: cleanMemberId,
        _parentId: cleanMemberId, // Explicitly set parent ID to ensure relationship
        _sourceSuggestion: suggestion // Store the original suggestion to properly mark only this one as processed
      };
      


      

      
      // Set appropriate parent fields based on gender
      if (memberData && memberData.gender === "male") {
        actionData.fatherId = cleanMemberId;
        // Check if there's a partner to set as the other parent
        if (memberData.partnerId && memberData.partnerId.length > 0) {
          actionData.motherId = memberData.partnerId[0];
        }
      } else if (memberData && memberData.gender === "female") {
        actionData.motherId = cleanMemberId;
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
      
      toast.success(`Child "${childName}" will be added when you apply changes`);
      
      // Don't mark as applied yet - keep suggestion visible until Save Changes is clicked
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
        

        
        // ALWAYS fetch fresh data to ensure we have the latest

        let validMemberData: MemberData;
        
        try {
          const freshMemberResponse = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`);

          
          // Extract the actual member data from the response structure
          // The API returns { statusCode, message, data } where data is the actual member object
          let actualMemberData;
          
          // Check if we have a nested response structure
          if (freshMemberResponse && typeof freshMemberResponse === 'object') {
            if (freshMemberResponse.data && typeof freshMemberResponse.data === 'object') {

              actualMemberData = freshMemberResponse.data;
            } else {
              // If not nested, assume the response itself is the member data
              actualMemberData = freshMemberResponse;
            }
          }
          

          
          // Validate that we have a proper object with _id
          if (!actualMemberData || typeof actualMemberData !== 'object' || !actualMemberData._id) {

            toast.error("Could not retrieve valid member data");
            return;
          }
          
          // Update component state with fresh data
          setMemberData(actualMemberData);
          validMemberData = actualMemberData;
        } catch (fetchError) {

          toast.error("Failed to get member data");
          return;
        }
        

        
        // Double-check that we have a valid ID before proceeding
        if (!validMemberData._id) {

          toast.error("Cannot add parent: Missing member ID");
          return;
        }
        
        // Store the parent suggestion in pending changes instead of applying immediately
        const relation = updateData._specialAction === "addFather" ? "father" : "mother";
        
        // Extract parent name more carefully to avoid issues
        let parentName = updateData._specialAction === "addFather" 
          ? (updateData._fatherName || "Unknown")
          : (updateData._motherName || "Unknown");
        
        // Better handle parent name extraction
        // First try to extract surname directly if specified in the suggestion
        let explicitSurname = "";
        const surnameMatch = suggestion.match(/surname "([^"]+)"/i) || suggestion.match(/with surname "([^"]+)"/i);
        if (surnameMatch && surnameMatch[1]) {
          explicitSurname = surnameMatch[1].trim();

        }

        // Check if the name contains spaces (potentially has FirstName LastName format)
        const nameParts = parentName.split(' ');
        let firstName = parentName; // Keep the full name intact
        let extractedSurname = "";



        // Use surname in this priority: explicit from suggestion, source member, member's own
        let parentSurname = explicitSurname || validMemberData.surname || "";


        // Prepare data for the new parent - keeping full name in name field
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
          name: parentName, // Keep full name intact
          surname: parentSurname, // Only use explicit surname
          gender: updateData._specialAction === "addFather" ? "male" : "female",
          status: "alive",
          country: validMemberData.country || "",
          occupation: ""
        };
        
        // Try to get additional details from source member if available
        if (updateData._sourceMemberId) {
          try {

            const sourceResponse = await makeApiCall(`http://localhost:3001/family-members/${updateData._sourceMemberId}`);
            
            if (sourceResponse && (sourceResponse.data || sourceResponse)) {
              const sourceData = sourceResponse.data || sourceResponse;

              
              // CRITICAL FIX: Use the full name and surname from source member
              if (sourceData.name) {

                parentData.name = sourceData.name;
              }
              
              // Always use source member's surname when available
              if (sourceData.surname) {

                parentData.surname = sourceData.surname;
              }
              
              // Copy relevant fields if they exist
              if (sourceData.birthDate) parentData.birthDate = sourceData.birthDate;
              if (sourceData.deathDate) parentData.deathDate = sourceData.deathDate;
              if (sourceData.status) parentData.status = sourceData.status;
              if (sourceData.country) parentData.country = sourceData.country;
              if (sourceData.occupation) parentData.occupation = sourceData.occupation;
            }
          } catch (sourceError) {

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
        // Don't immediately add to appliedSuggestions - keep suggestions visible until saved
        
        // Update the UI to indicate the pending change
        const displayName = relation === "father" ? "Father" : "Mother";
        const displayValue = parentData.name + (parentData.surname ? ` ${parentData.surname}` : '');
        
        toast.success(`${displayName} "${displayValue}" will be added after saving changes`);
        
        return;
        
      } catch (error) {
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
        country: memberData.country || "ph",
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

        }
      };
      
      // Import the handler function on demand
      try {
        setLoading(true);
        // Dynamically import the service
        const { handleAddMember } = await import("../../treeview/service/familyService");
        
        // Determine relation based on gender
        const partnerGender = memberData.gender === 'male' ? 'female' : 'male';
        const relation = partnerGender === 'male' ? 'husband' : 'wife';
        
        // Prepare data for the new partner
        const partnerData = {
          // Keep full name intact without splitting
          name: updateData._partnerName || "Unknown Partner",
          surname: updateData._partnerSurname || memberData.surname || "",
          gender: partnerGender,
          status: "alive",
          country: memberData.country || "ph",
          occupation: ""
        };
        
     
        

        
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

        toast.error(`Failed to add partner: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
      
      return;
    } else if (updateData._specialAction === "addChildren") {

      
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
          
          // Get gender directly from action data without any defaults
          const childGender = updateData.gender;
          if (!childGender) {

            toast.error("Gender information is missing for child. Cannot proceed.");
            continue; // Skip this child but continue with others
          }
          

          // IMPORTANT: Always use the gender to determine relation, not the other way around
          // This ensures the gender is preserved from the suggestion
          let relation = childGender === "male" ? "son" : "daughter";
          
          // Get current member ID in a clean format
          const currentMemberId = typeof memberId === 'object' 
            ? (memberId as any).toString()
            : String(memberId);
            
          // Create basic child data
          const childData: {
            name: string;
            surname: string;
            gender: string;
            status: string;
            country: string;
            occupation: string;
            _parentId: string;
            fatherId?: string;
            motherId?: string;
          } = {
            name: childName,
            surname: memberData.surname || "",
            gender: childGender,
            status: "alive",
            country: memberData.country || "ph",
            occupation: "",
            _parentId: currentMemberId, // Explicitly set parent ID to establish relationship
            // Set parent fields based on member's gender
            fatherId: memberData.gender === "male" ? currentMemberId : undefined,
            motherId: memberData.gender === "female" ? currentMemberId : undefined
          };
          
          // Check if there's a partner to set as the other parent
          if (memberData.gender === "male" && memberData.partnerId && memberData.partnerId.length > 0) {
            childData.motherId = memberData.partnerId[0];
          } else if (memberData.gender === "female" && memberData.partnerId && memberData.partnerId.length > 0) {
            childData.fatherId = memberData.partnerId[0];
          }
          

          
          try {
            // CRITICAL FIX: Double-check gender is set correctly and relation matches gender
            if (childData.gender) {
              // Original gender for logging
              const originalGender = childData.gender;
              
              // Force normalize gender to lowercase "male" or "female"
              childData.gender = childData.gender.toLowerCase() === "male" ? "male" : "female";
              
              // Always derive relation from gender for consistency
              relation = childData.gender === "male" ? "son" : "daughter";
              

            } else {
              // If gender is missing, default to female
              childData.gender = "female";
              relation = "daughter";

            }

            // FINAL CHECK: The familyService.handleAddMember will use relation to set gender, 
            // so we need to ensure they match exactly. Relation takes precedence.
            if (relation === "son") {

              childData.gender = "male";
            } else if (relation === "daughter") {

              childData.gender = "female";
            }

            // Call the handler to add the child
            await handleAddMember(
              localStorage.getItem("token") || "", 
              syntheticNode, 
              relation, 
              refreshFunction, 
              childData
            );
            
            // Mark only this specific child suggestion as processed
            // Instead of all child suggestions
            if (updateData._sourceSuggestion) {
              await markSuggestionAsProcessed(currentMemberId, updateData._sourceSuggestion);
            }
            
            // Since we now handle children individually, we don't need pauses between them
            // unless it's the legacy bundled format
            if (i < childrenCount - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (childError) {

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
      } catch (error) {

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

      } catch (error) {

      }
    }
    
    if (updateData.deathDate) {
      try {
        // Ensure the date is in the correct format
        const parsedDate = new Date(updateData.deathDate);
        updateData.deathDate = parsedDate.toISOString().split('T')[0];

      } catch (error) {

      }
    }
    

    
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
    // Don't immediately add to appliedSuggestions - keep suggestions visible until saved
    
    // Skip immediate UI filtering - suggestions should remain visible until Save Changes is clicked
    
    // Update the UI to reflect the pending change LAST, so animation is triggered
    if (memberData) {
      // Create a new object with the updated member data
      const updatedMemberData = {
        ...memberData,
        ...updateData
      };
      

      
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
        const result = await makeApiCall(`http://localhost:3001/family-members/${cleanMemberId}`, {
          method: "PATCH",
          body: JSON.stringify(regularChanges)
        });
      }
      
      // Then handle special actions (parent additions or child additions)
      if (specialActions.length > 0) {
        // Import the handler function on demand
        const { handleAddMember } = await import("../../treeview/service/familyService");
        
        for (const action of specialActions) {
          try {
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
                // Error refreshing member data
              }
            };
            
            if (action.data._specialAction === "addFather" || action.data._specialAction === "addMother") {
              // Handle parent addition
              // Determine relation
              const relation = action.data._specialAction === "addFather" ? "father" : "mother";
              
              // Call the handler to add the parent
              const result = await handleAddMember(
                localStorage.getItem("token") || "", 
                syntheticNode, 
                relation, 
                refreshFunction, 
                action.data.parentData
              );
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
                country: memberData.country || "ph",
                occupation: ""
              };
              
              // Call the handler to add the partner
              const result = await handleAddMember(
                localStorage.getItem("token") || "", 
                syntheticNode, 
                relation, 
                refreshFunction, 
                partnerData
              );
              
              toast.success(`Added partner "${partnerData.name}"`);
            }
            else if (action.data._specialAction === "addChildren") {
              // Handle adding children
              const childrenNames = action.data._childrenNames || [];
              const childrenCount = action.data._childrenCount || childrenNames.length || 1;
              
              // Add each child one by one
              for (let i = 0; i < childrenCount; i++) {
                const childName = i < childrenNames.length 
                  ? childrenNames[i] 
                  : `Child ${i + 1}`;
                
                // Get gender directly from action data without any defaults
                const childGender = action.data.gender ? action.data.gender.toLowerCase() : "";
                if (!childGender) {
                  // Look for relation information first
                  const relation = action.data.relation;
                  if (relation === "son") {
                    action.data.gender = "male";
                  } else if (relation === "daughter") {
                    action.data.gender = "female";
                  } else {
                    // Default to female if no relation or gender info
                    action.data.gender = "female";
                  }
                }
                
                // IMPORTANT: Always use the gender to determine relation, not the other way around
                // This ensures the gender is preserved from the suggestion
                let relation = childGender === "male" ? "son" : "daughter";
                
                // Create basic child data
                const childData = {
                  name: childName,
                  surname: memberData.surname || "",
                  // Get gender from action data 
                  gender: action.data.gender || "",
                  status: "alive",
                  country: memberData.country || "ph",
                  occupation: "",
                  _parentId: cleanMemberId, // Explicitly set parent ID to establish relationship
                  // Set parent fields based on member's gender
                  fatherId: memberData.gender === "male" ? cleanMemberId : undefined,
                  motherId: memberData.gender === "female" ? cleanMemberId : undefined
                };
                
                // If we have a source member ID, try to fetch proper surname and ensure gender is correct
                if (action.data._sourceMemberId) {
                  try {
                    const token = localStorage.getItem("token");
                    if (token) {
                      const sourceMemberResponse = await fetch(`http://localhost:3001/family-members/${action.data._sourceMemberId}`, {
                        method: "GET",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        }
                      });
                      
                      if (sourceMemberResponse.ok) {
                        const sourceMemberData = await sourceMemberResponse.json();
                        const sourceMember = sourceMemberData.data || sourceMemberData;
                        
                        // Always prioritize gender from source member
                        if (sourceMember.gender) {
                          const normalizedGender = sourceMember.gender.toLowerCase() === "male" ? "male" : "female";
                          childData.gender = normalizedGender;
                        }
                        
                        // Also copy surname from source if available
                        if (sourceMember.surname) {
                          childData.surname = sourceMember.surname;
                        }
                      }
                    }
                  } catch (error) {
                    // Error fetching additional data from source member
                  }
                }
                
                // Check if there's a partner to set as the other parent
                if (memberData.gender === "male" && memberData.partnerId && memberData.partnerId.length > 0) {
                  childData.motherId = memberData.partnerId[0];
                } else if (memberData.gender === "female" && memberData.partnerId && memberData.partnerId.length > 0) {
                  childData.fatherId = memberData.partnerId[0];
                }
                
                try {
                  // CRITICAL FIX: Double-check gender is set correctly and relation matches gender
                  if (childData.gender) {
                    // Force normalize gender to lowercase "male" or "female"
                    childData.gender = childData.gender.toLowerCase() === "male" ? "male" : "female";
                    
                    // Always derive relation from gender for consistency
                    relation = childData.gender === "male" ? "son" : "daughter";
                  } else {
                    // If gender is missing, default to female
                    childData.gender = "female";
                    relation = "daughter";
                  }

                  // FINAL CHECK: The familyService.handleAddMember will use relation to set gender, 
                  // so we need to ensure they match exactly. Relation takes precedence.
                  if (relation === "son") {
                    childData.gender = "male";
                  } else if (relation === "daughter") {
                    childData.gender = "female";
                  }

                  // Call the handler to add the child
                  await handleAddMember(
                    localStorage.getItem("token") || "", 
                    syntheticNode, 
                    relation, 
                    refreshFunction, 
                    childData
                  );
                  
                  // Mark only this specific child suggestion as processed if available
                  if (action.data._sourceSuggestion) {
                    await markSuggestionAsProcessed(cleanMemberId, action.data._sourceSuggestion as string);
                  }
                  
                  // Wait a bit between adding children to avoid race conditions
                  if (i < childrenCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                } catch (childError) {
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
            toast.error(`Failed to add family member: ${actionError instanceof Error ? actionError.message : 'Unknown error'}`);
          }
        }
      }
      
      // Mark all applied suggestions as processed in the database
      if (pendingChanges.sourceSuggestions.length > 0) {
        for (const suggestion of pendingChanges.sourceSuggestions) {
          await markSuggestionAsProcessed(cleanMemberId, suggestion);
        }
        
        // Add the processed suggestions to appliedSuggestions state for immediate UI filtering
        setAppliedSuggestions(prev => [...prev, ...pendingChanges.sourceSuggestions]);
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
        // Error refreshing suggestions
      }
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply changes");
    } finally {
      setLoading(false);
    }
  };
  
  // Function to cancel all pending changes
  const cancelPendingChanges = async () => {
    // Don't set any state that might trigger effects - just refresh immediately
    // This prevents any application logic from running
    window.location.reload();
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
      
      // Extract the specific child name if this is a child suggestion
      let childName = "";
      if (isChildSuggestion) {
        const childNameMatch = suggestionText.match(/child "([^"]+)"/i);
        if (childNameMatch && childNameMatch[1]) {
          childName = childNameMatch[1].trim();
        }
      }
      
      // Only mark this specific child suggestion as processed
      // This way other child suggestions will still appear
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
      // BUT ONLY for this specific child, not all children
      if (isChildSuggestion && memberData && memberData.partnerId && memberData.partnerId.length > 0 && childName) {
        try {
          // For each partner, find and mark similar suggestions as processed
          for (const partnerId of memberData.partnerId) {
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
          }
        } catch (partnerError) {

        }
      }
      
      return true;
    } catch (error) {

      return false;
    }
  };

  const SuggestionCard = ({ similarMember }: { similarMember: any }) => {
    // Don't render if no suggestions
    if (!similarMember.suggestions || similarMember.suggestions.length === 0) {
      return null;
    }
    
    // Filter out any suggestions that have already been applied or that match current member data
    const filteredSuggestions = similarMember.suggestions.filter(
      (suggestion: string) => {
        // Skip suggestions that have already been explicitly applied
        if (appliedSuggestions.includes(suggestion)) {
          return false;
        }

        // Filter out partner suggestions if they already have the suggested partner
        if (suggestion.includes("adding partner") || suggestion.includes("Consider adding partner")) {
          // Extract partner name from suggestion
          const partnerNameMatch = suggestion.match(/partner "([^"]+)"/i);
          if (partnerNameMatch && partnerNameMatch[1] && memberData) {
            // Check if member already has this partner
            const suggestedPartnerName = partnerNameMatch[1].trim().toLowerCase();
            
            // Check against existing partners
            if (memberData.partnerId && memberData.partnerId.length > 0) {
              // Check if any of the known partners match the suggested name
              if (partnerInfo.some((partner: {name: string, id: string}) => 
                partner.name.toLowerCase().includes(suggestedPartnerName) ||
                suggestedPartnerName.includes(partner.name.toLowerCase()))) {
                return false;
              }
            }
          }
        }
        
        // Filter out child suggestions if the child is already connected to this member
        if (suggestion.includes("adding child") || suggestion.includes("more children") ||
            suggestion.includes("adding son") || suggestion.includes("adding daughter")) {
          // Check if this is a specific child suggestion
          const childNameMatch = suggestion.match(/(?:child|son|daughter) "([^"]+)"/i);
          if (childNameMatch && childNameMatch[1] && memberData) {
            const suggestedChildName = childNameMatch[1].trim().toLowerCase();
            
            // Check if member has childId property and has children
            if (memberData.childId && Array.isArray(memberData.childId) && memberData.childId.length > 0) {
              // If we have childInfo with names, use it to check
              if (childInfo && childInfo.length > 0) {
                if (childInfo.some((child: {name: string, id: string}) => 
                  child.name.toLowerCase().includes(suggestedChildName) ||
                  suggestedChildName.includes(child.name.toLowerCase()))) {
                  return false;
                }
              } else {
                // If we don't have childInfo, be conservative and filter out all child suggestions
                // Since we know the member has children but we don't have their details
                return false;
              }
            }
          }
        }
        
        // Filter out parent suggestions if parent is already connected
        if (suggestion.includes("adding father") || suggestion.includes("adding mother")) {
          const parentNameMatch = suggestion.match(/(father|mother) "([^"]+)"/i);
          if (parentNameMatch && parentNameMatch[2] && memberData) {
            const parentType = parentNameMatch[1].toLowerCase();
            const suggestedParentName = parentNameMatch[2].trim().toLowerCase();
            
            // If member already has this parent type, filter out the suggestion
            if ((parentType === 'father' && memberData.fatherId) || 
                (parentType === 'mother' && memberData.motherId)) {
              return false;
            }
          }
        }

        // Skip birth date confirmations if birth date is already set to that value
        if (suggestion.includes("Confirm birth date") && memberData?.birthDate) {
          const dateMatch = suggestion.match(/birth date (\d{4}-\d{2}-\d{2})/i);
          if (dateMatch && dateMatch[1]) {
            const suggestedDate = dateMatch[1].trim();
            const currentDate = new Date(memberData.birthDate).toISOString().split('T')[0];
            if (suggestedDate === currentDate) {
              return false;
            }
          }
        }

        // Skip death date confirmations if death date is already set to that value
        if (suggestion.includes("Confirm death date") && memberData?.deathDate) {
          const dateMatch = suggestion.match(/death date (\d{4}-\d{2}-\d{2})/i);
          if (dateMatch && dateMatch[1]) {
            const suggestedDate = dateMatch[1].trim();
            const currentDate = new Date(memberData.deathDate).toISOString().split('T')[0];
            if (suggestedDate === currentDate) {
              return false;
            }
          }
        }

        // Skip dead status confirmations if status is already dead
        if ((suggestion.includes("Confirm dead status") || 
            suggestion.includes("Consider updating status to \"dead\"")) && 
            memberData?.status === "dead") {
          return false;
        }

        // Skip country confirmations if country is already that value
        if (suggestion.includes("Confirm country") && memberData?.country) {
          const countryMatch = suggestion.match(/country "([^"]+)"/i);
          if (countryMatch && countryMatch[1]) {
            const suggestedCountry = countryMatch[1].trim().toLowerCase();
            if (memberData.country.toLowerCase() === suggestedCountry) {
              return false;
            }
          }
        }
        
        // If we get here, this is a valid suggestion
        return true;
      }
    );
    
    // Don't render if all suggestions have been filtered out
    if (filteredSuggestions.length === 0) {
      return null;
    }
    
    return (
      <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/50 p-5 mb-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
          <span className="flex-grow">Suggestions from similar member</span>
          <span className="text-sm bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full px-3 py-1">
            {filteredSuggestions.length} suggestion{filteredSuggestions.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <div className="text-sm text-gray-400 mb-3">
          Source: {similarMember.name || 'Unknown'}{similarMember.surname ? ` ${similarMember.surname}` : ''}
          {similarMember.similarity && (
            <span className="ml-2">
              ({Math.round(similarMember.similarity * 100)}% similarity)
            </span>
          )}
        </div>
        <div className="space-y-3">
          {filteredSuggestions.map((suggestion: string, idx: number) => (
            <div key={idx} className="flex items-start space-x-2 bg-gray-800/50 rounded-lg p-3 border border-gray-600/30">
              <div className="flex-grow">
                <p className="text-gray-300">{suggestion}</p>
              </div>
              <button
                onClick={() => handleApplySuggestion(suggestion)}
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-3 py-1 rounded-lg transition-all duration-300 text-sm flex-shrink-0 shadow-lg"
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

      return dateString; // Return as is if there's an error
    }
  };

    // No need for determineGenderFromName - we now get gender directly from suggestion or source data

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />
        <AnimatedNodes />

        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative mb-6">
              <div className="h-16 w-16 mx-auto rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin"></div>
              <div
                className="absolute inset-0 h-16 w-16 mx-auto rounded-full border-4 border-transparent border-r-blue-500/50 animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              ></div>
            </div>
            <p className="text-teal-300 text-lg font-medium">Loading suggestions...</p>
            <p className="text-gray-400 text-sm mt-2">Discovering potential family connections</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />
        <AnimatedNodes />

        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
            <p className="text-red-300 mb-6">{error}</p>
            <button 
              onClick={() => router.back()}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-all duration-300 shadow-lg"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />
        <AnimatedNodes />

        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Member not found</h3>
            <p className="text-gray-400 mb-6">The requested family member could not be found.</p>
            <button 
              onClick={() => router.back()}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-all duration-300 shadow-lg"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0B1120] text-white relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />
      <AnimatedNodes />

      <div className="container mx-auto px-4 py-8 relative max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                // Set flag to refresh tree when returning
                if (pendingChanges.sourceSuggestions.length > 0) {
                  sessionStorage.setItem('treeNeedsRefresh', 'true');
                }
                router.push("/dashboard/treeview");
              }}
              className="group flex items-center gap-3 text-gray-400 hover:text-teal-400 transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-teal-900/30 transition-colors">
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </div>
              <span className="font-medium">Back to Family Tree</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <span className="text-sm text-gray-300">AI Suggestions</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Family Suggestions for {memberData.name} {memberData.surname}
            </h1>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg">
              Discover potential family connections and enhance your family tree with AI-powered suggestions.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Member Details Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-lg">
                    <User className="h-6 w-6 text-teal-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Member Details</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Name</div>
                      <motion.div 
                        className={`text-white font-medium ${updatedFields.name || updatedFields.surname ? 'bg-teal-800/30 px-2 py-1 rounded' : ''}`}
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
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Birth Date</div>
                      <motion.div 
                        className={`text-white font-medium ${updatedFields.birthDate ? 'bg-teal-800/30 px-2 py-1 rounded' : ''}`}
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
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Death Date</div>
                        <motion.div 
                          className={`text-white font-medium ${updatedFields.deathDate ? 'bg-teal-800/30 px-2 py-1 rounded' : ''}`}
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
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Info className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Status</div>
                      <motion.div 
                        className={`text-white font-medium capitalize ${updatedFields.status ? 'bg-teal-800/30 px-2 py-1 rounded' : ''}`}
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
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Flag className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Country</div>
                        <motion.div 
                          className={`text-white font-medium ${updatedFields.country ? 'bg-teal-800/30 px-2 py-1 rounded' : ''}`}
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
                      <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Occupation</div>
                        <motion.div 
                          className={`text-white font-medium ${updatedFields.occupation ? 'bg-teal-800/30 px-2 py-1 rounded' : ''}`}
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
                className="mt-6 rounded-xl bg-gradient-to-br from-orange-900/30 to-yellow-900/30 backdrop-blur-sm border border-orange-700/50 overflow-hidden shadow-lg"
              >
                <div className="bg-gradient-to-r from-orange-900/50 to-yellow-900/50 p-4 border-b border-orange-700/50">
                  <h2 className="text-lg font-semibold text-orange-300 flex items-center">
                    <span className="mr-2">Pending Changes</span>
                    <span className="bg-orange-700/70 text-orange-100 text-xs rounded-full px-2 py-1">
                      {Object.keys(pendingChanges.changes).length}
                    </span>
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {Object.entries(pendingChanges.changes).map(([field, value]) => {
                      // Handle special actions for adding parents
                      if (field === "_addFatherAction") {
                        const parentData = (value as any).parentData;
                        return (
                          <div key={field} className="flex justify-between items-center p-3 bg-orange-950/40 rounded-lg border border-orange-800/30">
                            <div>
                              <div className="text-sm text-orange-200/70">Add Father</div>
                              <div className="text-orange-100">
                                {parentData.name}{parentData.surname ? ` ${parentData.surname}` : ''}
                              </div>
                            </div>
                          </div>
                        );
                      } else if (field === "_addMotherAction") {
                        const parentData = (value as any).parentData;
                        return (
                          <div key={field} className="flex justify-between items-center p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/30">
                            <div>
                              <div className="text-sm text-yellow-200/70">Add Mother</div>
                              <div className="text-yellow-100">
                                {parentData.name}{parentData.surname ? ` ${parentData.surname}` : ''}
                              </div>
                            </div>
                          </div>
                        );
                      } else if (field === "_addPartnerAction") {
                        const partnerData = (value as any);
                        return (
                          <div key={field} className="flex justify-between items-center p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/30">
                            <div>
                              <div className="text-sm text-yellow-200/70">Add Partner</div>
                              <div className="text-yellow-100">
                                {partnerData._partnerName}{partnerData._partnerSurname ? ` ${partnerData._partnerSurname}` : ''}
                              </div>
                            </div>
                          </div>
                        );
                      } else if (field === "_addChildrenAction" || field.startsWith("_addChildAction_")) {
                        const childrenData = (value as any);
                        
                        // For UI display, we need to ensure consistency between gender and relation
                        let childGender = childrenData.gender ? childrenData.gender.toLowerCase() : "";
                        let childRelation = childrenData.relation || "";
                        
                        // If relation is explicitly specified, use it to determine gender and display
                        if (childRelation === "son") {
                          childGender = "male";
                        } else if (childRelation === "daughter") {
                          childGender = "female";
                        } else if (childGender) {
                          // If no relation but gender is specified, derive relation from gender
                          childRelation = childGender === "male" ? "son" : "daughter";
                        } else {
                          // Default case: use female gender and daughter relation
                          childGender = "female";
                          childRelation = "daughter";
                        }
                        
                        // Display based on relation
                        const genderDisplay = childRelation === "daughter" ? "Daughter" : "Son";
                        const genderColor = childRelation === "daughter" ? "text-pink-300" : "text-blue-300";
                        
                        // Get the child's name - prioritize the actual name over surname
                        const childName = childrenData._childrenNames && childrenData._childrenNames.length > 0 
                          ? childrenData._childrenNames[0] 
                          : "Child";
                        
                        // Determine surname to display - if no explicit surname, use member's surname
                        const displaySurname = childrenData.surname || memberData.surname || "";
                        
                        return (
                          <div key={field} className="flex justify-between items-center p-3 bg-yellow-950/40 rounded-lg border border-yellow-800/30">
                            <div>
                              <div className="text-sm text-yellow-200/70 flex items-center">
                                Add {genderDisplay}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${genderColor} bg-gray-800/50`}>
                                  {childRelation}
                                </span>
                              </div>
                              <div className="text-yellow-100">
                                {childName}{displaySurname ? ` ${displaySurname}` : ""}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        // Regular field changes
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
                      type="button"
                      onClick={applyPendingChanges}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                    >
                      Save Changes
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        cancelPendingChanges();
                        return false;
                      }}
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
            className="lg:col-span-2"
          >
            <div className="rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-6 border-b border-gray-700/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  {(() => {
                    // Calculate suggestion count using the same filtering logic as SuggestionCard
                    const displayCount = suggestionsData.similarMembers.reduce((total, member) => {
                      const filteredSuggestions = member.suggestions.filter((suggestion: string) => {
                        // Skip suggestions that have already been explicitly applied
                        if (appliedSuggestions.includes(suggestion)) {
                          return false;
                        }

                        // Filter out partner suggestions if they already have the suggested partner
                        if (suggestion.includes("adding partner") || suggestion.includes("Consider adding partner")) {
                          const partnerNameMatch = suggestion.match(/partner "([^"]+)"/i);
                          if (partnerNameMatch && partnerNameMatch[1] && memberData) {
                            const suggestedPartnerName = partnerNameMatch[1].trim().toLowerCase();
                            if (memberData.partnerId && memberData.partnerId.length > 0) {
                              if (partnerInfo.some((partner: {name: string, id: string}) => 
                                partner.name.toLowerCase().includes(suggestedPartnerName) ||
                                suggestedPartnerName.includes(partner.name.toLowerCase()))) {
                                return false;
                              }
                            }
                          }
                        }
                        
                        // Filter out child suggestions if the child is already connected to this member
                        if (suggestion.includes("adding child") || suggestion.includes("more children") ||
                            suggestion.includes("adding son") || suggestion.includes("adding daughter")) {
                          const childNameMatch = suggestion.match(/(?:child|son|daughter) "([^"]+)"/i);
                          if (childNameMatch && childNameMatch[1] && memberData) {
                            const suggestedChildName = childNameMatch[1].trim().toLowerCase();
                            if (memberData.childId && Array.isArray(memberData.childId) && memberData.childId.length > 0) {
                              if (childInfo && childInfo.length > 0) {
                                if (childInfo.some((child: {name: string, id: string}) => 
                                  child.name.toLowerCase().includes(suggestedChildName) ||
                                  suggestedChildName.includes(child.name.toLowerCase()))) {
                                  return false;
                                }
                              } else {
                                return false;
                              }
                            }
                          }
                        }
                        
                        // Filter out parent suggestions if parent is already connected
                        if (suggestion.includes("adding father") || suggestion.includes("adding mother")) {
                          const parentNameMatch = suggestion.match(/(father|mother) "([^"]+)"/i);
                          if (parentNameMatch && parentNameMatch[2] && memberData) {
                            const parentType = parentNameMatch[1].toLowerCase();
                            if ((parentType === 'father' && memberData.fatherId) || 
                                (parentType === 'mother' && memberData.motherId)) {
                              return false;
                            }
                          }
                        }
                        
                        // Skip birth date confirmations if birth date is already set to that value
                        if (suggestion.includes("Confirm birth date") && memberData?.birthDate) {
                          const dateMatch = suggestion.match(/birth date (\d{4}-\d{2}-\d{2})/i);
                          if (dateMatch && dateMatch[1]) {
                            const suggestedDate = dateMatch[1].trim();
                            const currentDate = new Date(memberData.birthDate).toISOString().split('T')[0];
                            if (suggestedDate === currentDate) return false;
                          }
                        }

                        if (suggestion.includes("Confirm death date") && memberData?.deathDate) {
                          const dateMatch = suggestion.match(/death date (\d{4}-\d{2}-\d{2})/i);
                          if (dateMatch && dateMatch[1]) {
                            const suggestedDate = dateMatch[1].trim();
                            const currentDate = new Date(memberData.deathDate).toISOString().split('T')[0];
                            if (suggestedDate === currentDate) return false;
                          }
                        }

                        if ((suggestion.includes("Confirm dead status") || 
                            suggestion.includes("Consider updating status to \"dead\"")) && 
                            memberData?.status === "dead") {
                          return false;
                        }

                        if (suggestion.includes("Confirm country") && memberData?.country) {
                          const countryMatch = suggestion.match(/country "([^"]+)"/i);
                          if (countryMatch && countryMatch[1]) {
                            const suggestedCountry = countryMatch[1].trim().toLowerCase();
                            if (memberData.country.toLowerCase() === suggestedCountry) return false;
                          }
                        }
                        
                        return true;
                      });
                      return total + filteredSuggestions.length;
                    }, 0);
                    
                    return (
                      <span className="bg-orange-500 text-white rounded-full min-w-10 h-10 flex items-center justify-center text-base font-bold px-3 border-2 border-white shadow-lg">
                        {displayCount}
                      </span>
                    );
                  })()}
                  <Sparkles className="h-6 w-6 text-orange-400" />
                  AI Suggestions
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {(() => {
                    if (!suggestionsData || !suggestionsData.similarMembers) {
                      return (
                        <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600/50">
                          <p className="text-gray-300">No suggestions available</p>
                        </div>
                      );
                    }
                    
                    
                    // Modified condition to check if we have similarMembers with actual suggestions after filtering
                    const hasSimilarMembers = suggestionsData.similarMembers.some(similar => 
                      similar.suggestions && similar.suggestions.filter(
                        (suggestion: string) => !appliedSuggestions.includes(suggestion)
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
                      similar.suggestions.filter((suggestion: string) => !appliedSuggestions.includes(suggestion))
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