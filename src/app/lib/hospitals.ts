export interface Hospital {
  name: string;
  lat: number;
  lng: number;
  type: string;
  bedsAvailable: number;
  traumaLevel: string;
  phone: string;
}

export const hospitals: Hospital[] = [
  { name: "Tata Main Hospital (TMH)", lat: 22.7896, lng: 86.2030, type: "Government", bedsAvailable: 12, traumaLevel: "Level 1", phone: "+916572432001" },
  { name: "MGM Medical College", lat: 22.8046, lng: 86.2089, type: "Government", bedsAvailable: 8, traumaLevel: "Level 1", phone: "+916572432002" },
  { name: "Brahmananda Narayana", lat: 22.7756, lng: 86.1450, type: "Private", bedsAvailable: 15, traumaLevel: "Level 2", phone: "+916572432003" },
  { name: "Tinplate Hospital", lat: 22.7830, lng: 86.1850, type: "PSU", bedsAvailable: 6, traumaLevel: "Level 2", phone: "+916572432004" },
  { name: "Suman Hospital", lat: 22.8120, lng: 86.2150, type: "Private", bedsAvailable: 4, traumaLevel: "Level 3", phone: "+916572432005" },
  { name: "Telco Main Hospital", lat: 22.7650, lng: 86.1680, type: "PSU", bedsAvailable: 10, traumaLevel: "Level 2", phone: "+916572432006" },
  { name: "Mercy Hospital", lat: 22.7980, lng: 86.1980, type: "Private", bedsAvailable: 7, traumaLevel: "Level 3", phone: "+916572432007" },
  { name: "Manipal Tata Medical Center", lat: 22.7710, lng: 86.1520, type: "Private", bedsAvailable: 20, traumaLevel: "Level 1", phone: "+916572432008" },
  { name: "Kashyap Memorial Eye Hospital", lat: 22.8050, lng: 86.2100, type: "Private", bedsAvailable: 3, traumaLevel: "Level 3", phone: "+916572432009" },
  { name: "Rai Hospital", lat: 22.7900, lng: 86.1900, type: "Private", bedsAvailable: 5, traumaLevel: "Level 3", phone: "+916572432010" },
  { name: "Woodland Hospital", lat: 22.8000, lng: 86.2050, type: "Private", bedsAvailable: 9, traumaLevel: "Level 2", phone: "+916572432011" },
  { name: "Life Care Hospital", lat: 22.7850, lng: 86.1750, type: "Private", bedsAvailable: 6, traumaLevel: "Level 3", phone: "+916572432012" },
];

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestHospitals(lat: number, lng: number, count = 3) {
  return hospitals
    .map((h) => ({ ...h, distance: haversineDistance(lat, lng, h.lat, h.lng), eta: Math.ceil((haversineDistance(lat, lng, h.lat, h.lng) / 40) * 60) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}
