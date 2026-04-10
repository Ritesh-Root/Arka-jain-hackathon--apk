import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { compressToEncodedURIComponent } from "lz-string";
import { loadProfile, PROFILE_UPDATED_EVENT } from "../lib/storage";
import { GlassCard } from "./GlassCard";
import { QrCode, Download, Share2, Droplets } from "lucide-react";
import { toast } from "sonner";

export function QRCardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [profile, setProfile] = useState(() => loadProfile());

  useEffect(() => {
    const refreshProfile = () => setProfile(loadProfile());
    window.addEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
    window.addEventListener("storage", refreshProfile);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
      window.removeEventListener("storage", refreshProfile);
    };
  }, []);

  useEffect(() => {
    const offlineData = {
      n: profile.fullName,
      a: profile.age,
      b: profile.bloodType,
      al: profile.allergies,
      c: profile.conditions,
      m: profile.medications.map((m) => `${m.name} ${m.dose}`),
      ec: profile.emergencyContacts.map((c) => ({ n: c.name, r: c.relationship, p: c.phone })),
      u: profile.lastUpdatedAt,
    };
    const compressed = compressToEncodedURIComponent(JSON.stringify(offlineData));
    const base = window.location.origin;
    const url = `${base}/q/${profile.publicToken}#OFFLINE_DATA=${compressed}`;
    setQrUrl(url);

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 280,
        margin: 2,
        color: { dark: "#7c3aed", light: "#ffffff" },
      });
    }
  }, [profile]);

  const downloadWallpaper = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, "#e0c3fc");
    gradient.addColorStop(0.5, "#d5c6f9");
    gradient.addColorStop(1, "#c7d2fe");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = "#1e1b4b";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCAN FOR EMERGENCY INFO", 540, 200);

    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#7c3aed";
    ctx.fillText("Jeevan Rakshak", 540, 250);

    const qrCanvas = canvasRef.current;
    if (qrCanvas) {
      const qrSize = 500;
      ctx.drawImage(qrCanvas, (1080 - qrSize) / 2, 300, qrSize, qrSize);
    }

    ctx.fillStyle = "#1e1b4b";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(profile.fullName, 540, 900);
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#dc2626";
    ctx.fillText(`Blood Type: ${profile.bloodType}`, 540, 950);

    const link = document.createElement("a");
    link.download = "jeevan-rakshak-wallpaper.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Wallpaper downloaded");
  };

  return (
    <div className="p-4 pb-28 space-y-4">
      <div className="pt-6 pb-2">
        <p className="text-sm text-[#7c3aed]/70">Feature</p>
        <h1 className="text-[#1e1b4b]">Lockscreen QR</h1>
      </div>

      <GlassCard className="p-6 flex flex-col items-center space-y-4">
        <div className="flex items-center gap-2 text-[#7c3aed]">
          <QrCode size={22} />
          <span className="text-[#1e1b4b]">Your Emergency QR Code</span>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-inner">
          <canvas ref={canvasRef} />
        </div>
        <p className="text-center text-sm text-[#6b7280]">
          Anyone can scan this QR to see your emergency medical info -- even without unlocking your phone.
        </p>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50/80 border border-green-100/50">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-green-600">Works offline - data embedded in QR</span>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h3 className="text-[#1e1b4b]">Quick Preview</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between"><span className="text-[#6b7280]">Name</span><span className="text-[#1e1b4b]">{profile.fullName}</span></div>
          <div className="flex justify-between"><span className="text-[#6b7280]">Age</span><span className="text-[#1e1b4b]">{profile.age}</span></div>
          <div className="flex justify-between items-center"><span className="text-[#6b7280]">Blood Type</span><span className="inline-flex items-center gap-1 text-red-600"><Droplets size={14} />{profile.bloodType}</span></div>
          <div className="flex justify-between"><span className="text-[#6b7280]">Allergies</span><span className="text-amber-600">{profile.allergies.join(", ")}</span></div>
          <div className="flex justify-between"><span className="text-[#6b7280]">Conditions</span><span className="text-[#1e1b4b]">{profile.conditions.join(", ")}</span></div>
        </div>
      </GlassCard>

      <div className="flex gap-3">
        <button onClick={downloadWallpaper} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] active:scale-[0.98] transition-transform">
          <Download size={20} /> Wallpaper
        </button>
        <button onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success("Link copied"); }} className="py-3.5 px-5 rounded-2xl bg-white/60 backdrop-blur border border-white/50 text-[#7c3aed] active:scale-[0.98] transition-transform">
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
}
