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
      }
    }
    if (memberToDelete.motherId) {
      const mother = allMembers.find((m: any) => m._id === memberToDelete.motherId);
      if (mother) {
        const updatedChildIds = (mother.childId || []).filter((cid: string) => cid !== memberId);
        await updateFamilyMember(token, mother._id, { childId: updatedChildIds });
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
    // Return the suggestion count instead of similarity count
    return result.data?.suggestionCount || 0;
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