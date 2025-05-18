/**
 * Service for handling medical history API requests
 */

// Get medical history for a family member
export async function getMedicalHistory(token: string, familyMemberId: string) {
  try {
    const response = await fetch(`http://localhost:3001/medical-history/family-member/${familyMemberId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching medical history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch medical history:', error);
    throw error;
  }
}

export async function saveMedicalHistory(token: string, medicalData: any) {
  try {
    // Determine if this is a new record or an update
    let url = 'http://localhost:3001/medical-history';
    let method = 'POST';

    if (medicalData._id) {
      url = `${url}/${medicalData._id}`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(medicalData)
    });

    if (!response.ok) {
      throw new Error(`Error saving medical history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to save medical history:', error);
    throw error;
  }
}

// Convert client-side health conditions object to API format
export function formatHealthConditionsForAPI(healthConditions: Record<string, boolean>) {
  // The API expects a simple object with condition names as keys and boolean values
  return healthConditions;
}

// Convert from API format back to client-side format
export function formatHealthConditionsFromAPI(healthConditions: Map<string, boolean> | Record<string, boolean>) {
  // If it's already an object, return it
  if (!healthConditions || typeof healthConditions !== 'object' || Array.isArray(healthConditions)) {
    return {};
  }

  // If it's a Map, convert to an object
  if (healthConditions instanceof Map) {
    const result: Record<string, boolean> = {};
    for (const [key, value] of healthConditions.entries()) {
      result[key] = value;
    }
    return result;
  }

  // If it's just a regular object with a toJSON method (MongoDB documents)
  if ('toJSON' in healthConditions) {
    return { ...healthConditions };
  }

  // Otherwise, it's already the right format
  return healthConditions as Record<string, boolean>;
} 