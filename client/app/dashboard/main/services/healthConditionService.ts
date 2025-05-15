import { HealthCondition } from "../../../../src/types/health-condition";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/family-members";

export const getHealthConditions = async (memberId: string): Promise<HealthCondition[]> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`${API_URL}/${memberId}/health-conditions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("API Error Details:", errorDetails);
      throw new Error(`Failed to fetch health conditions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching health conditions:", error);
    throw error;
  }
};

// Add a new health condition
export const addHealthCondition = async (
  memberId: string,
  healthCondition: Partial<HealthCondition>
): Promise<HealthCondition> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`${API_URL}/${memberId}/health-conditions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(healthCondition),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("API Error Details:", errorDetails);
      throw new Error(`Failed to add health condition: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error adding health condition:", error);
    throw error;
  }
};

export const updateHealthCondition = async (
  id: string,
  healthCondition: Partial<HealthCondition>
): Promise<HealthCondition> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`${API_URL}/health-conditions/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(healthCondition),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("API Error Details:", errorDetails);
      throw new Error(`Failed to update health condition: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating health condition:", error);
    throw error;
  }
};

export const removeHealthCondition = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`${API_URL}/health-conditions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("API Error Details:", errorDetails);
      throw new Error(`Failed to delete health condition: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting health condition:", error);
    throw error;
  }
}; 