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
const ONBOARDING_KEY = "jeevan_rakshak_onboarding_completed";

export const PRIMARY_EMERGENCY_NUMBER = "8210950528";
export const SECONDARY_EMERGENCY_NUMBER = "9304673802";

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
    emergencyContacts: [],
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

export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function markOnboardingCompleted(): void {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function getEmergencyDialTargets(profile: MedicalProfile): EmergencyContact[] {
  const baseTargets: EmergencyContact[] = [
    {
      name: "Primary Emergency",
      relationship: "Emergency",
      phone: PRIMARY_EMERGENCY_NUMBER,
    },
    {
      name: "Secondary Emergency",
      relationship: "Emergency",
      phone: SECONDARY_EMERGENCY_NUMBER,
    },
    ...profile.emergencyContacts,
  ];

  const seen = new Set<string>();
  const cleanedTargets: EmergencyContact[] = [];

  for (const target of baseTargets) {
    const cleanedPhone = normalizePhone(target.phone);
    if (!cleanedPhone || seen.has(cleanedPhone)) continue;
    seen.add(cleanedPhone);
    cleanedTargets.push({ ...target, phone: cleanedPhone });
  }

  return cleanedTargets;
}
