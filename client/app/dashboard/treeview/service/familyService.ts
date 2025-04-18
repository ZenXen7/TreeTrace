const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/family-members";

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
  return response.json();
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
    throw new Error("Failed to update family member");
  }
  return response.json();
}

export { fetchFamilyMembers, addFamilyMember, updateFamilyMember };
