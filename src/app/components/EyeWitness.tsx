import React, { useRef, useState, useCallback, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Camera, Volume2, Send, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface SceneReport {
  incident_type: string;
  vehicles_involved: number;
  visible_victims: number;
  victim_consciousness: string;
  visible_injuries: string[];
  severity: string;
  immediate_actions: string[];
  do_not_do: string[];
  summary_hindi: string;
  summary_english: string;
}

const MOCK_REPORTS: SceneReport[] = [
  {
    incident_type: "road_accident",
    vehicles_involved: 2,
    visible_victims: 1,
    victim_consciousness: "conscious",
    visible_injuries: ["Head laceration", "Possible arm fracture"],
    severity: "serious",
    immediate_actions: ["Do not move the victim", "Apply pressure to head wound with clean cloth", "Keep victim talking and conscious", "Support injured arm"],
    do_not_do: ["Do not move the neck", "Do not give water", "Do not remove helmet if wearing one"],
    summary_hindi: "Do gaadiyoN ki takkar. Ek purush hosh meiN hai. Sambhvatah sir par chot. Gardan ko hilayeN nahiN.",
    summary_english: "Two vehicle collision. One male conscious. Head laceration and possible arm fracture. Do not move neck.",
  },
  {
    incident_type: "fall",
    vehicles_involved: 0,
    visible_victims: 1,
    victim_consciousness: "unconscious",
    visible_injuries: ["No visible external bleeding", "Possible spinal injury"],
    severity: "critical",
    immediate_actions: ["Check breathing immediately", "If not breathing, begin CPR", "Do not move the person", "Keep airway clear"],
    do_not_do: ["Do not move the victim", "Do not put pillow under head", "Do not pour water on face"],
    summary_hindi: "Ek vyakti gir gaya hai. Behosh hai. SaaNs jaaNcheN. HilayeN nahiN.",
    summary_english: "One person fallen. Unconscious. Check breathing. Do not move.",
  },
];

export function EyeWitness() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<SceneReport | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

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

  const startCamera = useCallback(async () => {
    setErrorText("");
    setCameraReady(false);
    setCapturedImage(null);
    setReport(null);
    releaseStream();

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorText("Camera API is not supported on this device/browser.");
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
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const ready = await attachStreamToVideo(stream);
        if (ready) {
          streamRef.current = stream;
          setCameraReady(true);
          setCameraActive(true);
          return;
        }

        stream.getTracks().forEach((track) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      } catch {
        // Try the next constraint set.
      }
    }

    setCameraActive(false);
    setCameraReady(false);
    setErrorText("Could not start a usable camera stream. Allow camera access and close other camera apps, then retry.");
  }, [attachStreamToVideo, releaseStream]);

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
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));

    setAnalyzing(true);

    setTimeout(() => {
      const mockReport = MOCK_REPORTS[Math.floor(Math.random() * MOCK_REPORTS.length)];
      setReport(mockReport);
      setAnalyzing(false);

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(mockReport.summary_hindi);
        utterance.lang = "hi-IN";
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
    }, 2500);
  }, [waitForVideoFrame]);

  const stopCamera = useCallback(() => {
    releaseStream();
    setCameraReady(false);
    setCameraActive(false);
  }, [releaseStream]);

  useEffect(() => {
    return () => {
      releaseStream();
      speechSynthesis.cancel();
    };
  }, [releaseStream]);

  const speakReport = () => {
    if (report && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(report.summary_hindi);
      utterance.lang = "hi-IN";
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const severityColor: Record<string, string> = {
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

      <GlassCard className="overflow-hidden">
        {!cameraActive ? (
          <button onClick={startCamera} className="w-full py-16 flex flex-col items-center gap-4 text-[#7c3aed]">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#fb923c] to-[#ea580c] flex items-center justify-center">
              <Camera size={36} className="text-white" />
            </div>
            <span className="text-[#1e1b4b]">Tap to activate camera</span>
          </button>
        ) : (
          <div className="relative">
            <video ref={videoRef} className="w-full h-[300px] object-cover rounded-t-3xl" playsInline autoPlay muted />
            <div className="p-3 flex gap-2">
              <button onClick={() => void captureScene()} disabled={analyzing || !cameraReady} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white disabled:opacity-50 active:scale-[0.98] transition-transform">
                {analyzing ? "Analyzing..." : cameraReady ? "Capture Scene" : "Initializing Camera..."}
              </button>
              <button onClick={stopCamera} className="py-3 px-5 rounded-2xl bg-red-50/80 text-red-600 border border-red-100/50">Stop</button>
            </div>
          </div>
        )}
      </GlassCard>

      {errorText && (
        <GlassCard className="p-4 border border-red-100/50">
          <p className="text-red-600 text-sm">{errorText}</p>
        </GlassCard>
      )}

      {analyzing && (
        <GlassCard className="p-6 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-[#7c3aed] border-t-transparent rounded-full mx-auto" />
          <p className="mt-3 text-[#1e1b4b]">AI is analyzing the scene...</p>
          <p className="text-sm text-[#6b7280]">Powered by Gemini 2.0 Flash Vision</p>
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
              <span className={`px-3 py-1 rounded-full text-white text-sm bg-gradient-to-r ${severityColor[report.severity] || "from-gray-400 to-gray-500"}`}>
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
            {report.immediate_actions.map((a, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-50/80 text-green-600 flex items-center justify-center shrink-0 border border-green-100/50">{i + 1}</span>
                <span className="text-[#374151]">{a}</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-5 space-y-2">
            <h3 className="text-[#ef4444] flex items-center gap-2">
              <XCircle size={18} /> DO NOT
            </h3>
            {report.do_not_do.map((d, i) => (
              <div key={i} className="flex gap-2 text-sm text-red-600">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{d}</span>
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

          <button className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] active:scale-[0.98] transition-transform">
            <Send size={18} /> Forward to Ambulance
          </button>
        </>
      )}
    </div>
  );
}
