import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, QrCode, Map, Heart, Mic } from "lucide-react";
import { SOSActive } from "./SOSActive";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sosActive, setSosActive] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const tapTimesRef = useRef<number[]>([]);
  const recognitionRef = useRef<any>(null);
  const sosCountRef = useRef(0);

  const triggerSOS = useCallback(() => {
    setSosActive(true);
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  }, []);

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
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (transcript.includes("sos")) {
          sosCountRef.current++;
          if (sosCountRef.current >= 2) {
            sosCountRef.current = 0;
            triggerSOS();
          }
          setTimeout(() => { sosCountRef.current = Math.max(0, sosCountRef.current - 1); }, 5000);
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
          Voice
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
