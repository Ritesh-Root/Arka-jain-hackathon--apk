import React, { useState, useEffect, useRef, useCallback } from "react";
import { loadProfile } from "../lib/storage";
import { Mic, MicOff, Volume2, VolumeX, Droplets, Send } from "lucide-react";

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
  timestamp: number;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(profile: ReturnType<typeof loadProfile>) {
  return [
    "You are Jeevan Rakshak emergency agent, a calm first-aid assistant.",
    "Always prioritize safety, concise steps, and ask one question at a time when details are missing.",
    "If condition looks critical, remind user to call emergency services immediately.",
    "Use simple Hindi by default; switch to English if the user writes in English.",
    "Patient profile context:",
    `Name: ${profile.fullName}`,
    `Age: ${profile.age}`,
    `Blood type: ${profile.bloodType}`,
    `Allergies: ${profile.allergies.join(", ") || "None"}`,
    `Conditions: ${profile.conditions.join(", ") || "None"}`,
    `Medications: ${profile.medications.map((m) => `${m.name} ${m.dose}`).join(", ") || "None"}`,
    "Never claim to be a doctor. Provide first-aid guidance and escalation advice.",
  ].join("\n");
}

function localFallback(profile: ReturnType<typeof loadProfile>, query: string): string {
  const q = query.toLowerCase();

  if (q.includes("allergy") || q.includes("allergies")) {
    return `Known allergies: ${profile.allergies.join(", ") || "None recorded"}. Please avoid these medicines/foods and seek doctor help immediately if reaction starts.`;
  }

  if (q.includes("blood") || q.includes("group")) {
    return `Patient blood group is ${profile.bloodType}. Share this with ambulance/hospital immediately.`;
  }

  if (q.includes("not breathing") || q.includes("saans") || q.includes("breathing")) {
    return "Agar patient saans nahi le raha: emergency call karein, chest center par 100-120 compressions/min start karein, aur professional help aane tak continue rakhein.";
  }

  if (q.includes("unconscious") || q.includes("बेहोश") || q.includes("behosh")) {
    return "Patient ko side recovery position mein rakhein, breathing check karein, tight kapde loosen karein, aur turant emergency call karein.";
  }

  return "Main emergency agent mode mein hoon. Kripya symptoms, breathing status, injury location, aur patient response batayein. Main step-by-step guide karunga.";
}

export function Copilot() {
  const profile = loadProfile();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "ai",
      text: "Namaste. Main Jeevan Rakshak AI emergency agent hoon. Symptoms ya situation batayein, main real-time first-aid steps doonga.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const speak = useCallback(
    (text: string) => {
      if (muted || !("speechSynthesis" in window)) return;
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /[a-z]/i.test(text) ? "en-IN" : "hi-IN";
      utterance.rate = 0.92;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    },
    [muted]
  );

  const updateAiMessage = useCallback((id: string, text: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, text } : msg)));
  }, []);

  const appendAiToken = useCallback((id: string, token: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text: `${msg.text}${token}` } : msg))
    );
  }, []);

  const runAgent = useCallback(
    async (userText: string) => {
      const cleanText = userText.trim();
      if (!cleanText || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        text: cleanText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      const aiMessageId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "ai",
          text: "",
          timestamp: Date.now(),
        },
      ]);

      setIsLoading(true);

      try {
        if (!GROQ_API_KEY) {
          const fallback = `${localFallback(profile, cleanText)}\n\n(Groq API key missing. Running in local emergency fallback mode.)`;
          updateAiMessage(aiMessageId, fallback);
          speak(fallback);
          return;
        }

        const history = messages
          .slice(-10)
          .map((msg) => ({ role: msg.role === "ai" ? "assistant" : "user", content: msg.text }));

        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            temperature: 0.2,
            stream: true,
            messages: [
              { role: "system", content: buildSystemPrompt(profile) },
              ...history,
              { role: "user", content: cleanText },
            ],
          }),
        });

        if (!response.ok) {
          const errText = `Agent API error: ${response.status}. Check Groq API key/model.`;
          updateAiMessage(aiMessageId, errText);
          return;
        }

        if (!response.body) {
          updateAiMessage(aiMessageId, "No response body from AI provider.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const json = JSON.parse(payload);
              const token = json.choices?.[0]?.delta?.content || "";
              if (!token) continue;
              fullText += token;
              appendAiToken(aiMessageId, token);
            } catch {
              // Ignore malformed SSE chunk
            }
          }
        }

        if (!fullText.trim()) {
          const fallback = localFallback(profile, cleanText);
          updateAiMessage(aiMessageId, fallback);
          speak(fallback);
          return;
        }

        speak(fullText);
      } catch {
        const fallback = `${localFallback(profile, cleanText)}\n\n(Network/API issue. Running in local emergency fallback mode.)`;
        updateAiMessage(aiMessageId, fallback);
        speak(fallback);
      } finally {
        setIsLoading(false);
      }
    },
    [appendAiToken, isLoading, messages, profile, speak, updateAiMessage]
  );

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim();
      if (text) {
        setInput(text);
        runAgent(text);
      }
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // no-op
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-gradient-to-b from-[#e0c3fc] via-[#d5c6f9] to-[#c7d2fe]">
      <div className="p-4 bg-white/40 backdrop-blur-2xl border-b border-white/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#1e1b4b]">AI Emergency Agent</h2>
            <p className="text-sm text-[#6b7280]">Profile-aware real-time first-aid assistant</p>
          </div>
          <button onClick={() => setMuted(!muted)} className="p-2.5 rounded-full bg-white/50 border border-white/40">
            {muted ? <VolumeX size={20} className="text-[#6b7280]" /> : <Volume2 size={20} className="text-[#7c3aed]" />}
          </button>
        </div>

        <div className="mt-2.5 flex gap-2 text-xs flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50/80 text-red-600 border border-red-100/50">
            <Droplets size={10} /> {profile.bloodType}
          </span>
          {profile.allergies.slice(0, 3).map((a) => (
            <span key={a} className="px-2.5 py-1 rounded-full bg-amber-50/80 text-amber-600 border border-amber-100/50">{a}</span>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] px-4 py-3 rounded-3xl ${
                msg.role === "ai"
                  ? "bg-white/60 backdrop-blur-xl text-[#1e1b4b] rounded-bl-lg border border-white/40"
                  : "bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white rounded-br-lg"
              }`}
            >
              {msg.role === "ai" && <p className="text-xs text-[#7c3aed] mb-1">Jeevan Agent</p>}
              <p className="whitespace-pre-wrap">{msg.text || "..."}</p>
            </div>
          </div>
        ))}

        {(isLoading || isSpeaking) && (
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

      <div className="p-4 bg-white/40 backdrop-blur-2xl border-t border-white/30 space-y-2 pb-6">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runAgent(input);
              }
            }}
            placeholder="Describe symptoms or ask first-aid question..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/30"
          />

          <button
            onClick={isListening ? () => { recognitionRef.current?.stop(); setIsListening(false); } : startListening}
            className={`px-4 rounded-2xl ${
              isListening ? "bg-red-500 text-white" : "bg-white/70 text-[#7c3aed] border border-white/50"
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={() => runAgent(input)}
            disabled={!input.trim() || isLoading}
            className="px-4 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
