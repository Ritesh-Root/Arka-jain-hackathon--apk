import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, QrCode, Map, Heart, Mic } from "lucide-react";
import { SOSActive } from "./SOSActive";
import { loadProfile, saveProfile, isOnboardingCompleted, markOnboardingCompleted, PRIMARY_EMERGENCY_NUMBER } from "../lib/storage";
import { enableAndroidBackgroundProtection, syncAndroidEmergencyConfig } from "../lib/androidHotword";
import { toast } from "sonner";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sosActive, setSosActive] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRelationship, setContactRelationship] = useState("Family");
  const [contactPhone, setContactPhone] = useState("");
  const tapTimesRef = useRef<number[]>([]);
  const recognitionRef = useRef<any>(null);
  const keywordDetectionsRef = useRef<number[]>([]);

  const syncBackgroundProtection = useCallback(async () => {
    const profile = loadProfile();
    const contactNumbers = profile.emergencyContacts.map((contact) => contact.phone).filter(Boolean);

    try {
      await syncAndroidEmergencyConfig(PRIMARY_EMERGENCY_NUMBER, contactNumbers);
      await enableAndroidBackgroundProtection(PRIMARY_EMERGENCY_NUMBER, contactNumbers);
    } catch {
      toast.error("Allow microphone, call and SMS permissions for 24x7 Android protection.");
    }
  }, []);

  const triggerSOS = useCallback(() => {
    setSosActive(true);
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  }, []);

  useEffect(() => {
    if (!isOnboardingCompleted()) {
      setOnboardingOpen(true);
    }
  }, []);

  const handleOnboardingSave = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      toast.error("Please add contact name and phone number");
      return;
    }

    const profile = loadProfile();
    const newContact = {
      name: contactName.trim(),
      relationship: contactRelationship.trim() || "Emergency Contact",
      phone: contactPhone.trim(),
    };

    const updatedProfile = {
      ...profile,
      emergencyContacts: [newContact, ...profile.emergencyContacts].slice(0, 3),
    };

    saveProfile(updatedProfile);
    markOnboardingCompleted();
    setOnboardingOpen(false);
    toast.success("Emergency contact saved");
    await syncBackgroundProtection();
  };

  useEffect(() => {
    if (!onboardingOpen && isOnboardingCompleted()) {
      void syncBackgroundProtection();
    }
  }, [onboardingOpen, syncBackgroundProtection]);

  // Triple-tap detection
  useEffect(() => {
    const handleTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, select, nav, [role="button"]')) {
        tapTimesRef.current = [];
        return;
      }
      const now = Date.now();
      tapTimesRef.current.push(now);
      tapTimesRef.current = tapTimesRef.current.filter((t) => now - t < 800);
      if (tapTimesRef.current.length >= 3) {
        tapTimesRef.current = [];
        triggerSOS();
      }
    };

    document.addEventListener("click", handleTap);
    return () => document.removeEventListener("click", handleTap);
  }, [triggerSOS]);

  // Voice SOS detection
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      const keywordPattern = /\bsos\b|\bhelp\b|bachao|बचाओ/gi;
      const now = Date.now();

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        const hits = transcript.match(keywordPattern)?.length ?? 0;

        if (hits > 0) {
          for (let h = 0; h < hits; h++) {
            keywordDetectionsRef.current.push(now);
          }
          keywordDetectionsRef.current = keywordDetectionsRef.current.filter((t) => now - t < 7000);

          if (keywordDetectionsRef.current.length >= 3) {
            keywordDetectionsRef.current = [];
            triggerSOS();
            return;
          }
        }
      }
    };

    recognition.onerror = () => {
      setVoiceListening(false);
      setTimeout(() => {
        try { recognition.start(); setVoiceListening(true); } catch {}
      }, 2000);
    };

    recognition.onend = () => {
      setVoiceListening(false);
      setTimeout(() => {
        try { recognition.start(); setVoiceListening(true); } catch {}
      }, 1000);
    };

    try { recognition.start(); setVoiceListening(true); } catch {}
    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [triggerSOS]);

  if (sosActive) {
    return <SOSActive onDeactivate={() => setSosActive(false)} />;
  }

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: QrCode, label: "QR", path: "/qr" },
    { icon: Map, label: "Map", path: "/hospitals" },
    { icon: Heart, label: "Vitals", path: "/vitals" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#e0c3fc] via-[#d5c6f9] to-[#c7d2fe]">
      {/* Decorative blurred orbs */}
      <div className="fixed top-[-80px] left-[-60px] w-[280px] h-[280px] rounded-full bg-[#c084fc]/30 blur-[80px] pointer-events-none" />
      <div className="fixed top-[30%] right-[-80px] w-[240px] h-[240px] rounded-full bg-[#818cf8]/20 blur-[80px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-40px] w-[200px] h-[200px] rounded-full bg-[#67e8f9]/20 blur-[60px] pointer-events-none" />

      {/* Voice indicator */}
      {voiceListening && (
        <div className="fixed top-3 right-3 z-50 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-xl text-[#7c3aed] text-xs flex items-center gap-1.5 shadow-sm border border-white/40">
          <Mic size={12} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse" />
          Voice SOS/Help/Bachao
        </div>
      )}

      {onboardingOpen && (
        <div className="fixed inset-0 z-[120] bg-[#1e1b4b]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-white/40">
            <p className="text-sm text-[#7c3aed]/80">First-time setup</p>
            <h2 className="text-[#1e1b4b] mt-1">Who should we call in emergency?</h2>
            <p className="text-sm text-[#6b7280] mt-1">Add the primary person to call when SOS is triggered.</p>

            <div className="mt-4 space-y-3">
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact name"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#d8b4fe] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
              />
              <input
                value={contactRelationship}
                onChange={(e) => setContactRelationship(e.target.value)}
                placeholder="Relationship"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#d8b4fe] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#d8b4fe] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
              />
            </div>

            <button
              onClick={handleOnboardingSave}
              className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white"
            >
              Save Emergency Contact
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="pb-24">
        <Outlet />
      </div>

      {/* Floating SOS button */}
      <button
        onClick={triggerSOS}
        className="fixed bottom-[100px] right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#ef4444] to-[#991b1b] text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] flex items-center justify-center active:scale-90 transition-transform"
      >
        <span className="text-xs tracking-wider">SOS</span>
      </button>

      {/* Bottom nav - pill style */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2">
        <div className="bg-white/70 backdrop-blur-2xl rounded-full border border-white/50 shadow-[0_8px_32px_rgba(124,58,237,0.12)] px-2 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${
                    active
                      ? "bg-[#1e1b4b] text-white shadow-md"
                      : "text-[#6b7280] hover:text-[#7c3aed]"
                  }`}
                >
                  <item.icon size={18} />
                  {active && <span className="text-sm">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
