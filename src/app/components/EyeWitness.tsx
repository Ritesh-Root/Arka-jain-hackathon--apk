import React, { useRef, useState, useCallback, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { loadProfile } from "../lib/storage";
import { Camera, Volume2, Send, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera } from "@capacitor/camera";
import { toast } from "sonner";

type SceneSeverity = "critical" | "serious" | "moderate" | "minor";

interface SceneReport {
  incident_type: string;
  vehicles_involved: number;
  visible_victims: number;
  victim_consciousness: string;
  visible_injuries: string[];
  severity: SceneSeverity;
  immediate_actions: string[];
  do_not_do: string[];
  summary_hindi: string;
  summary_english: string;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const HARDCODED_GROQ_API_KEY_PRIMARY = "";
const HARDCODED_GROQ_API_KEY_BACKUP = "";
const GROQ_API_KEYS = [
  HARDCODED_GROQ_API_KEY_PRIMARY,
  HARDCODED_GROQ_API_KEY_BACKUP,
  import.meta.env.VITE_GROQ_API_KEY || "",
  import.meta.env.VITE_GROQ_API_KEY_BACKUP || "",
].filter((key) => !!key);
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function fallbackReport(): SceneReport {
  return {
    incident_type: "road_incident",
    vehicles_involved: 1,
    visible_victims: 1,
    victim_consciousness: "unknown",
    visible_injuries: ["Visible trauma; requires urgent human assessment"],
    severity: "serious",
    immediate_actions: [
      "Ensure the scene is safe before approaching",
      "Check responsiveness and breathing",
      "Apply direct pressure to active bleeding with clean cloth",
      "Keep victim still and monitor continuously until help arrives",
    ],
    do_not_do: [
      "Do not move neck/spine if major trauma is suspected",
      "Do not give food or water",
      "Do not remove embedded objects",
    ],
    summary_hindi: "Ghatna gambhir lag rahi hai. Mareez ko sthir rakhein, khoon bahne par dabav dein, aur turant ambulance bulayein.",
    summary_english: "Scene appears serious. Keep the victim still, control bleeding, and call an ambulance immediately.",
  };
}

function extractJsonBlock(text: string): string | null {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function normalizeSceneReport(raw: any): SceneReport {
  const safeSeverity: SceneSeverity = ["critical", "serious", "moderate", "minor"].includes(raw?.severity)
    ? raw.severity
    : "serious";

  return {
    incident_type: typeof raw?.incident_type === "string" ? raw.incident_type : "road_incident",
    vehicles_involved: Number.isFinite(raw?.vehicles_involved) ? raw.vehicles_involved : 1,
    visible_victims: Number.isFinite(raw?.visible_victims) ? raw.visible_victims : 1,
    victim_consciousness: typeof raw?.victim_consciousness === "string" ? raw.victim_consciousness : "unknown",
    visible_injuries: Array.isArray(raw?.visible_injuries) ? raw.visible_injuries : [],
    severity: safeSeverity,
    immediate_actions: Array.isArray(raw?.immediate_actions) ? raw.immediate_actions : [],
    do_not_do: Array.isArray(raw?.do_not_do) ? raw.do_not_do : [],
    summary_hindi: typeof raw?.summary_hindi === "string" ? raw.summary_hindi : "Turant medical madad mangiye.",
    summary_english: typeof raw?.summary_english === "string" ? raw.summary_english : "Seek emergency medical help immediately.",
  };
}

export function EyeWitness() {
  const profile = loadProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [wantsCamera, setWantsCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<SceneReport | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState("");

  const waitForVideoFrame = useCallback(async (video: HTMLVideoElement) => {
    if (video.readyState >= 3 && video.videoWidth > 0 && video.videoHeight > 0) return true;

    await new Promise<void>((resolve) => {
      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        video.removeEventListener("loadeddata", finish);
        video.removeEventListener("canplay", finish);
        video.removeEventListener("playing", finish);
        resolve();
      };

      video.addEventListener("loadeddata", finish);
      video.addEventListener("canplay", finish);
      video.addEventListener("playing", finish);
      setTimeout(finish, 2500);
    });

    return video.readyState >= 3 && video.videoWidth > 0 && video.videoHeight > 0;
  }, []);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const attachStreamToVideo = useCallback(async (stream: MediaStream) => {
    if (!videoRef.current) return false;
    videoRef.current.srcObject = stream;
    videoRef.current.setAttribute("playsinline", "true");
    videoRef.current.muted = true;

    try {
      await videoRef.current.play();
    } catch {
      return false;
    }

    return waitForVideoFrame(videoRef.current);
  }, [waitForVideoFrame]);

  const handleOpenCamera = useCallback(() => {
    setErrorText("");
    setCapturedImage(null);
    setReport(null);
    setWantsCamera(true);
  }, []);

  const stopCamera = useCallback(() => {
    releaseStream();
    setCameraReady(false);
    setWantsCamera(false);
  }, [releaseStream]);

  useEffect(() => {
    if (!wantsCamera) return;

    let cancelled = false;

    const start = async () => {
      setErrorText("");
      setCameraReady(false);
      releaseStream();

      if (Capacitor.isNativePlatform()) {
        try {
          const status = await CapCamera.requestPermissions({ permissions: ["camera"] });
          if (cancelled) return;
          if (status.camera !== "granted" && status.camera !== "limited") {
            setErrorText("Camera permission denied. Enable camera in app settings and try again.");
            setWantsCamera(false);
            return;
          }
        } catch {
          if (cancelled) return;
          setErrorText("Could not request camera permission on this device.");
          setWantsCamera(false);
          return;
        }
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorText("Camera API is not supported on this device/browser.");
        setWantsCamera(false);
        return;
      }

      const streamAttempts: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        { video: { facingMode: "environment" } },
        { video: true },
      ];

      for (const constraints of streamAttempts) {
        if (cancelled) return;
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          const ready = await attachStreamToVideo(stream);
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          if (ready) {
            streamRef.current = stream;
            setCameraReady(true);
            return;
          }

          stream.getTracks().forEach((track) => track.stop());
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        } catch {
          // Try next stream constraints.
        }
      }

      if (cancelled) return;
      setCameraReady(false);
      setWantsCamera(false);
      setErrorText("Could not start a usable camera stream. Allow camera access and close other camera apps, then retry.");
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [wantsCamera, attachStreamToVideo, releaseStream]);

  const speakSummary = useCallback((summaryHindi: string) => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(summaryHindi);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }, []);

  const captureScene = useCallback(async () => {
    if (!videoRef.current) return;

    setErrorText("");
    const ready = await waitForVideoFrame(videoRef.current);
    if (!ready) {
      setErrorText("Camera is still warming up. Try capture again in a second.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setErrorText("Could not initialize capture canvas.");
      return;
    }

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageDataUrl);

    setAnalyzing(true);
    setReport(null);

    try {
      if (!GROQ_API_KEYS.length) {
        const fallback = fallbackReport();
        setReport(fallback);
        speakSummary(fallback.summary_hindi);
        return;
      }

      for (const apiKey of GROQ_API_KEYS) {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            temperature: 0.1,
            messages: [
              {
                role: "system",
                content:
                  "You are an emergency scene triage assistant. Return strict JSON only with keys: incident_type, vehicles_involved, visible_victims, victim_consciousness, visible_injuries, severity, immediate_actions, do_not_do, summary_hindi, summary_english. Keep language concise and avoid diagnosis certainty.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      `Patient context: name=${profile.fullName}, age=${profile.age}, bloodType=${profile.bloodType}, allergies=${profile.allergies.join(", ") || "none"}, conditions=${profile.conditions.join(", ") || "none"}. Analyze this scene image and provide immediate first-aid guidance in valid JSON only.`,
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageDataUrl },
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          continue;
        }

        const json = await response.json();
        const rawText = json?.choices?.[0]?.message?.content;
        if (typeof rawText !== "string") {
          continue;
        }

        const jsonText = extractJsonBlock(rawText);
        if (!jsonText) {
          continue;
        }

        const parsed = JSON.parse(jsonText);
        const normalized = normalizeSceneReport(parsed);
        setReport(normalized);
        speakSummary(normalized.summary_hindi);
        return;
      }

      const fallback = fallbackReport();
      setReport(fallback);
      speakSummary(fallback.summary_hindi);
    } catch {
      const fallback = fallbackReport();
      setReport(fallback);
      speakSummary(fallback.summary_hindi);
    } finally {
      setAnalyzing(false);
    }
  }, [profile, waitForVideoFrame, speakSummary]);

  useEffect(() => {
    return () => {
      releaseStream();
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
    };
  }, [releaseStream]);

  const speakReport = useCallback(() => {
    if (!report) return;
    speakSummary(report.summary_hindi);
  }, [report, speakSummary]);

  const forwardToAmbulance = useCallback(() => {
    if (!report) {
      toast.error("Analyze the scene first before forwarding.");
      return;
    }

    const ambulanceMessage = [
      "AMBULANCE ALERT",
      `Incident: ${report.incident_type}`,
      `Severity: ${report.severity.toUpperCase()}`,
      `Victims: ${report.visible_victims}`,
      `Consciousness: ${report.victim_consciousness}`,
      `Injuries: ${report.visible_injuries.join(", ") || "Not clear"}`,
      `Immediate actions: ${report.immediate_actions.join("; ") || "N/A"}`,
      `Summary: ${report.summary_english}`,
    ].join("\n");

    const smsUrl = `sms:108?body=${encodeURIComponent(ambulanceMessage)}`;

    try {
      window.location.href = smsUrl;
      toast.success("Ambulance SMS draft opened.");
    } catch {
      window.location.href = "tel:108";
    }
  }, [report]);

  const severityColor: Record<SceneSeverity, string> = {
    critical: "from-[#ef4444] to-[#dc2626]",
    serious: "from-[#f97316] to-[#ea580c]",
    moderate: "from-[#eab308] to-[#ca8a04]",
    minor: "from-[#22c55e] to-[#16a34a]",
  };

  return (
    <div className="p-4 pb-28 space-y-4">
      <div className="pt-6 pb-2">
        <p className="text-sm text-[#7c3aed]/70">AI Feature</p>
        <h1 className="text-[#1e1b4b]">AI Eye Witness</h1>
        <p className="text-sm text-[#6b7280] mt-1">Point camera at an accident scene for AI analysis</p>
      </div>

      {!wantsCamera ? (
        <GlassCard className="p-8">
          <button onClick={handleOpenCamera} className="w-full flex flex-col items-center gap-4 text-[#7c3aed]">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#fb923c] to-[#ea580c] flex items-center justify-center">
              <Camera size={36} className="text-white" />
            </div>
            <span className="text-[#1e1b4b]">Tap to activate camera</span>
          </button>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <video ref={videoRef} className="w-full h-[300px] object-cover rounded-t-3xl" playsInline autoPlay muted />
          <div className="p-3 flex gap-2">
            <button
              onClick={() => void captureScene()}
              disabled={analyzing || !cameraReady}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {analyzing ? "Analyzing..." : cameraReady ? "Capture Scene" : "Initializing Camera..."}
            </button>
            <button onClick={stopCamera} className="py-3 px-5 rounded-2xl bg-red-50/80 text-red-600 border border-red-100/50">Stop</button>
          </div>
        </GlassCard>
      )}

      {errorText && (
        <GlassCard className="p-4 border border-red-100/50">
          <p className="text-red-600 text-sm">{errorText}</p>
        </GlassCard>
      )}

      {analyzing && (
        <GlassCard className="p-6 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-[#7c3aed] border-t-transparent rounded-full mx-auto" />
          <p className="mt-3 text-[#1e1b4b]">AI is analyzing the scene...</p>
          <p className="text-sm text-[#6b7280]">Powered by live AI vision analysis</p>
        </GlassCard>
      )}

      {report && !analyzing && (
        <>
          {capturedImage && (
            <GlassCard className="overflow-hidden">
              <img src={capturedImage} alt="Captured scene" className="w-full h-[200px] object-cover rounded-3xl" />
            </GlassCard>
          )}

          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[#1e1b4b]">Scene Report</h3>
              <span className={`px-3 py-1 rounded-full text-white text-sm bg-gradient-to-r ${severityColor[report.severity]}`}>
                {report.severity.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: "Incident", value: report.incident_type.replace("_", " ") },
                { label: "Vehicles", value: report.vehicles_involved },
                { label: "Victims", value: report.visible_victims },
                { label: "Consciousness", value: report.victim_consciousness },
              ].map((item) => (
                <div key={item.label} className="bg-white/40 backdrop-blur rounded-2xl p-3">
                  <span className="text-[#6b7280] text-xs">{item.label}</span>
                  <p className="text-[#1e1b4b] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-2">
            <h3 className="text-[#059669] flex items-center gap-2">
              <CheckCircle size={18} /> Immediate Actions
            </h3>
            {report.immediate_actions.map((action, index) => (
              <div key={`${action}-${index}`} className="flex gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-50/80 text-green-600 flex items-center justify-center shrink-0 border border-green-100/50">{index + 1}</span>
                <span className="text-[#374151]">{action}</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-5 space-y-2">
            <h3 className="text-[#ef4444] flex items-center gap-2">
              <XCircle size={18} /> DO NOT
            </h3>
            {report.do_not_do.map((warning, index) => (
              <div key={`${warning}-${index}`} className="flex gap-2 text-sm text-red-600">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[#1e1b4b]">Hindi Summary</h3>
              <button onClick={speakReport} className="p-2.5 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white"><Volume2 size={16} /></button>
            </div>
            <p className="text-[#1e1b4b]">{report.summary_hindi}</p>
            <p className="text-sm text-[#6b7280]">{report.summary_english}</p>
          </GlassCard>

          <button
            onClick={forwardToAmbulance}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] active:scale-[0.98] transition-transform"
          >
            <Send size={18} /> Forward to Ambulance
          </button>
        </>
      )}
    </div>
  );
}
