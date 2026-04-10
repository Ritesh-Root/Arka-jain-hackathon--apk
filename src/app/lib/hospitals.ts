import hospitalsDataset from "../../data/hospitals_jamshedpur.json";

type OwnershipType = "govt" | "private";

interface HospitalDatasetMeta {
  city: string;
  district: string;
  state: string;
  country: string;
  last_verified: string;
  source: string;
  total_entries: number;
}

interface HospitalDatasetEntry {
  id: string;
  name: string;
  short_name: string;
  address: string;
  area: string;
  lat: number;
  lng: number;
  type: OwnershipType;
  trauma_level: number;
  phone_primary: string;
  phone_emergency: string;
  phone_ambulance: string;
  beds_total: number;
  beds_available: number;
  specialties: string[];
  has_blood_bank: boolean;
  has_icu: boolean;
  is_24x7: boolean;
  notes: string;
}

interface HospitalDataset {
  _meta: HospitalDatasetMeta;
  hospitals: HospitalDatasetEntry[];
}

export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  address: string;
  area: string;
  lat: number;
  lng: number;
  type: string;
  ownershipType: OwnershipType;
  bedsTotal: number;
  bedsAvailable: number;
  traumaLevel: string;
  traumaLevelNumber: number;
  phone: string;
  phonePrimary: string;
  phoneEmergency: string;
  phoneAmbulance: string;
  hasBloodBank: boolean;
  hasIcu: boolean;
  is24x7: boolean;
  specialties: string[];
  notes: string;
}

const ownershipTypeLabels: Record<OwnershipType, string> = {
  govt: "Government",
  private: "Private",
};

const dataset = hospitalsDataset as HospitalDataset;

export const hospitalsMeta = dataset._meta;

export const hospitals: Hospital[] = dataset.hospitals.map((entry) => ({
  id: entry.id,
  name: entry.name,
  shortName: entry.short_name,
  address: entry.address,
  area: entry.area,
  lat: entry.lat,
  lng: entry.lng,
  type: ownershipTypeLabels[entry.type],
  ownershipType: entry.type,
  bedsTotal: entry.beds_total,
  bedsAvailable: entry.beds_available,
  traumaLevel: `Level ${entry.trauma_level}`,
  traumaLevelNumber: entry.trauma_level,
  phone: entry.phone_emergency || entry.phone_primary || entry.phone_ambulance,
  phonePrimary: entry.phone_primary,
  phoneEmergency: entry.phone_emergency,
  phoneAmbulance: entry.phone_ambulance,
  hasBloodBank: entry.has_blood_bank,
  hasIcu: entry.has_icu,
  is24x7: entry.is_24x7,
  specialties: entry.specialties,
  notes: entry.notes,
}));

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestHospitals(lat: number, lng: number, count = 3) {
  return hospitals
    .map((h) => {
      const distance = haversineDistance(lat, lng, h.lat, h.lng);
      return { ...h, distance, eta: Math.ceil((distance / 40) * 60) };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}
