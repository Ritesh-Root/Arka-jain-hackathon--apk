import React, { useState, useEffect, useRef, useCallback } from "react";
import { GlassCard } from "./GlassCard";
import { loadProfile } from "../lib/storage";
import { Mic, MicOff, Volume2, VolumeX, Droplets } from "lucide-react";

interface Message {
  role: "ai" | "user";
  text: string;
  timestamp: number;
}

const COPILOT_SCRIPT: { ai: string; waitForUser?: boolean; expectKeyword?: string }[] = [
  { ai: "Namaste. Main Jeevan hoon, aapka AI paramedic. Ambulance 4 minute mein aa rahi hai. Kya aap mujhe bata sakte hain ki kya hua hai?" , waitForUser: true },
  { ai: "Samajh gayi. Kya mareez ki saanson chal rahi hai? Unki chest upar-neeche ho rahi hai?", waitForUser: true, expectKeyword: "nahi" },
  { ai: "Theek hai. Hum abhi CPR shuru karte hain. Apne dono haathon ki hatheli ko mareez ki chhati ke beech mein rakhein. Main ginti karungi. Tayyaar hain?", waitForUser: true },
  { ai: "Shuru karein. Ek... do... teen... chaar... paanch... chhah... saat... aath... nau... das...", waitForUser: false },
  { ai: "Bahut achha! Aur dabate rahein. Gyaarah... baarah... terah... chaudah... pandrah... solah... satrah... atthaarah... unees... bees...", waitForUser: false },
  { ai: "Aap bahut achha kar rahe hain. Ikeees... baees... teees... chaubees... pacchees... chhabees... sattaees... atthaees... untees... tees!", waitForUser: false },
  { ai: "Ab do rescue breaths dein. Mareez ka sir peeche karein, thodi upar uthaaein, aur unke munh mein do baar phoonkein.", waitForUser: true },
  { ai: "Bahut achha. Ab phir se chest compressions shuru karein. Ek... do... teen... chaar... paanch...", waitForUser: false },
  { ai: "Ambulance 2 minute mein pahunch rahi hai. Aap bahut bahaduri se madad kar rahe hain. Dabate rahein.", waitForUser: false },
];

export function Copilot() {
  const profile = loadProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cprActive, setCprActive] = useState(false);
  const [cprCount, setCprCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const metronomeRef = useRef<ReturnType<typeof setInterval>>();
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      advanceScript(0);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (muted || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); onEnd?.(); };
    speechSynthesis.speak(utterance);
  }, [muted]);

  const advanceScript = useCallback((index: number) => {
    if (index >= COPILOT_SCRIPT.length) return;
    const step = COPILOT_SCRIPT[index];

    setMessages((prev) => [...prev, { role: "ai", text: step.ai, timestamp: Date.now() }]);

    if (step.ai.includes("Ek...") || step.ai.includes("Gyaarah") || step.ai.includes("Ikeees") || step.ai.includes("phir se")) {
      startMetronome();
      setCprActive(true);
    }

    speak(step.ai, () => {
      if (!step.waitForUser && index + 1 < COPILOT_SCRIPT.length) {
        setTimeout(() => advanceScript(index + 1), 1500);
      } else {
        setScriptIndex(index + 1);
        startListening();
      }
    });
  }, [speak]);

  const startMetronome = () => {
    if (metronomeRef.current) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      metronomeRef.current = setInterval(() => {
        if (ctx.state === "closed") return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.08;
        osc.frequency.value = 1000;
        osc.type = "sine";
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
        setCprCount((c) => c + 1);
      }, 600);
    } catch {}
  };

  const stopMetronome = () => {
    if (metronomeRef.current) {
      clearInterval(metronomeRef.current);
      metronomeRef.current = undefined;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setCprActive(false);
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setMessages((prev) => [...prev, { role: "user", text, timestamp: Date.now() }]);
      setIsListening(false);
      setTimeout(() => advanceScript(scriptIndex), 1000);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

  const handleManualResponse = (text: string) => {
    setMessages((prev) => [...prev, { role: "user", text, timestamp: Date.now() }]);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
    setTimeout(() => advanceScript(scriptIndex), 500);
  };

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      stopMetronome();
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-gradient-to-b from-[#e0c3fc] via-[#d5c6f9] to-[#c7d2fe]">
      {/* Header */}
      <div className="p-4 bg-white/40 backdrop-blur-2xl border-b border-white/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#1e1b4b]">AI First-Aid Copilot</h2>
            <p className="text-sm text-[#6b7280]">Jeevan - Your AI Paramedic</p>
          </div>
          <button onClick={() => setMuted(!muted)} className="p-2.5 rounded-full bg-white/50 border border-white/40">
            {muted ? <VolumeX size={20} className="text-[#6b7280]" /> : <Volume2 size={20} className="text-[#7c3aed]" />}
          </button>
        </div>
        <div className="mt-2.5 flex gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50/80 text-red-600 border border-red-100/50">
            <Droplets size={10} /> {profile.bloodType}
          </span>
          {profile.allergies.map((a) => (
            <span key={a} className="px-2.5 py-1 rounded-full bg-amber-50/80 text-amber-600 border border-amber-100/50">{a}</span>
          ))}
        </div>
      </div>

      {/* CPR indicator */}
      {cprActive && (
        <div className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white px-4 py-2.5 flex items-center justify-between text-sm">
          <span>CPR Active - 100 BPM</span>
          <span>{cprCount} compressions</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-3xl ${
              msg.role === "ai"
                ? "bg-white/60 backdrop-blur-xl text-[#1e1b4b] rounded-bl-lg border border-white/40"
                : "bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white rounded-br-lg"
            }`}>
              {msg.role === "ai" && <p className="text-xs text-[#7c3aed] mb-1">Jeevan AI</p>}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {isSpeaking && (
          <div className="flex justify-start">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl rounded-bl-lg px-4 py-3 border border-white/40">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 bg-white/40 backdrop-blur-2xl border-t border-white/30 space-y-2 pb-6">
        <div className="flex gap-2">
          <button onClick={() => handleManualResponse("Haan")} className="flex-1 py-3 rounded-2xl bg-green-50/80 text-green-700 border border-green-100/50 active:scale-[0.97] transition-transform">
            Haan (Yes)
          </button>
          <button onClick={() => handleManualResponse("Nahi")} className="flex-1 py-3 rounded-2xl bg-red-50/80 text-red-700 border border-red-100/50 active:scale-[0.97] transition-transform">
            Nahi (No)
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleManualResponse("Saanson nahi chal rahi")} className="flex-1 py-2.5 rounded-2xl bg-white/50 text-sm text-[#6b7280] border border-white/40 active:scale-[0.97] transition-transform">
            Not breathing
          </button>
          <button onClick={() => handleManualResponse("Saanson chal rahi hai")} className="flex-1 py-2.5 rounded-2xl bg-white/50 text-sm text-[#6b7280] border border-white/40 active:scale-[0.97] transition-transform">
            Breathing
          </button>
        </div>
        <button
          onClick={isListening ? () => { recognitionRef.current?.stop(); setIsListening(false); } : startListening}
          className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
            isListening
              ? "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white"
              : "bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)]"
          }`}
        >
          {isListening ? <><MicOff size={20} /> Stop Listening</> : <><Mic size={20} /> Speak in Hindi</>}
        </button>
      </div>
    </div>
  );
}
