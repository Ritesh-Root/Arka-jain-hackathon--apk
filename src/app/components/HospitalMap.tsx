import React, { useEffect, useState, useRef } from "react";
import { GlassCard } from "./GlassCard";
import { hospitals, haversineDistance, getNearestHospitals } from "../lib/hospitals";
import { MapPin, Navigation, Bed, Clock, Phone } from "lucide-react";

export function HospitalMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 22.8046, lng: 86.2030 });
  const [nearest, setNearest] = useState(getNearestHospitals(22.8046, 86.2030, 3));
  const [mapLoaded, setMapLoaded] = useState(false);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setNearest(getNearestHospitals(c.lat, c.lng));
      },
      () => {}
    );
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInitialized.current) return;
    mapInitialized.current = true;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      const proto = L.Icon.Default.prototype as any;
      proto._getIconUrl = undefined;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, { zoomControl: false }).setView([coords.lat, coords.lng], 13);
      leafletMapRef.current = map;
      leafletRef.current = L;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap",
      }).addTo(map);

      setMapLoaded(true);
      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        mapInitialized.current = false;
      }
    };
  }, []);

  // Update markers when coords/nearest change
  useEffect(() => {
    const map = leafletMapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((m) => m.remove());
    polylinesRef.current.forEach((p) => p.remove());
    markersRef.current = [];
    polylinesRef.current = [];

    map.setView([coords.lat, coords.lng], 13);

    const userIcon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#7c3aed;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(124,58,237,0.5);"></div>`,
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    markersRef.current.push(L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(map).bindPopup("You are here"));

    const nearestNames = nearest.map((n) => n.name);
    hospitals.forEach((h) => {
      const isNearest = nearestNames.includes(h.name);
      const hospitalIcon = L.divIcon({
        html: `<div style="width:${isNearest ? 14 : 10}px;height:${isNearest ? 14 : 10}px;background:${isNearest ? "#ef4444" : "#94a3b8"};border:2px solid white;border-radius:50%;"></div>`,
        className: "",
        iconSize: [isNearest ? 14 : 10, isNearest ? 14 : 10],
        iconAnchor: [isNearest ? 7 : 5, isNearest ? 7 : 5],
      });
      const dist = haversineDistance(coords.lat, coords.lng, h.lat, h.lng);
      markersRef.current.push(
        L.marker([h.lat, h.lng], { icon: hospitalIcon })
          .addTo(map)
          .bindPopup(`<b>${h.name}</b><br>${dist.toFixed(1)} km | ${h.bedsAvailable} beds`)
      );

      if (isNearest) {
        polylinesRef.current.push(
          L.polyline([[coords.lat, coords.lng], [h.lat, h.lng]], {
            color: "#7c3aed",
            weight: 2,
            dashArray: "6",
            opacity: 0.6,
          }).addTo(map)
        );
      }
    });
  }, [coords, nearest, mapLoaded]);

  // Simulate bed updates
  const [beds, setBeds] = useState(nearest);
  useEffect(() => {
    const iv = setInterval(() => {
      setBeds((prev) =>
        prev.map((h) => ({
          ...h,
          bedsAvailable: Math.max(1, h.bedsAvailable + Math.floor(Math.random() * 3) - 1),
        }))
      );
    }, 10000);
    return () => clearInterval(iv);
  }, [nearest]);

  return (
    <div className="p-4 pb-28 space-y-4">
      <div className="pt-6 pb-2">
        <p className="text-sm text-[#7c3aed]/70">Live Data</p>
        <h1 className="text-[#1e1b4b]">Hospital Map</h1>
      </div>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />

      <GlassCard className="overflow-hidden">
        <div ref={mapRef} className="h-[300px] w-full rounded-3xl" />
      </GlassCard>

      <div className="space-y-3">
        <h3 className="text-[#1e1b4b]">Nearest Hospitals</h3>
        {beds.map((h, i) => (
          <GlassCard key={h.name} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] text-white flex items-center justify-center text-sm">{i + 1}</span>
                  <span className="text-[#1e1b4b]">{h.name}</span>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-[#6b7280]">
                  <span className="flex items-center gap-1"><Navigation size={14} /> {h.distance.toFixed(1)} km</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {h.eta} min</span>
                  <span className="flex items-center gap-1"><Bed size={14} /> {h.bedsAvailable} beds</span>
                </div>
                <div className="mt-1.5 text-xs text-[#9ca3af]">{h.type} | {h.traumaLevel}</div>
              </div>
              <a href={`tel:${h.phone}`} className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#34d399] to-[#059669] text-white text-sm flex items-center gap-1">
                <Phone size={14} /> Call
              </a>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-5">
        <h3 className="text-[#1e1b4b] mb-3">All Hospitals ({hospitals.length})</h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {hospitals.map((h) => {
            const dist = haversineDistance(coords.lat, coords.lng, h.lat, h.lng);
            return (
              <div key={h.name} className="flex items-center justify-between text-sm py-2 border-b border-white/30 last:border-0">
                <span className="text-[#1e1b4b]">{h.name}</span>
                <span className="text-[#6b7280]">{dist.toFixed(1)} km</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
