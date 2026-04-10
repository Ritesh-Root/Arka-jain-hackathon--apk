export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface MedicalProfile {
  fullName: string;
  dob: string;
  age: number;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: { name: string; dose: string }[];
  emergencyContacts: EmergencyContact[];
  publicToken: string;
}

const PROFILE_KEY = "jeevan_rakshak_profile";

export function getDefaultProfile(): MedicalProfile {
  return {
    fullName: "Anita Sharma",
    dob: "1958-03-15",
    age: 68,
    bloodType: "B+",
    allergies: ["Penicillin", "Sulfa drugs"],
    conditions: ["Hypertension", "Type 2 Diabetes"],
    medications: [
      { name: "Telmisartan", dose: "40mg" },
      { name: "Metformin", dose: "500mg" },
    ],
    emergencyContacts: [
      { name: "Vikram Sharma", relationship: "Son", phone: "+919800012345" },
      { name: "Priya Sharma", relationship: "Daughter", phone: "+919900054321" },
      { name: "Dr. Kavita", relationship: "Doctor", phone: "+919700098765" },
    ],
    publicToken: crypto.randomUUID(),
  };
}

export function saveProfile(profile: MedicalProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): MedicalProfile {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) return JSON.parse(stored);
  const def = getDefaultProfile();
  saveProfile(def);
  return def;
}
