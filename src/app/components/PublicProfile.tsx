import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { decompressFromEncodedURIComponent } from "lz-string";
import { loadProfile } from "../lib/storage";
import { Droplets, AlertTriangle, Activity, Pill, Phone } from "lucide-react";

interface PublicData {
  n: string;
  a: number;
  b: string;
  al: string[];
  c: string[];
  m: string[];
  ec: { n: string; r: string; p: string }[];
}

export function PublicProfile() {
  const { token } = useParams();
  const [data, setData] = useState<PublicData | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("OFFLINE_DATA=")) {
      const encoded = hash.split("OFFLINE_DATA=")[1];
      try {
        const json = decompressFromEncodedURIComponent(encoded);
        if (json) { setData(JSON.parse(json)); return; }
      } catch {}
    }

    const profile = loadProfile();
    if (profile.publicToken === token) {
      setData({
        n: profile.fullName,
        a: profile.age,
        b: profile.bloodType,
        al: profile.allergies,
        c: profile.conditions,
        m: profile.medications.map((m) => `${m.name} ${m.dose}`),
        ec: profile.emergencyContacts.map((c) => ({ n: c.name, r: c.relationship, p: c.phone })),
      });
    }
  }, [token]);

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e0c3fc] to-[#c7d2fe] flex items-center justify-center p-4">
        <div className="backdrop-blur-2xl bg-white/50 rounded-3xl p-8 text-center shadow-[0_8px_32px_rgba(124,58,237,0.12)] border border-white/40">
          <h2 className="text-[#1e1b4b]">Emergency Profile Not Found</h2>
          <p className="text-[#6b7280] mt-2">This QR code may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef2f2] to-[#fecaca] p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-4">
        <div className="bg-gradient-to-br from-[#ef4444] to-[#991b1b] text-white rounded-3xl p-6 text-center shadow-[0_8px_32px_rgba(239,68,68,0.3)]">
          <p className="text-sm opacity-80 tracking-wider">EMERGENCY MEDICAL INFO</p>
          <h1 className="mt-2">{data.n}, {data.a}</h1>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Droplets size={24} />
            <span className="text-3xl">{data.b}</span>
          </div>
        </div>

        {data.al.length > 0 && (
          <div className="backdrop-blur-2xl bg-white/70 rounded-3xl p-5 shadow-lg border border-red-100/50">
            <div className="flex items-center gap-2 text-[#ef4444] mb-3">
              <AlertTriangle size={20} /> <span className="text-[#1e1b4b]">Allergies</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.al.map((a) => <span key={a} className="px-3 py-1.5 rounded-full bg-red-50/80 text-red-600 border border-red-100/50">{a}</span>)}
            </div>
          </div>
        )}

        {data.c.length > 0 && (
          <div className="backdrop-blur-2xl bg-white/70 rounded-3xl p-5 shadow-lg border border-amber-100/50">
            <div className="flex items-center gap-2 text-[#f59e0b] mb-3">
              <Activity size={20} /> <span className="text-[#1e1b4b]">Conditions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.c.map((c) => <span key={c} className="px-3 py-1.5 rounded-full bg-amber-50/80 text-amber-600 border border-amber-100/50">{c}</span>)}
            </div>
          </div>
        )}

        {data.m.length > 0 && (
          <div className="backdrop-blur-2xl bg-white/70 rounded-3xl p-5 shadow-lg border border-purple-100/50">
            <div className="flex items-center gap-2 text-[#7c3aed] mb-3">
              <Pill size={20} /> <span className="text-[#1e1b4b]">Current Medications</span>
            </div>
            {data.m.map((m) => <p key={m} className="text-[#374151] py-1">{m}</p>)}
          </div>
        )}

        <div className="backdrop-blur-2xl bg-white/70 rounded-3xl p-5 shadow-lg border border-green-100/50">
          <div className="flex items-center gap-2 text-[#059669] mb-3">
            <Phone size={20} /> <span className="text-[#1e1b4b]">Emergency Contacts</span>
          </div>
          {data.ec.map((c) => (
            <a key={c.p} href={`tel:${c.p}`} className="flex items-center justify-between py-3 border-b border-green-50 last:border-0">
              <div>
                <p className="text-[#1e1b4b]">{c.n}</p>
                <p className="text-sm text-[#6b7280]">{c.r}</p>
              </div>
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-[#34d399] to-[#059669] text-white text-sm">Call</div>
            </a>
          ))}
        </div>

        <p className="text-center text-xs text-[#6b7280] pb-4">Powered by Jeevan Rakshak</p>
      </div>
    </div>
  );
}
