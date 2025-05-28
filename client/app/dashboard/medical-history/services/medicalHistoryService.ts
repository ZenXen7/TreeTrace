/**
 * Service for handling medical history API requests
 */

// Get medical history for a family member
export async function getMedicalHistory(token: string, familyMemberId: string) {
  try {
    const response = await fetch(`http://localhost:3001/medical-history/family-member/${familyMemberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Error fetching medical history: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch medical history:", error)
    throw error
  }
}

export async function saveMedicalHistory(token: string, medicalData: any) {
  try {
    // Convert array format to object format for API compatibility
    const apiData = { ...medicalData }

    // If healthConditions is an array, convert it to the object format the API expects
    if (Array.isArray(apiData.healthConditions)) {
      const conditionsObject: Record<string, boolean> = {}

      // Initialize all possible conditions to false
      const allConditions = [
        "diabetes",
        "hypertension",
        "asthma",
        "cancer",
        "heartDisease",
        "stroke",
        "alzheimers",
        "arthritis",
        "depression",
        "anxiety",
        "adhd",
        "allergies",
        "anemia",
        "autism",
        "bronchitis",
        "chronicFatigue",
        "chronicPain",
        "cirrhosis",
        "crohnsDisease",
        "dementia",
        "dermatitis",
        "eczema",
        "emphysema",
        "epilepsy",
        "fibromyalgia",
        "glaucoma",
        "gout",
        "hemophilia",
        "hepatitis",
        "highCholesterol",
        "hiv",
        "hypothyroidism",
        "hyperthyroidism",
        "ibs",
        "kidneyDisease",
        "leukemia",
        "lupus",
        "lymphoma",
        "migraines",
        "multiplesclerosis",
        "osteoporosis",
        "parkinsons",
        "pneumonia",
        "psoriasis",
        "ptsd",
        "rheumatoidArthritis",
        "schizophrenia",
        "sciatica",
        "scoliosis",
        "sleepApnea",
        "thyroidDisorder",
        "tuberculosis",
        "ulcer",
        "ulcerativeColitis",
      ]

      // Set all to false first
      allConditions.forEach((condition) => {
        conditionsObject[condition] = false
      })

      // Set selected conditions to true
      apiData.healthConditions.forEach((condition: string) => {
        // Convert display name back to camelCase key
        const key = convertDisplayNameToKey(condition)
        if (key) {
          conditionsObject[key] = true
        }
      })

      apiData.healthConditions = conditionsObject
    }

    // Determine if this is a new record or an update
    let url = "http://localhost:3001/medical-history"
    let method = "POST"

    if (apiData._id) {
      url = `${url}/${apiData._id}`
      method = "PATCH"
    }

    console.log("Sending medical data:", apiData) // Debug log

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(apiData),
    })

    if (!response.ok) {
      // Get more detailed error information
      let errorMessage = `Error saving medical history: ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = `Error saving medical history: ${errorData.message}`
        }
      } catch (e) {
        // If we can't parse the error response, use the status text
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error("Failed to save medical history:", error)
    throw error
  }
}

// Helper function to convert display names back to camelCase keys
function convertDisplayNameToKey(displayName: string): string | null {
  const mapping: Record<string, string> = {
    Diabetes: "diabetes",
    Hypertension: "hypertension",
    Asthma: "asthma",
    Cancer: "cancer",
    "Heart Disease": "heartDisease",
    Stroke: "stroke",
    "Alzheimer's": "alzheimers",
    Arthritis: "arthritis",
    Depression: "depression",
    Anxiety: "anxiety",
    ADHD: "adhd",
    Allergies: "allergies",
    Anemia: "anemia",
    Autism: "autism",
    Bronchitis: "bronchitis",
    "Chronic Fatigue": "chronicFatigue",
    "Chronic Pain": "chronicPain",
    Cirrhosis: "cirrhosis",
    "Crohn's Disease": "crohnsDisease",
    Dementia: "dementia",
    Dermatitis: "dermatitis",
    Eczema: "eczema",
    Emphysema: "emphysema",
    Epilepsy: "epilepsy",
    Fibromyalgia: "fibromyalgia",
    Glaucoma: "glaucoma",
    Gout: "gout",
    Hemophilia: "hemophilia",
    Hepatitis: "hepatitis",
    "High Cholesterol": "highCholesterol",
    HIV: "hiv",
    Hypothyroidism: "hypothyroidism",
    Hyperthyroidism: "hyperthyroidism",
    IBS: "ibs",
    "Kidney Disease": "kidneyDisease",
    Leukemia: "leukemia",
    Lupus: "lupus",
    Lymphoma: "lymphoma",
    Migraines: "migraines",
    "Multiple Sclerosis": "multiplesclerosis",
    Osteoporosis: "osteoporosis",
    "Parkinson's": "parkinsons",
    Pneumonia: "pneumonia",
    Psoriasis: "psoriasis",
    PTSD: "ptsd",
    "Rheumatoid Arthritis": "rheumatoidArthritis",
    Schizophrenia: "schizophrenia",
    Sciatica: "sciatica",
    Scoliosis: "scoliosis",
    "Sleep Apnea": "sleepApnea",
    "Thyroid Disorder": "thyroidDisorder",
    Tuberculosis: "tuberculosis",
    Ulcer: "ulcer",
    "Ulcerative Colitis": "ulcerativeColitis",
  }

  return mapping[displayName] || null
}

// Helper function to convert camelCase keys to display names
function convertKeyToDisplayName(key: string): string {
  const mapping: Record<string, string> = {
    diabetes: "Diabetes",
    hypertension: "Hypertension",
    asthma: "Asthma",
    cancer: "Cancer",
    heartDisease: "Heart Disease",
    stroke: "Stroke",
    alzheimers: "Alzheimer's",
    arthritis: "Arthritis",
    depression: "Depression",
    anxiety: "Anxiety",
    adhd: "ADHD",
    allergies: "Allergies",
    anemia: "Anemia",
    autism: "Autism",
    bronchitis: "Bronchitis",
    chronicFatigue: "Chronic Fatigue",
    chronicPain: "Chronic Pain",
    cirrhosis: "Cirrhosis",
    crohnsDisease: "Crohn's Disease",
    dementia: "Dementia",
    dermatitis: "Dermatitis",
    eczema: "Eczema",
    emphysema: "Emphysema",
    epilepsy: "Epilepsy",
    fibromyalgia: "Fibromyalgia",
    glaucoma: "Glaucoma",
    gout: "Gout",
    hemophilia: "Hemophilia",
    hepatitis: "Hepatitis",
    highCholesterol: "High Cholesterol",
    hiv: "HIV",
    hypothyroidism: "Hypothyroidism",
    hyperthyroidism: "Hyperthyroidism",
    ibs: "IBS",
    kidneyDisease: "Kidney Disease",
    leukemia: "Leukemia",
    lupus: "Lupus",
    lymphoma: "Lymphoma",
    migraines: "Migraines",
    multiplesclerosis: "Multiple Sclerosis",
    osteoporosis: "Osteoporosis",
    parkinsons: "Parkinson's",
    pneumonia: "Pneumonia",
    psoriasis: "Psoriasis",
    ptsd: "PTSD",
    rheumatoidArthritis: "Rheumatoid Arthritis",
    schizophrenia: "Schizophrenia",
    sciatica: "Sciatica",
    scoliosis: "Scoliosis",
    sleepApnea: "Sleep Apnea",
    thyroidDisorder: "Thyroid Disorder",
    tuberculosis: "Tuberculosis",
    ulcer: "Ulcer",
    ulcerativeColitis: "Ulcerative Colitis",
  }

  return mapping[key] || key
}

// Convert client-side health conditions object to API format
export function formatHealthConditionsForAPI(healthConditions: Record<string, boolean>) {
  // The API expects a simple object with condition names as keys and boolean values
  return healthConditions
}

// Convert from API format back to client-side format (now returns array)
export function formatHealthConditionsFromAPI(
  healthConditions: Map<string, boolean> | Record<string, boolean> | string[],
): string[] {
  // If it's already an array, return it
  if (Array.isArray(healthConditions)) {
    return healthConditions
  }

  // If it's null or undefined, return empty array
  if (!healthConditions || typeof healthConditions !== "object") {
    return []
  }

  let conditionsObject: Record<string, boolean> = {}

  // If it's a Map, convert to an object
  if (healthConditions instanceof Map) {
    for (const [key, value] of healthConditions.entries()) {
      conditionsObject[key] = value
    }
  } else {
    // If it's just a regular object with a toJSON method (MongoDB documents)
    if ("toJSON" in healthConditions) {
      conditionsObject = { ...healthConditions }
    } else {
      // Otherwise, it's already the right format
      conditionsObject = healthConditions as Record<string, boolean>
    }
  }

  // Convert object to array of selected condition names
  const selectedConditions: string[] = []
  Object.entries(conditionsObject).forEach(([key, value]) => {
    if (value === true) {
      const displayName = convertKeyToDisplayName(key)
      selectedConditions.push(displayName)
    }
  })

  return selectedConditions
}
