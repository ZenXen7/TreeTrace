const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/family-members";

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
  console.log("Sending filters to API:", filters);
  
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
  
  console.log("Fetching from URL:", url);
  
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
    console.log("Sending member data:", memberData);
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
    console.log("Server response:", result);
    
    // Explicitly check for similar family members
    try {
      const newMemberId = result.data._id;
      console.log("Triggering check for similar family members for new member:", newMemberId);
      
      const checkResponse = await fetch(`http://localhost:3001/notifications/check-similar-family-members/${newMemberId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (checkResponse.ok) {
        console.log("Similar family members check completed successfully for new member");
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
    // Log only necessary node properties instead of the entire node object
    // to avoid circular reference issues
    console.log("handleAddMember called with:", { 
      relation, 
      nodeInfo: {
        id: node.id || node._id,
        name: node.name,
        gender: node.gender,
        fid: node.fid,
        mid: node.mid,
        hasPartner: node.pids && node.pids.length > 0
      },
      newMemberData: newMemberData || null 
    });
    
    if (relation === "son" || relation === "daughter") {
      // ENHANCED DEBUGGING: Verify consistency between relation and gender
      console.log("GENDER DEBUG - Adding child with relation:", relation);
      console.log("GENDER DEBUG - Gender from newMemberData:", newMemberData?.gender);
      
      // Validate relation and gender consistency
      const expectedGender = relation === "son" ? "male" : "female";
      if (newMemberData?.gender && newMemberData.gender !== expectedGender) {
        console.warn(`GENDER MISMATCH DETECTED: Relation is "${relation}" but gender is "${newMemberData.gender}"`);
        // Force correction to ensure consistency
        console.log(`GENDER DEBUG - Correcting gender to match relation: ${expectedGender}`);
        newMemberData.gender = expectedGender;
      }
      
      // Determine the parent ID based on the node's gender
      const parentId = node.id || node._id;
      
      // Prepare data considering both parents when applicable
      const childData: any = {
        ...newMemberData,
        status: "alive",
        country: newMemberData?.country || "",
        occupation: newMemberData?.occupation || "",
        _parentId: parentId // Extra field for compatibility with different code paths
      };
      
      // Check if the parent has a partner
      const hasPartner = node.pids && node.pids.length > 0;
      const partnerId = hasPartner ? node.pids[0] : undefined;
      
      // IMPORTANT: Ensure gender is explicitly set from newMemberData
      // This follows the same pattern used for parent gender handling
      if (!childData.gender) {
        childData.gender = relation === "son" ? "male" : "female";
        console.log("No explicit gender in newMemberData, using relation:", childData.gender);
      } else {
        console.log("Using explicit gender from newMemberData:", childData.gender);
      }
      
      // Set appropriate parent fields based on gender
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
      console.log("Creating child with data:", childData);
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
      console.log("Using provided member data:", newMemberData);
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
        console.log("Adding father with data:", memberData);
        console.log("Child node data:", node);
        if (node.mid) {
          memberData.partnerId = [node.mid];
          existingParentUpdate = {
            id: node.mid,
            update: { partnerId: [] },
          };
        }
        const father = await addFamilyMember(token, memberData);
        const fatherId = father.id || father["_id"] || father.data?._id;
        console.log("Created father with ID:", fatherId);
        updateCurrentNode.fatherId = fatherId;

        if (existingParentUpdate) {
          existingParentUpdate.update.partnerId = [fatherId];
        }
        break;

      case "mother":
        memberData.gender = "female";
        console.log("Adding mother with data:", memberData);
        console.log("Child node data:", node);
        if (node.fid) {
          memberData.partnerId = [node.fid];
          existingParentUpdate = {
            id: node.fid,
            update: { partnerId: [] },
          };
        }
        const mother = await addFamilyMember(token, memberData);
        const motherId = mother.id || mother["_id"] || mother.data?._id;
        console.log("Created mother with ID:", motherId);
        updateCurrentNode.motherId = motherId;

        if (existingParentUpdate) {
          existingParentUpdate.update.partnerId = [motherId];
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
    
    console.log("Updating family member with ID:", nodeId, "with data:", updateCurrentNode);
    try {
      await updateFamilyMember(token, nodeId, updateCurrentNode);
    } catch (updateError) {
      console.error("Error updating the family member:", updateError);
      
      // Even though the update failed, we've already created the parent
      // We should inform the user and proceed with fetch
      console.log("Parent was created but couldn't update the child's parent reference");
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
            `Consider adding child "${memberToDelete.name}"`
          ];
          
          await fetch(`http://localhost:3001/notifications/unmark-suggestions`, {
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
            `Consider adding child "${memberToDelete.name}"`
          ];
          
          await fetch(`http://localhost:3001/notifications/unmark-suggestions`, {
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
        await fetch(`http://localhost:3001/notifications/unmark-suggestions`, {
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
    const response = await fetch(`http://localhost:3001/notifications/member-similarities/${memberId}`, {
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
    const memberResponse = await fetch(`http://localhost:3001/family-members/${memberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!memberResponse.ok) {
      return 0;
    }

    const memberResult = await memberResponse.json();
    const memberData = memberResult.data || memberResult;
    
    // Debug log for member being processed
    console.log(`Processing suggestions for member ${memberData.name} (ID: ${memberId})`);

    // Fetch any applied suggestions
    const processedResponse = await fetch(`http://localhost:3001/notifications/processed-suggestions/${memberId}`, {
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
    const response = await fetch(`http://localhost:3001/notifications/member-similarities/${memberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const result = await response.json();
    const suggestionsData = result.data;

    if (!suggestionsData || !suggestionsData.similarMembers) {
      return 0;
    }
    
    // Fetch partner information to filter partner suggestions
    let partnerInfo: {name: string, id: string}[] = [];
    if (memberData.partnerId && memberData.partnerId.length > 0) {
      try {
        const partnerPromises = memberData.partnerId.map(async (partnerId: string) => {
          const partnerResponse = await fetch(`http://localhost:3001/family-members/${partnerId}`, {
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
          const childResponse = await fetch(`http://localhost:3001/family-members/${childId}`, {
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
    let displayCount = 0;
    
    if (suggestionsData && suggestionsData.similarMembers) {
      displayCount = suggestionsData.similarMembers.reduce((count: number, member: any) => {
        const validSuggestions = member.suggestions.filter((suggestion: string) => {
          // Skip applied suggestions
          if (appliedSuggestions.includes(suggestion)) return false;
          
          // Filter out partner suggestions if needed
          if (suggestion.includes("adding partner") || suggestion.includes("Consider adding partner")) {
            const partnerNameMatch = suggestion.match(/partner "([^"]+)"/i);
            if (partnerNameMatch && partnerNameMatch[1] && memberData) {
              const suggestedPartnerName = partnerNameMatch[1].trim().toLowerCase();
              if (memberData.partnerId && memberData.partnerId.length > 0) {
                if (partnerInfo.some(p => 
                  p.name.toLowerCase().includes(suggestedPartnerName) ||
                  suggestedPartnerName.includes(p.name.toLowerCase()))) {
                  return false;
                }
              }
            }
          }
          
          // Filter out child suggestions if the child is already connected to this member
          if (suggestion.includes("adding child") || suggestion.includes("more children")) {
            const childNameMatch = suggestion.match(/child "([^"]+)"/i);
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
                  // No child info but member has children, be conservative
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
    
    console.log(`After filtering, found ${displayCount} valid suggestions for ${memberData.name}`);
    return displayCount;
  } catch (error) {
    console.error("Error fetching member suggestion count:", error);
    return 0;
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