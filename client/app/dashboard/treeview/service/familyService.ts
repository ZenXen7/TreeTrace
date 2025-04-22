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
    if (relation === "son" || relation === "daughter") {
      const child = await addFamilyMember(token, {
        ...newMemberData,
        status: "alive"
      });
      await fetchData();
      return;
    }

    let memberData: any = { 
      name: "Unknown",
      status: "alive"
    };
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
        break;

      case "wife":
      case "husband": {
        memberData.gender = relation === "wife" ? "female" : "male";
        memberData.partnerId = [node.id];
        const partner = await addFamilyMember(token, memberData);
        const partnerId = partner.id || partner["_id"] || partner.data?._id;
        updateCurrentNode.partnerId = [partnerId];

        // Update existing children's parent IDs
        const children = await fetchFamilyMembers(token);
        const nodeChildren = children.filter(
          (child: any) =>
            (node.gender === "male" && child.fatherId === node.id) ||
            (node.gender === "female" && child.motherId === node.id)
        );

        for (const child of nodeChildren) {
          const updateData = node.gender === "male" 
            ? { motherId: partnerId }
            : { fatherId: partnerId };
          await updateFamilyMember(token, child._id, updateData);
        }
        break;
      }

      default:
        return;
    }

    await updateFamilyMember(token, node.id, updateCurrentNode);

    if (existingParentUpdate) {
      await updateFamilyMember(
        token,
        existingParentUpdate.id,
        existingParentUpdate.update
      );
    }

    await fetchData();
  } catch (error) {
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

export {
  fetchFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  handleAddMember,
  deleteFamilyMember, 
};
