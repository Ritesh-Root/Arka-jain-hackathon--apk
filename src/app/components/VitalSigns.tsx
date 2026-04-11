import React, { useRef, useState, useCallback, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { loadProfile } from "../lib/storage";
import { Camera, Send, AlertTriangle, CheckCircle, XCircle, Siren, Pill, QrCode } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera } from "@capacitor/camera";
import QRCode from "qrcode";

interface ScanTreatmentReport {
  severity: "critical" | "serious" | "moderate" | "minor";
  likelyInjuries: string[];
  immediateTreatment: string[];
  medicines: string[];
  doNotDo: string[];
  escalation: string;
  summary: string;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const HARDCODED_GROQ_API_KEY_PRIMARY = atob("Z3NrX0dDSzJPbGg2UGhDQWtGeEpnYnoxV0dkeWIzRlk1N2lyTTlFckhBWHpRM0RRTWdTOXlpUGo=");
const HARDCODED_GROQ_API_KEY_BACKUP = atob("Z3NrXzBjVVJiWHNrb1JXU1dFM2c5WHE3V0dkeWIzRll2UUFlNmxzV0R2V2UyMmVncVMyVzkyUEE=");
const GROQ_API_KEYS = [
  HARDCODED_GROQ_API_KEY_PRIMARY,
  HARDCODED_GROQ_API_KEY_BACKUP,
  import.meta.env.VITE_GROQ_API_KEY || "",
  import.meta.env.VITE_GROQ_API_KEY_BACKUP || "",
].filter((key) => !!key);
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function fallbackReport(): ScanTreatmentReport {
  return {
    severity: "serious",
    likelyInjuries: ["Possible trauma injury", "Further clinical assessment needed"],
    immediateTreatment: [
      "Ensure scene is safe before approaching patient",
      "Check responsiveness and breathing",
      "Control visible bleeding with firm pressure using clean cloth",
      "Keep patient still and monitor airway until medical help arrives",
    ],
    medicines: [
      "Paracetamol 500mg (for pain, if conscious and not allergic)",
      "Sterile saline (to rinse open wounds)",
      "Antiseptic (Povidone-iodine) for cleaning intact skin around wounds",
    ],
    doNotDo: [
      "Do not move neck/spine if major trauma is suspected",
      "Do not give food or water",
      "Do not remove deeply embedded objects",
    ],
    escalation: "Call emergency services immediately if breathing is abnormal, heavy bleeding continues, or consciousness drops.",
    summary: "Basic first-aid guidance generated. Please seek professional medical support immediately.",
  };
}

function extractJsonBlock(text: string): string | null {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function normalizeReport(raw: any): ScanTreatmentReport {
  const safeSeverity = ["critical", "serious", "moderate", "minor"].includes(raw?.severity)
    ? raw.severity
    : "serious";

  return {
    severity: safeSeverity,
    likelyInjuries: Array.isArray(raw?.likelyInjuries) ? raw.likelyInjuries : [],
    immediateTreatment: Array.isArray(raw?.immediateTreatment) ? raw.immediateTreatment : [],
    medicines: Array.isArray(raw?.medicines) ? raw.medicines : [],
    doNotDo: Array.isArray(raw?.doNotDo) ? raw.doNotDo : [],
    escalation: typeof raw?.escalation === "string" ? raw.escalation : "Call emergency services if condition worsens.",
    summary: typeof raw?.summary === "string" ? raw.summary : "AI scan completed.",
  };
}

export function VitalSigns() {
  const profile = loadProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [wantsCamera, setWantsCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [report, setReport] = useState<ScanTreatmentReport | null>(null);
  const [errorText, setErrorText] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrPayload, setQrPayload] = useState<string>("");

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

  // When the user wants the camera on, the <video> element is mounted by the
  // JSX below. Only after that mount can we attach a MediaStream to its ref.
  // Doing this in an effect (instead of the click handler) avoids the
  // chicken-and-egg deadlock where videoRef.current is null at attach time.
  useEffect(() => {
    if (!wantsCamera) return;

    let cancelled = false;

    const start = async () => {
      setErrorText("");
      setCameraReady(false);
      releaseStream();

      // On Android (Capacitor), the WebView's getUserMedia is gated on the
      // host app holding the runtime CAMERA permission. Trigger the system
      // dialog via @capacitor/camera before attempting to open the stream.
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await CapCamera.requestPermissions({ permissions: ["camera"] });
          if (cancelled) return;
          if (status.camera !== "granted" && status.camera !== "limited") {
            setErrorText("Camera permission denied. Enable it in app settings and try again.");
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
          // Try the next constraint set.
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

  const scanPatient = useCallback(async () => {
    if (!videoRef.current) return;

    setErrorText("");
    const ready = await waitForVideoFrame(videoRef.current);
    if (!ready) {
      setErrorText("Camera is still warming up. Please try scan again.");
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
    setErrorText("");
    setReport(null);

    try {
      if (!GROQ_API_KEYS.length) {
        setReport(fallbackReport());
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
                  "You are an emergency first-aid assistant. Analyze injury visuals cautiously and return strict JSON only with keys: severity, likelyInjuries, immediateTreatment, medicines, doNotDo, escalation, summary. The 'medicines' key MUST be an array of short strings naming common over-the-counter or first-aid medicines that could help (e.g. 'Paracetamol 500mg for pain', 'Antiseptic for wound cleaning'), each with a brief usage note. Respect any allergies provided in the patient context and never recommend a medicine the patient is allergic to. Keep steps practical and short. Never claim diagnosis certainty.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      `Patient context: name=${profile.fullName}, age=${profile.age}, bloodType=${profile.bloodType}, allergies=${profile.allergies.join(", ") || "none"}, conditions=${profile.conditions.join(", ") || "none"}. Analyze this patient image and give immediate first-aid treatment plan in JSON format only.`,
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
        setReport(normalizeReport(parsed));
        return;
      }

      setReport(fallbackReport());
    } catch {
      setReport(fallbackReport());
    } finally {
      setAnalyzing(false);
    }
  }, [profile, waitForVideoFrame]);

  useEffect(() => {
    return () => {
      releaseStream();
    };
  }, [releaseStream]);

  // Generate a fresh QR code each time a new AI report arrives. The QR encodes
  // a human-readable summary of the patient's symptoms (likely injuries) and
  // the recommended medicines so any third party with a QR scanner can read it
  // without needing the app installed.
  useEffect(() => {
    if (!report) {
      setQrDataUrl("");
      setQrPayload("");
      return;
    }

    const lines: string[] = [
      "JEEVAN RAKSHAK - PATIENT TREATMENT",
      `Patient: ${profile.fullName || "Unknown"}${profile.age ? `, age ${profile.age}` : ""}`,
      `Blood Type: ${profile.bloodType || "Unknown"}`,
      `Severity: ${report.severity.toUpperCase()}`,
      "",
      "SYMPTOMS:",
      ...(report.likelyInjuries.length
        ? report.likelyInjuries.map((s) => `- ${s}`)
        : ["- (none reported)"]),
      "",
      "MEDICINES:",
      ...(report.medicines.length
        ? report.medicines.map((m) => `- ${m}`)
        : ["- (none recommended)"]),
      "",
      `Issued: ${new Date().toLocaleString()}`,
    ];
    const payload = lines.join("\n");
    setQrPayload(payload);

    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1e1b4b", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [report, profile.fullName, profile.age, profile.bloodType]);

  const severityColor: Record<ScanTreatmentReport["severity"], string> = {
    critical: "from-[#ef4444] to-[#dc2626]",
    serious: "from-[#f97316] to-[#ea580c]",
    moderate: "from-[#eab308] to-[#ca8a04]",
    minor: "from-[#22c55e] to-[#16a34a]",
  };

  return (
    <div className="p-4 pb-28 space-y-4">
      <div className="pt-6 pb-2">
        <p className="text-sm text-[#7c3aed]/70">AI Emergency</p>
        <h1 className="text-[#1e1b4b]">Scan Patient</h1>
        <p className="text-sm text-[#6b7280] mt-1">Scan an injured person and get immediate AI treatment guidance</p>
      </div>

      {!wantsCamera ? (
        <GlassCard className="p-8">
          <button onClick={handleOpenCamera} className="w-full flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#f472b6] to-[#ec4899] flex items-center justify-center">
              <Camera size={40} className="text-white" />
            </div>
            <span className="text-[#1e1b4b]">Open camera to scan patient</span>
            <span className="text-sm text-[#6b7280]">Capture clearly visible injuries for better first-aid response</span>
          </button>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <video ref={videoRef} className="w-full h-[280px] object-cover rounded-t-3xl" playsInline autoPlay muted />
          <div className="p-3 flex gap-2">
            <button
              onClick={() => void scanPatient()}
              disabled={analyzing || !cameraReady}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {analyzing ? "Analyzing patient..." : cameraReady ? "Scan Patient" : "Initializing Camera..."}
            </button>
            <button
              onClick={stopCamera}
              className="py-3 px-5 rounded-2xl bg-red-50/80 text-red-600 border border-red-100/50"
            >
              Stop
            </button>
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
          <p className="mt-3 text-[#1e1b4b]">AI is preparing treatment steps...</p>
        </GlassCard>
      )}

      {capturedImage && (
        <GlassCard className="overflow-hidden">
          <img src={capturedImage} alt="Captured patient" className="w-full h-[220px] object-cover rounded-3xl" />
        </GlassCard>
      )}

      {report && !analyzing && (
        <>
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[#1e1b4b]">AI Treatment Report</h3>
              <span className={`px-3 py-1 rounded-full text-white text-sm bg-gradient-to-r ${severityColor[report.severity]}`}>
                {report.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-[#374151] text-sm">{report.summary}</p>
          </GlassCard>

          <GlassCard className="p-5 space-y-2">
            <h3 className="text-[#ef4444] flex items-center gap-2">
              <Siren size={18} /> Likely Injuries
            </h3>
            {report.likelyInjuries.map((injury, index) => (
              <div key={`${injury}-${index}`} className="flex gap-2 text-sm text-[#374151]">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[#ef4444]" />
                <span>{injury}</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-5 space-y-2">
            <h3 className="text-[#059669] flex items-center gap-2">
              <CheckCircle size={18} /> Immediate Treatment
            </h3>
            {report.immediateTreatment.map((step, index) => (
              <div key={`${step}-${index}`} className="flex gap-2 text-sm text-[#374151]">
                <span className="w-5 h-5 rounded-full bg-green-50/80 text-green-600 flex items-center justify-center shrink-0 border border-green-100/50">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </GlassCard>

          {report.medicines.length > 0 && (
            <GlassCard className="p-5 space-y-2">
              <h3 className="text-[#7c3aed] flex items-center gap-2">
                <Pill size={18} /> Recommended Medicines
              </h3>
              <p className="text-xs text-[#6b7280]">
                Suggested over-the-counter / first-aid medicines. Confirm with a clinician before administering.
              </p>
              {report.medicines.map((med, index) => (
                <div key={`${med}-${index}`} className="flex gap-2 text-sm text-[#374151]">
                  <Pill size={14} className="shrink-0 mt-0.5 text-[#7c3aed]" />
                  <span>{med}</span>
                </div>
              ))}
            </GlassCard>
          )}

          <GlassCard className="p-5 space-y-2">
            <h3 className="text-[#ef4444] flex items-center gap-2">
              <XCircle size={18} /> Do Not Do
            </h3>
            {report.doNotDo.map((warning, index) => (
              <div key={`${warning}-${index}`} className="flex gap-2 text-sm text-red-600">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-[#1e1b4b] mb-2">Escalation Advice</h3>
            <p className="text-sm text-[#4b5563]">{report.escalation}</p>
          </GlassCard>

          {qrDataUrl && (
            <GlassCard className="p-5 flex flex-col items-center space-y-3">
              <div className="flex items-center gap-2 text-[#7c3aed]">
                <QrCode size={20} />
                <h3 className="text-[#1e1b4b]">Treatment QR</h3>
              </div>
              <p className="text-center text-xs text-[#6b7280]">
                Scan with any QR reader to share the patient's symptoms and recommended medicines with paramedics or hospital staff.
              </p>
              <div className="bg-white p-4 rounded-3xl shadow-inner">
                <img
                  src={qrDataUrl}
                  alt="Patient symptoms and medicines QR code"
                  className="w-64 h-64"
                />
              </div>
              <button
                onClick={() => {
                  if (!qrPayload) return;
                  navigator.clipboard?.writeText(qrPayload).catch(() => {});
                }}
                className="text-xs text-[#7c3aed] underline"
              >
                Copy QR text
              </button>
            </GlassCard>
          )}

          <button
            onClick={() => window.location.assign("tel:112")}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ef4444] to-[#b91c1c] text-white flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(239,68,68,0.3)] active:scale-[0.98] transition-transform"
          >
            <Send size={18} /> Call Emergency Services
          </button>
        </>
      )}
    </div>
  );
}