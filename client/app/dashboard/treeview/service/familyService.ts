const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "${API_BASE_URL}";
const API_URL = `${API_BASE_URL}/family-members`;

async function fetchFamilyMembers(token: string) {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch family members");
  }
  const result = await response.json();
  return Array.isArray(result) ? result : result.data;
}

// New function to fetch family members with filters
async function fetchFilteredFamilyMembers(token: string, filters: { 
  gender?: string;
  country?: string;
  status?: string;
}) {
  
  // Build URL with query parameters for filters
  let url = API_URL;
  const queryParams: string[] = [];

  // Only add non-'all' filters
  if (filters.gender && filters.gender !== 'all') {
    queryParams.push(`gender=${filters.gender}`);
  }
  
  if (filters.country && filters.country !== 'all') {
    queryParams.push(`country=${filters.country}`);
  }
  
  if (filters.status && filters.status !== 'all') {
    queryParams.push(`status=${filters.status}`);
  }
  
  // Add query params to URL if we have any
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  
  // Make the API request
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch filtered family members");
  }
  
  const result = await response.json();
  return Array.isArray(result) ? result : result.data;
}

async function addFamilyMember(token: string, memberData: any) {
  try {
    // Ensure gender is properly normalized for consistency
    if (memberData.gender) {
      const normalizedGender = memberData.gender.toLowerCase();
      memberData.gender = normalizedGender === "male" ? "male" : "female";
    } else {
      console.warn("No gender specified for member creation. This might cause issues.");
    }
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      throw new Error("Failed to add family member");
    }

    const result = await response.json();
    
    // Explicitly check for similar family members
    try {
      const newMemberId = result.data._id;
      
      const checkResponse = await fetch(`${API_BASE_URL}/notifications/check-similar-family-members/${newMemberId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (checkResponse.ok) {
      } else {
        console.error("Failed to check for similar family members for new member:", await checkResponse.text());
      }
    } catch (checkError) {
      console.error("Error checking for similar family members:", checkError);
    }
    
    return result;
  } catch (error) {
    console.error("Error in addFamilyMember:", error);
    throw error;
  }
}

async function updateFamilyMember(
  token: string,
  memberId: string,
  memberData: any
) {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(memberData),
  });
  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("API Error Details:", errorDetails);
    throw new Error("Failed to update family member");
  }
  return response.json();
}

async function handleAddMember(
  token: string,
  node: any,
  relation: string,
  fetchData: () => Promise<void>,
  newMemberData?: any
) {
  try {
    // Log only necessary node properties
    console.log("handleAddMember called with:", { 
      relation, 
      nodeInfo: {
        id: node.id || node._id,
        name: node.name,
        gender: node.gender,
      },
      newMemberDataGender: newMemberData?.gender || null
    });
    
    if (relation === "son" || relation === "daughter") {
      // Set gender based on relation (same approach as with father/mother)
      // This ensures consistency between relation and gender
      const gender = relation === "son" ? "male" : "female";
      
      
      // Determine the parent ID
      const parentId = node.id || node._id;
      
      // Prepare data with gender determined by relation
      const childData: any = {
        ...newMemberData,
        gender: gender, // Always set gender based on relation
        status: "alive",
        country: newMemberData?.country || "",
        occupation: newMemberData?.occupation || "",
        _parentId: parentId // Extra field for compatibility with different code paths
      };
      
      // Check if the parent has a partner
      const hasPartner = node.pids && node.pids.length > 0;
      const partnerId = hasPartner ? node.pids[0] : undefined;
      
      // Set appropriate parent fields based on parent's gender
      if (node.gender === "male") {
        childData.fatherId = parentId;
        if (hasPartner) {
          childData.motherId = partnerId;
        }
      } else if (node.gender === "female") {
        childData.motherId = parentId;
        if (hasPartner) {
          childData.fatherId = partnerId;
        }
      }
      
      // Create the child with proper parent relationships

      // FINAL CRITICAL GENDER CHECK - ensure daughter relation has female gender and son relation has male gender
      if (relation === "daughter" && childData.gender !== "female") {
        console.warn("CRITICAL GENDER OVERRIDE: Relation is 'daughter' but gender is not female. Forcing gender to female.");
        childData.gender = "female";
      } else if (relation === "son" && childData.gender !== "male") {
        console.warn("CRITICAL GENDER OVERRIDE: Relation is 'son' but gender is not male. Forcing gender to male.");
        childData.gender = "male";
      }
      
      const child = await addFamilyMember(token, childData);

      // Correctly extract the childId from the response
      const childId = child.data?._id || child.id || child._id;
      if (!childId) {
        console.error("Failed to get childId from addFamilyMember response", child);
        return;
      }
      const updates = [];

      // Update father's childId if present
      if (node.gender === "male" || (node.pids && node.pids[0])) {
        const fatherId = node.gender === "male" ? node.id : node.pids[0];
        const fatherData = await fetchFamilyMembers(token).then(members => 
          members.find((m: any) => m._id === fatherId)
        );
        const existingChildIds = (fatherData?.childId || []).filter(Boolean);
        updates.push(updateFamilyMember(token, fatherId, {
          childId: [...existingChildIds, childId].filter(Boolean)
        }));
      }

      // Update mother's childId if present
      if (node.gender === "female" || (node.pids && node.pids[0])) {
        const motherId = node.gender === "female" ? node.id : node.pids[0];
        const motherData = await fetchFamilyMembers(token).then(members => 
          members.find((m: any) => m._id === motherId)
        );
        const existingChildIds = (motherData?.childId || []).filter(Boolean);
        updates.push(updateFamilyMember(token, motherId, {
          childId: [...existingChildIds, childId].filter(Boolean)
        }));
      }

      await Promise.all(updates);
      
      // Mark child suggestions as processed for both parents
      try {
        const childName = childData.name || "Unknown";
        const childPatterns = [
          `adding child "${childName}"`,
          `child "${childName}"`,
          `Consider adding child "${childName}"`,
          `Consider adding son "${childName}"`,
          `Consider adding daughter "${childName}"`,
          `son "${childName}"`,
          `daughter "${childName}"`
        ];
        
        // Mark suggestions as processed for the parent who added the child
        await fetch(`${API_BASE_URL}/notifications/mark-suggestion-processed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            memberId: parentId,
            suggestionText: `adding ${relation} "${childName}"`
          })
        });
        
        // If there's a partner, also mark suggestions as processed for them
        if (hasPartner && partnerId) {
          await fetch(`${API_BASE_URL}/notifications/mark-suggestion-processed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: partnerId,
              suggestionText: `adding ${relation} "${childName}"`
            })
          });
        }
      } catch (err) {
        console.warn("Could not mark child suggestions as processed:", err);
      }
      
      await fetchData();
      return;
    }

    // Base member data - will be overridden with newMemberData if provided
    let memberData: any = { 
      name: "Unknown",
      status: "alive",
      country: "",
      occupation: ""
    };
    
    // If we have newMemberData, use it to override defaults
    if (newMemberData) {
      memberData = {
        ...memberData,
        ...newMemberData
      };
    }
    
    let updateCurrentNode: any = {};
    let existingParentUpdate: any = null;

    switch (relation) {
      case "father":
        memberData.gender = "male";
        if (node.mid) {
          memberData.partnerId = [node.mid];
          existingParentUpdate = {
            id: node.mid,
            update: { partnerId: [] },
          };
        }
        const father = await addFamilyMember(token, memberData);
        const fatherId = father.id || father["_id"] || father.data?._id;
        updateCurrentNode.fatherId = fatherId;

        if (existingParentUpdate) {
          existingParentUpdate.update.partnerId = [fatherId];
        }
        
        // Mark father suggestions as processed
        try {
          const fatherName = memberData.name || "Unknown";
          const childName = node.name || "Unknown";
          const currentNodeId = node._id || node.id;
          
          // Mark suggestions as processed for the child
          await fetch(`${API_BASE_URL}/notifications/mark-suggestion-processed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: currentNodeId,
              suggestionText: `adding father "${fatherName}"`
            })
          });
          
          // Mark suggestions as processed for the father
          await fetch(`${API_BASE_URL}/notifications/mark-suggestion-processed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: fatherId,
              suggestionText: `adding child "${childName}"`
            })
          });
        } catch (err) {
          console.warn("Could not mark father suggestions as processed:", err);
        }
        
        break;

      case "mother":
        memberData.gender = "female";
        if (node.fid) {
          memberData.partnerId = [node.fid];
          existingParentUpdate = {
            id: node.fid,
            update: { partnerId: [] },
          };
        }
        const mother = await addFamilyMember(token, memberData);
        const motherId = mother.id || mother["_id"] || mother.data?._id;
        updateCurrentNode.motherId = motherId;

        if (existingParentUpdate) {
          existingParentUpdate.update.partnerId = [motherId];
        }
        
        // Mark mother suggestions as processed
        try {
          const motherName = memberData.name || "Unknown";
          const childName = node.name || "Unknown";
          const currentNodeId = node._id || node.id;
          
          // Mark suggestions as processed for the child
          await fetch(`${API_BASE_URL}/notifications/mark-suggestion-processed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: currentNodeId,
              suggestionText: `adding mother "${motherName}"`
            })
          });
          
          // Mark suggestions as processed for the mother
          await fetch(`${API_BASE_URL}/notifications/mark-suggestion-processed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: motherId,
              suggestionText: `adding child "${childName}"`
            })
          });
        } catch (err) {
          console.warn("Could not mark mother suggestions as processed:", err);
        }
        
        break;

      case "wife":
      case "husband": {
        memberData.gender = relation === "wife" ? "female" : "male";
        memberData.partnerId = [node.id || node._id];
        const partner = await addFamilyMember(token, memberData);
        const partnerId = partner.id || partner["_id"] || partner.data?._id;
        updateCurrentNode.partnerId = [partnerId];

        // Update existing children's parent IDs and childId arrays
        const children = await fetchFamilyMembers(token);
        const nodeChildren = children.filter(
          (child: any) =>
            (node.gender === "male" && child.fatherId === (node.id || node._id)) ||
            (node.gender === "female" && child.motherId === (node.id || node._id))
        );

        // Get current partner's data to append to existing childId array
        const partnerData = await fetchFamilyMembers(token).then(members => 
          members.find((m: any) => m._id === partnerId)
        );
        const existingChildIds = partnerData?.childId || [];

        for (const child of nodeChildren) {
          const updateData = node.gender === "male" 
            ? { motherId: partnerId }
            : { fatherId: partnerId };
          await updateFamilyMember(token, child._id, updateData);
        }

        // Update partner's childId array with all children
        await updateFamilyMember(token, partnerId, {
          childId: [...existingChildIds, ...nodeChildren.map((child: any) => child._id)]
        });
        
        // Mark partner suggestions as processed for both members
        try {
          const partnerName = memberData.name || "Unknown";
          const currentMemberName = node.name || "Unknown";
          const currentNodeId = node._id || node.id;
          
          // Mark suggestions as processed for the current member
          await fetch(`${API_BASE_URL}/notifications/mark-suggestion-processed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: currentNodeId,
              suggestionText: `adding partner "${partnerName}"`
            })
          });
          
          // Mark suggestions as processed for the new partner
          await fetch(`${API_BASE_URL}/notifications/mark-suggestion-processed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: partnerId,
              suggestionText: `adding partner "${currentMemberName}"`
            })
          });
        } catch (err) {
          console.warn("Could not mark partner suggestions as processed:", err);
        }
        
        break;
      }

      default:
        return;
    }

    // Get the nodeId safely - use either id or _id, ensuring it's not undefined
    const nodeId = node._id || node.id;
    
    if (!nodeId) {
      console.error("No valid ID found for node:", JSON.stringify(node));
      console.error("Node type:", typeof node);
      console.error("Node keys:", Object.keys(node));
      throw new Error("Cannot update family member: No valid ID found");
    }
    try {
      await updateFamilyMember(token, nodeId, updateCurrentNode);
    } catch (updateError) {
      console.error("Error updating the family member:", updateError);
      
      // Even though the update failed, we've already created the parent
      // We should inform the user and proceed with fetch
    }

    if (existingParentUpdate) {
      try {
        await updateFamilyMember(
          token,
          existingParentUpdate.id,
          existingParentUpdate.update
        );
      } catch (partnerUpdateError) {
        console.error("Failed to update partner reference:", partnerUpdateError);
      }
    }

    // Always call fetchData to refresh the tree even if some updates failed
    await fetchData();
    
    // Return the result of the operation
    return {
      parentId: relation === "father" ? updateCurrentNode.fatherId : 
                relation === "mother" ? updateCurrentNode.motherId : null,
      childId: nodeId,
      relationship: relation,
      success: true
    };
  } catch (error) {
    console.error("handleAddMember failed:", error);
    throw error;
  }
}

async function deleteFamilyMember(token: string, memberId: string) {
  try {
    const allMembers = await fetchFamilyMembers(token);
    const memberToDelete = allMembers.find((member: any) => member._id === memberId);

    if (!memberToDelete) {
      throw new Error("Family member not found");
    }

    // Remove this member's ID from the childId array of both parents
    if (memberToDelete.fatherId) {
      const father = allMembers.find((m: any) => m._id === memberToDelete.fatherId);
      if (father) {
        const updatedChildIds = (father.childId || []).filter((cid: string) => cid !== memberId);
        await updateFamilyMember(token, father._id, { childId: updatedChildIds });
        
        // Unmark any child suggestions so the child can be suggested again
        try {
          const childPatterns = [
            `adding child "${memberToDelete.name}"`,
            `child "${memberToDelete.name}"`,
            `Consider adding child "${memberToDelete.name}"`,
            `Consider adding son "${memberToDelete.name}"`,
            `Consider adding daughter "${memberToDelete.name}"`,
            `son "${memberToDelete.name}"`,
            `daughter "${memberToDelete.name}"`
          ];
          
          await fetch(`${API_BASE_URL}/notifications/unmark-suggestions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberIds: [father._id],
              patterns: childPatterns
            })
          });
        } catch (err) {
          console.warn("Could not unmark child suggestions for father:", err);
        }
      }
    }
    
    if (memberToDelete.motherId) {
      const mother = allMembers.find((m: any) => m._id === memberToDelete.motherId);
      if (mother) {
        const updatedChildIds = (mother.childId || []).filter((cid: string) => cid !== memberId);
        await updateFamilyMember(token, mother._id, { childId: updatedChildIds });
        
        // Unmark any child suggestions so the child can be suggested again
        try {
          const childPatterns = [
            `adding child "${memberToDelete.name}"`,
            `child "${memberToDelete.name}"`,
            `Consider adding child "${memberToDelete.name}"`,
            `Consider adding son "${memberToDelete.name}"`,
            `Consider adding daughter "${memberToDelete.name}"`,
            `son "${memberToDelete.name}"`,
            `daughter "${memberToDelete.name}"`
          ];
          
          await fetch(`${API_BASE_URL}/notifications/unmark-suggestions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberIds: [mother._id],
              patterns: childPatterns
            })
          });
        } catch (err) {
          console.warn("Could not unmark child suggestions for mother:", err);
        }
      }
    }

    const children = allMembers.filter(
      (member: any) => member.fatherId === memberId || member.motherId === memberId
    );
    const partner = memberToDelete.partnerId?.[0]
      ? allMembers.find((member: any) => member._id === memberToDelete.partnerId[0])
      : null;

    for (const child of children) {
      const updateData: any = {};
      if (child.fatherId === memberId) {
        updateData.fatherId = null;
      }
      if (child.motherId === memberId) {
        updateData.motherId = null;
      }
      await updateFamilyMember(token, child._id, updateData);
      
      // Unmark parent suggestions for the child so the parent can be suggested again
      const parentType = memberToDelete.gender === "male" ? "father" : "mother";
      try {
        const parentPatterns = [
          `adding ${parentType} "${memberToDelete.name}"`,
          `${parentType} "${memberToDelete.name}"`,
          `Consider adding ${parentType} "${memberToDelete.name}"`
        ];
        
        await fetch(`${API_BASE_URL}/notifications/unmark-suggestions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            memberIds: [child._id],
            patterns: parentPatterns
          })
        });
      } catch (err) {
        console.warn(`Could not unmark ${parentType} suggestions for child:`, err);
      }
    }

    if (partner) {
      const updatedPartnerIds = partner.partnerId.filter((pid: string) => pid !== memberId);
      await updateFamilyMember(token, partner._id, { partnerId: updatedPartnerIds });

      // Unmark any partnership suggestions between these members
      try {
        // Find suggestions related to partner relationships
        const partnershipPatterns = [
          `adding partner "${memberToDelete.name}"`,
          `partner "${memberToDelete.name}"`,
          `Consider adding partner "${memberToDelete.name}"`,
          `adding partner "${partner.name}"`,
          `partner "${partner.name}"`,
          `Consider adding partner "${partner.name}"`
        ];

        // Remove processed suggestions that match these patterns
        await fetch(`${API_BASE_URL}/notifications/unmark-suggestions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            memberIds: [memberId, partner._id],
            patterns: partnershipPatterns
          })
        });
      } catch (err) {
        console.warn("Could not unmark partnership suggestions:", err);
      }
    }

    const response = await fetch(`${API_URL}/${memberId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("API Error Details:", errorDetails);
      throw new Error("Failed to delete family member");
    }

    return response.json();
  } catch (error) {
    console.error("Error in deleteFamilyMember:", error);
    throw error;
  }
}

// New function to get surname similarities count for a specific family member
async function getSurnameSimilaritiesCount(token: string, memberId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/member-similarities/${memberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to get surname similarities count");
    }
    
    const result = await response.json();
    return result.data.count;
  } catch (error) {
    console.error("Error in getSurnameSimilaritiesCount:", error);
    throw error;
  }
}

async function getMemberSuggestionCount(token: string, memberId: string) {
  try {
    // First fetch member data to filter suggestions properly
    const memberResponse = await fetch(`${API_BASE_URL}/family-members/${memberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!memberResponse.ok) {
      return { filteredCount: 0, actualCount: 0 };
    }

    const memberResult = await memberResponse.json();
    const memberData = memberResult.data || memberResult;
    
    // Debug log for member being processed

    // Fetch any applied suggestions
    const processedResponse = await fetch(`${API_BASE_URL}/notifications/processed-suggestions/${memberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    let appliedSuggestions: string[] = [];
    if (processedResponse.ok) {
      const processedResult = await processedResponse.json();
      appliedSuggestions = processedResult.data || [];
    }

    // Get all suggestions for this member
    const response = await fetch(`${API_BASE_URL}/notifications/member-similarities/${memberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return { filteredCount: 0, actualCount: 0 };
    }
    
    const result = await response.json();
    const suggestionsData = result.data;

    if (!suggestionsData || !suggestionsData.similarMembers) {
      return { filteredCount: 0, actualCount: 0 };
    }
    
    // Fetch partner information to filter partner suggestions
    let partnerInfo: {name: string, id: string}[] = [];
    if (memberData.partnerId && memberData.partnerId.length > 0) {
      try {
        const partnerPromises = memberData.partnerId.map(async (partnerId: string) => {
          const partnerResponse = await fetch(`${API_BASE_URL}/family-members/${partnerId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (!partnerResponse.ok) {
            return { id: partnerId, name: "Unknown Partner" };
          }
          
          const partnerResult = await partnerResponse.json();
          const partnerData = partnerResult.data || partnerResult;
          
          return {
            id: partnerId,
            name: partnerData.name || "Unknown Partner"
          };
        });
        
        partnerInfo = await Promise.all(partnerPromises);
      } catch (error) {
        console.error("Error fetching partner information:", error);
      }
    }
    
    // Fetch child information to filter child suggestions
    let childInfo: {name: string, id: string}[] = [];
    if (memberData.childId && memberData.childId.length > 0) {
      try {
        const childPromises = memberData.childId.map(async (childId: string) => {
          const childResponse = await fetch(`${API_BASE_URL}/family-members/${childId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (!childResponse.ok) {
            return { id: childId, name: "Unknown Child" };
          }
          
          const childResult = await childResponse.json();
          const childData = childResult.data || childResult;
          
          return {
            id: childId,
            name: childData.name || "Unknown Child"
          };
        });
        
        childInfo = await Promise.all(childPromises);
      } catch (error) {
        console.error("Error fetching child information:", error);
      }
    }
    
    // Count suggestions using EXACTLY the same logic as the suggestions page
    // This matches the code in client/app/dashboard/suggestions/[memberId]/page.tsx
    let filteredCount = 0;
    let actualCount = suggestionsData.actualSuggestionCount || 0; // Get actual count from backend
    
    if (suggestionsData && suggestionsData.similarMembers) {
      filteredCount = suggestionsData.similarMembers.reduce((count: number, member: any) => {
        const validSuggestions = member.suggestions.filter((suggestion: string) => {
          // Skip applied suggestions
          if (appliedSuggestions.includes(suggestion)) return false;
          
          // Filter out partner suggestions if needed
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
        
        return count + validSuggestions.length;
      }, 0);
    }
    
    return { filteredCount, actualCount };
  } catch (error) {
    console.error("Error fetching member suggestion count:", error);
    return { filteredCount: 0, actualCount: 0 };
  }
}

export {
  fetchFamilyMembers,
  fetchFilteredFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  handleAddMember,
  deleteFamilyMember,
  getSurnameSimilaritiesCount,
  getMemberSuggestionCount
};