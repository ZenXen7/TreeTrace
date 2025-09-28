"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Users, Send, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

interface CrossUserSimilarity {
  otherUserId: string;
  otherUserName: string;
  totalSuggestions: number;
  similarMembers: Array<{
    currentMember: {
      id: string;
      name: string;
      surname: string;
      birthDate?: string;
      deathDate?: string;
      status?: string;
      country?: string;
      partnerId?: string[];
      childId?: string[];
      fatherId?: string;
      motherId?: string;
    };
    otherMember: {
      id: string;
      name: string;
      surname: string;
    };
    similarity: number;
    similarFields: string[];
    suggestions: string[];
    actualSuggestionCount: number;
    hasAccess: boolean;
    hasPendingRequest: boolean;
    hasRejectedRequest: boolean;
  }>;
}

interface SuggestionRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  suggestionCount: number;
  requestedMemberId?: string; // Specific family member this request is for
  currentMemberId?: string; // The family member from the requesting user's tree that matches the requested member
  isIncoming: boolean;
  isOutgoing: boolean;
}

export default function CrossUserSuggestionsPage() {
  const router = useRouter();
  const [crossUserSimilarities, setCrossUserSimilarities] = useState<CrossUserSimilarity[]>([]);
  const [suggestionRequests, setSuggestionRequests] = useState<SuggestionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetchCrossUserSimilarities();
    fetchSuggestionRequests();
  }, []);

  // Refresh requests when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      fetchSuggestionRequests();
      fetchCrossUserSimilarities(); // Also refresh cross-user similarities
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchCrossUserSimilarities = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notifications/cross-user-similarities`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cross-user similarities");
      }

      const data = await response.json();
      const rawSimilarities = data.data || [];
      
      // Calculate filtered total suggestions for each user using the same method as treeview and individual suggestions
      const processedSimilarities = await Promise.all(
        rawSimilarities.map(async (similarity: any) => {
          let filteredTotalSuggestions = 0;
          const processedSimilarMembers = [];
          
          // Use the same getMemberSuggestionCount function as treeview and individual suggestions
          const { getMemberSuggestionCount } = await import('../../treeview/service/familyService');
          
          // Calculate filtered suggestions for each similar member using the same logic as individual suggestion page
          for (const member of similarity.similarMembers) {
            try {
              // Use the actual suggestion count from the backend response, not the filtered count
              // The backend already generates the correct suggestions, we just need to count them
              const actualSuggestionCount = member.suggestions ? member.suggestions.length : 0;
              filteredTotalSuggestions += actualSuggestionCount;
              
              // For the UI, we still need the filtered suggestions array
              // Fetch member data to apply proper filtering
              const memberDataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/family-members/${member.currentMember.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              let memberData = null;
              if (memberDataResponse.ok) {
                const memberDataResult = await memberDataResponse.json();
                memberData = memberDataResult.data || memberDataResult;
              }
              
              // Fetch applied suggestions
              const processedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notifications/processed-suggestions/${member.currentMember.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              let appliedSuggestions: string[] = [];
              if (processedResponse.ok) {
                const processedResult = await processedResponse.json();
                appliedSuggestions = processedResult.data || [];
              }
              
              // Fetch partner information for filtering
              let partnerInfo: {name: string, id: string}[] = [];
              if (memberData && memberData.partnerId && memberData.partnerId.length > 0) {
                try {
                  const partnerPromises = memberData.partnerId.map(async (partnerId: string) => {
                    const partnerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/family-members/${partnerId}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    if (partnerResponse.ok) {
                      const partnerResult = await partnerResponse.json();
                      const partnerData = partnerResult.data || partnerResult;
                      return {
                        id: partnerId,
                        name: partnerData.name || "Unknown Partner"
                      };
                    }
                    return { id: partnerId, name: "Unknown Partner" };
                  });
                  
                  partnerInfo = await Promise.all(partnerPromises);
                } catch (error) {
                  console.error("Error fetching partner information:", error);
                }
              }
              
              // Fetch child information for filtering
              let childInfo: {name: string, id: string}[] = [];
              if (memberData && memberData.childId && memberData.childId.length > 0) {
                try {
                  const childPromises = memberData.childId.map(async (childId: string) => {
                    const childResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/family-members/${childId}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    if (childResponse.ok) {
                      const childResult = await childResponse.json();
                      const childData = childResult.data || childResult;
                      return {
                        id: childId,
                        name: childData.name || "Unknown Child"
                      };
                    }
                    return { id: childId, name: "Unknown Child" };
                  });
                  
                  childInfo = await Promise.all(childPromises);
                } catch (error) {
                  console.error("Error fetching child information:", error);
                }
              }
              
              // Fetch the actual suggestions for this member (same as getMemberSuggestionCount does)
              let actualSuggestions: string[] = [];
              try {
                const suggestionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notifications/member-similarities/${member.currentMember.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                
                if (suggestionsResponse.ok) {
                  const suggestionsResult = await suggestionsResponse.json();
                  const suggestionsData = suggestionsResult.data;
                  
                  if (suggestionsData && suggestionsData.similarMembers) {
                    // Get suggestions from the first similar member (or combine all)
                    actualSuggestions = suggestionsData.similarMembers.flatMap((sm: any) => sm.suggestions || []);
                  }
                }
              } catch (error) {
                console.error("Error fetching actual suggestions:", error);
              }
              
              // Apply the same filtering logic as getMemberSuggestionCount (for UI display)
              
              const filteredSuggestions = actualSuggestions.filter((suggestion: string) => {
                // Skip applied suggestions
                if (appliedSuggestions.includes(suggestion)) return false;
                
                // Filter out partner suggestions if they already have the suggested partner
                if (suggestion.includes("adding partner") || suggestion.includes("Consider adding partner")) {
                  const partnerNameMatch = suggestion.match(/partner "([^"]+)"/i);
                  if (partnerNameMatch && partnerNameMatch[1] && memberData) {
                    const suggestedPartnerName = partnerNameMatch[1].trim().toLowerCase();
                    
                    // Check against existing partners - if member has partners, filter out partner suggestions
                    if (memberData.partnerId && memberData.partnerId.length > 0) {
                      // If we have partner info, check names
                      if (partnerInfo.length > 0) {
                        if (partnerInfo.some(partner => 
                          partner.name.toLowerCase().includes(suggestedPartnerName) ||
                          suggestedPartnerName.includes(partner.name.toLowerCase()))) {
                          return false;
                        }
                      } else {
                        // No partner info available but member has partners - be conservative and filter out all partner suggestions
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
                    
                    // If member has children, filter out child suggestions
                    if (memberData.childId && Array.isArray(memberData.childId) && memberData.childId.length > 0) {
                      // If we have child info, check names
                      if (childInfo && childInfo.length > 0) {
                        if (childInfo.some((child: {name: string, id: string}) => 
                          child.name.toLowerCase().includes(suggestedChildName) ||
                          suggestedChildName.includes(child.name.toLowerCase()))) {
                          return false;
                        }
                      } else {
                        // No child info available but member has children - be conservative and filter out all child suggestions
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
                if (suggestion.includes("Confirm birth date") && memberData.birthDate) {
                  const dateMatch = suggestion.match(/birth date (\d{4}-\d{2}-\d{2})/i);
                  if (dateMatch && dateMatch[1]) {
                    const suggestedDate = dateMatch[1].trim();
                    const currentDate = new Date(memberData.birthDate).toISOString().split('T')[0];
                    if (suggestedDate === currentDate) return false;
                  }
                }
                
                // Skip death date confirmations if death date is already set to that value
                if (suggestion.includes("Confirm death date") && memberData.deathDate) {
                  const dateMatch = suggestion.match(/death date (\d{4}-\d{2}-\d{2})/i);
                  if (dateMatch && dateMatch[1]) {
                    const suggestedDate = dateMatch[1].trim();
                    const currentDate = new Date(memberData.deathDate).toISOString().split('T')[0];
                    if (suggestedDate === currentDate) return false;
                  }
                }
                
                // Skip dead status confirmations if status is already dead
                if ((suggestion.includes("Confirm dead status") || 
                    suggestion.includes("Consider updating status to \"dead\"")) && 
                    memberData.status === "dead") {
                  return false;
                }
                
                // Skip country confirmations if country is already that value
                if (suggestion.includes("Confirm country") && memberData.country) {
                  const countryMatch = suggestion.match(/country "([^"]+)"/i);
                  if (countryMatch && countryMatch[1]) {
                    const suggestedCountry = countryMatch[1].trim().toLowerCase();
                    if (memberData.country.toLowerCase() === suggestedCountry) return false;
                  }
                }
                
                // If we get here, this is a valid suggestion
                return true;
              });
              
              processedSimilarMembers.push({
                ...member,
                suggestions: filteredSuggestions
              });
            } catch (error) {
              // Fallback to original suggestions if API call fails
              processedSimilarMembers.push({
                ...member,
                suggestions: member.suggestions || []
              });
              // Don't add to filteredTotalSuggestions on error to maintain accuracy
            }
          }
          
          return {
            ...similarity,
            similarMembers: processedSimilarMembers,
            totalSuggestions: filteredTotalSuggestions
          };
        })
      );
      
      setCrossUserSimilarities(processedSimilarities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching cross-user similarities:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestionRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notifications/suggestion-requests`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const serverRequests = data.data || [];
        
        // On initial load (when prev is empty), just use server requests
        // On subsequent calls, merge with temporary requests
        setSuggestionRequests(prev => {
          // If this is the initial load (prev is empty), just use server requests
          if (prev.length === 0) {
            return serverRequests;
          }
          
          // Otherwise, merge server requests with temporary requests
          const tempRequests = prev.filter(req => req.id.startsWith('temp-'));
          const mergedRequests = [...serverRequests];
          
          tempRequests.forEach(tempReq => {
            const hasServerEquivalent = serverRequests.some((serverReq: SuggestionRequest) => 
              serverReq.toUserId === tempReq.toUserId && 
              serverReq.currentMemberId === tempReq.currentMemberId
            );
            
            if (!hasServerEquivalent) {
              mergedRequests.push(tempReq);
            }
          });
          
          return mergedRequests;
        });
      }
    } catch (err) {
      console.error("Error fetching suggestion requests:", err);
    }
  };

  const sendSuggestionRequest = async (otherUserId: string, currentMemberId: string, requestedMemberId: string, suggestionCount: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Create a temporary pending request to show in UI immediately
    const tempRequest: SuggestionRequest = {
      id: `temp-${otherUserId}-${currentMemberId}-${Date.now()}`,
      fromUserId: 'current-user', // This will be replaced when we fetch real data
      fromUserName: 'You',
      toUserId: otherUserId,
      toUserName: 'Other User',
      status: 'pending',
      createdAt: new Date().toISOString(),
      suggestionCount,
      requestedMemberId: requestedMemberId,
      currentMemberId: currentMemberId,
      isIncoming: false,
      isOutgoing: true
    };

    try {
      // Add to loading state and immediately mark as pending
      setSendingRequests(prev => new Set(prev).add(`${otherUserId}-${currentMemberId}`));
      
      // Add temporary request to show pending state, replacing any existing request for this user-member combination
      setSuggestionRequests(prev => {
        // Remove any existing request for this user-member combination and add the new temporary one
        const filtered = prev.filter(req => !(req.toUserId === otherUserId && req.currentMemberId === currentMemberId));
        return [...filtered, tempRequest];
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notifications/suggestion-requests`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toUserId: otherUserId,
          suggestionCount,
          requestedMemberId: requestedMemberId,
          currentMemberId: currentMemberId
        })
      });

      if (response.ok) {
        toast.success("Suggestion request sent successfully!");
        // Don't refresh requests immediately - keep the temporary request
        // The temporary request will be replaced when the user refreshes the page or navigates away and back
      } else {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        
        // If the error is "pending request already exists", treat it as success
        if (errorData.message && errorData.message.includes("pending request already exists")) {
          toast.success("Request already sent - pending approval");
          // Don't refresh requests - keep the temporary request
        } else {
          toast.error(errorData.message || "Failed to send request - server error");
          // Keep the temporary request even on server error to show pending state
          console.log("Keeping temporary request despite server error");
        }
      }
    } catch (err) {
      toast.error("Failed to send suggestion request - network error");
      console.error("Error sending suggestion request:", err);
      
      // Keep the temporary request even on network error to show pending state
      console.log("Keeping temporary request despite network error");
      // Don't remove the temporary request, let it stay as pending
    } finally {
      // Remove from loading state
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${otherUserId}-${currentMemberId}`);
        return newSet;
      });
    }
  };

  const canSendRequest = (otherUserId: string, currentMemberId: string) => {
    // Can't send if already sending
    if (sendingRequests.has(`${otherUserId}-${currentMemberId}`)) {
      return false;
    }
    
    // Check if there's already a request for this user-member combination
    const request = suggestionRequests.find(req => req.toUserId === otherUserId && req.currentMemberId === currentMemberId);
    
    // Can only send if there's no request OR if the request was rejected
    // If there's a pending request, cannot send another one
    return !request || request.status === 'rejected';
  };

  // Helper function to clean suggestion text by removing HTML comments
  const cleanSuggestionText = (suggestion: string): string => {
    return suggestion.replace(/<!--SOURCE_MEMBER_ID:\w+-->/gi, '').trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading cross-user suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white"
    >
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
                Cross-User Suggestions
              </h1>
              <p className="text-gray-400 mt-2">
                Discover potential family connections from other users
              </p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            <button
              onClick={() => router.push('/dashboard/main')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-all duration-300 text-sm shadow-lg"
            >
              <User className="h-4 w-4" />
              Return to Dashboard
            </button>
            <button
              onClick={() => router.push('/dashboard/treeview')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transition-all duration-300 text-sm shadow-lg"
            >
              <Users className="h-4 w-4" />
              Treeview Page
            </button>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {crossUserSimilarities.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Cross-User Suggestions</h3>
              <p className="text-gray-500">
                No similar family members found from other users at this time.
              </p>
            </div>
          ) : (
            crossUserSimilarities.map((similarity, index) => (
              <motion.div
                key={similarity.otherUserId}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/20 rounded-lg">
                      <User className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {similarity.otherUserName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {similarity.totalSuggestions} possible suggestions/connections
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {similarity.similarMembers.length} potential match{similarity.similarMembers.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  {(() => {
                    // Calculate total suggestions count - use actual count from backend, not filtered count
                    const filteredTotalSuggestions = similarity.similarMembers.reduce((total, member) => {
                      // Count actual suggestions from backend response, regardless of access status
                      const actualSuggestionCount = member.suggestions ? member.suggestions.length : 0;
                      return total + actualSuggestionCount;
                    }, 0);

                    return (
                      <p className="text-gray-300 mb-4">
                        This user has {similarity.similarMembers.length} potential family member match{similarity.similarMembers.length !== 1 ? 'es' : ''} with you. 
                        You can request access to view details for each individual family member separately. 
                        Each request is for one specific family member only.
                      </p>
                    );
                  })()}

                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-teal-400" />
                      Potential Matches
                    </h4>
                    {similarity.similarMembers.map((member, memberIndex) => {
                      // Use the actual suggestions from the backend response
                      const actualSuggestions = member.suggestions || [];
                      
                      // Use the access status from the backend
                      const canView = member.hasAccess;
                      const hasPending = member.hasPendingRequest;
                      const hasRejected = member.hasRejectedRequest;

                      // Don't render if no actual suggestions AND no access
                      // If there's no access, we still want to show the member for potential access requests
                      if (!actualSuggestions || actualSuggestions.length === 0) {
                        // Only hide if there's no access AND no pending/rejected requests
                        if (!canView && !hasPending && !hasRejected) {
                          return null;
                        }
                      }

                      return (
                        <div key={memberIndex} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-white">
                                {member.currentMember.name} {member.currentMember.surname}
                              </h5>
                              <p className="text-sm text-gray-400">
                                {canView ? (
                                  <>Has access to details of: <span className="text-green-400">{member.otherMember.name} {member.otherMember.surname}</span></>
                                ) : hasPending ? (
                                  <>Requesting access to: <span className="text-yellow-400">{member.otherMember.name} {member.otherMember.surname}</span></>
                                ) : hasRejected ? (
                                  <>Access denied for: <span className="text-red-400">{member.otherMember.name} {member.otherMember.surname}</span></>
                                ) : (
                                  <>May have relation to: <span className="text-blue-400">{member.otherMember.name} {member.otherMember.surname}</span></>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full px-3 py-1">
                                {member.actualSuggestionCount || 0} suggestion{(member.actualSuggestionCount || 0) !== 1 ? 's' : ''}
                              </span>
                              {canView ? (
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs">Access Granted</span>
                                </div>
                              ) : hasPending || sendingRequests.has(`${similarity.otherUserId}-${member.currentMember.id}`) ? (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-xs">Request Pending</span>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    sendSuggestionRequest(similarity.otherUserId, member.currentMember.id, member.otherMember.id, member.actualSuggestionCount || 0);
                                  }}
                                  disabled={!canSendRequest(similarity.otherUserId, member.currentMember.id)}
                                  className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all duration-300 text-xs shadow-lg ${
                                    !canSendRequest(similarity.otherUserId, member.currentMember.id)
                                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                                      : "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
                                  }`}
                                >
                                  <Send className="h-3 w-3" />
                                  Request Access to {member.otherMember.name}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {canView ? (
                            <div className="space-y-2">
                              <h6 className="text-sm font-medium text-green-400">Detailed Suggestions:</h6>
                              {actualSuggestions.map((suggestion: string, suggestionIndex: number) => (
                                <div key={suggestionIndex} className="text-sm text-gray-300 bg-gray-700/50 rounded p-2">
                                  {cleanSuggestionText(suggestion)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600/20">
                              <div className="flex items-center gap-2 text-gray-400">
                                <EyeOff className="h-4 w-4" />
                                <span className="text-sm">
                                  {hasPending ? `Request pending approval for ${member.otherMember.name}` : 
                                   hasRejected ? `Request was rejected for ${member.otherMember.name}` : 
                                   `Request access to view details for ${member.otherMember.name}`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
