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
  lastUpdatedAt: number;
}

export interface AppSettings {
  shakeSOSEnabled: boolean;
}

const PROFILE_KEY = "jeevan_rakshak_profile";
const ONBOARDING_KEY = "jeevan_rakshak_onboarding_completed";
const SETTINGS_KEY = "jeevan_rakshak_settings";

export const PROFILE_UPDATED_EVENT = "jr_profile_updated";
export const SETTINGS_UPDATED_EVENT = "jr_settings_updated";

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
    lastUpdatedAt: Date.now(),
  };
}

export function getDefaultSettings(): AppSettings {
  return {
    shakeSOSEnabled: false,
  };
}

export function saveProfile(profile: MedicalProfile): void {
  const toStore: MedicalProfile = {
    ...profile,
    publicToken: profile.publicToken || crypto.randomUUID(),
    lastUpdatedAt: Date.now(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(toStore));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  }
}

export function loadProfile(): MedicalProfile {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<MedicalProfile>;
      const base = getDefaultProfile();
      const merged: MedicalProfile = {
        ...base,
        ...parsed,
        allergies: Array.isArray(parsed.allergies) ? parsed.allergies : base.allergies,
        conditions: Array.isArray(parsed.conditions) ? parsed.conditions : base.conditions,
        medications: Array.isArray(parsed.medications) ? parsed.medications : base.medications,
        emergencyContacts: Array.isArray(parsed.emergencyContacts)
          ? parsed.emergencyContacts
          : base.emergencyContacts,
        publicToken: parsed.publicToken || base.publicToken,
        lastUpdatedAt:
          typeof parsed.lastUpdatedAt === "number" ? parsed.lastUpdatedAt : Date.now(),
      };
      return merged;
    } catch {
      // Fall through to default profile regeneration.
    }
  }
  const def = getDefaultProfile();
  saveProfile(def);
  return def;
}

export function saveSettings(settings: AppSettings): void {
  const merged = { ...getDefaultSettings(), ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
  }
}

export function loadSettings(): AppSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return getDefaultSettings();
  try {
    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    return {
      ...getDefaultSettings(),
      ...parsed,
      shakeSOSEnabled: !!parsed.shakeSOSEnabled,
    };
  } catch {
    return getDefaultSettings();
  }
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
