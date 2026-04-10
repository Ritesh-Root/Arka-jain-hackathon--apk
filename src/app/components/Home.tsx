import React from "react";
import { useNavigate } from "react-router";
import { loadProfile } from "../lib/storage";
import { GlassCard } from "./GlassCard";
import { QrCode, Map, Camera, Heart, User, Bot, Shield, AlertTriangle, ChevronRight, Droplets } from "lucide-react";

export function Home() {
  const navigate = useNavigate();
  const profile = loadProfile();

  const features = [
    { icon: User, label: "Profile", desc: "Emergency medical card", path: "/profile", gradient: "from-[#a78bfa] to-[#7c3aed]" },
    { icon: QrCode, label: "QR Code", desc: "Lockscreen bystander QR", path: "/qr", gradient: "from-[#818cf8] to-[#6366f1]" },
    { icon: Map, label: "Hospitals", desc: "Live hospital map", path: "/hospitals", gradient: "from-[#34d399] to-[#059669]" },
    { icon: Camera, label: "Eye Witness", desc: "AI scene reporter", path: "/witness", gradient: "from-[#fb923c] to-[#ea580c]" },
    { icon: Heart, label: "Vitals", desc: "Heart rate from selfie", path: "/vitals", gradient: "from-[#f472b6] to-[#ec4899]" },
    { icon: Bot, label: "AI Copilot", desc: "First-aid voice guide", path: "/copilot", gradient: "from-[#67e8f9] to-[#06b6d4]" },
  ];

  return (
    <div className="p-4 pb-8 space-y-5">
      {/* Header */}
      <div className="pt-6 pb-2">
        <p className="text-sm text-[#7c3aed]/70">Welcome back</p>
        <h1 className="text-[#1e1b4b] mt-1">Jeevan Rakshak</h1>
        <p className="text-sm text-[#6b7280] mt-1">Your AI-powered emergency guardian</p>
      </div>

      {/* Patient status card */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center shrink-0">
            <Shield size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#1e1b4b] truncate">{profile.fullName}</p>
            <p className="text-sm text-[#6b7280]">Age {profile.age}</p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50/80 text-red-600 text-xs border border-red-100/50">
                <Droplets size={10} /> {profile.bloodType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50/80 text-purple-600 text-xs border border-purple-100/50">
                {profile.emergencyContacts.length} contacts
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50/80 text-amber-600 text-xs border border-amber-100/50">
                {profile.allergies.length} allergies
              </span>
            </div>
          </div>
          <button onClick={() => navigate("/profile")} className="p-2 rounded-full hover:bg-white/50 transition">
            <ChevronRight size={20} className="text-[#7c3aed]" />
          </button>
        </div>
      </GlassCard>

      {/* SOS alert banner */}
      <div className="bg-white/30 backdrop-blur-xl rounded-2xl border border-white/40 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100/80 flex items-center justify-center shrink-0">
          <AlertTriangle size={16} className="text-amber-600" />
        </div>
        <p className="text-sm text-[#1e1b4b]/70">
          Say <span className="text-[#7c3aed]">"SOS SOS SOS"</span>, triple-tap, or shake phone repeatedly for emergency
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((f) => (
          <GlassCard
            key={f.path}
            className="p-4 cursor-pointer active:scale-[0.97] transition-transform"
            onClick={() => navigate(f.path)}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3`}>
              <f.icon size={20} className="text-white" />
            </div>
            <p className="text-[#1e1b4b]">{f.label}</p>
            <p className="text-xs text-[#6b7280] mt-0.5">{f.desc}</p>
          </GlassCard>
        ))}
      </div>

      {/* How it works */}
      <GlassCard className="p-5">
        <h3 className="text-[#1e1b4b] mb-3">How It Protects You</h3>
        <div className="space-y-3">
          {[
            "Set up your emergency profile with medical info",
            "Generate a lockscreen QR for bystanders",
            "Voice-activate SOS for instant help",
            "AI locates nearest hospitals with live beds",
            "AI Eye Witness reports to ambulance crews",
            "Monitor vitals with selfie rPPG technology",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-[#4b5563]">{step}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
