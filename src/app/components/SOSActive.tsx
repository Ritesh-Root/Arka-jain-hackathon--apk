import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { loadProfile, getEmergencyDialTargets, PRIMARY_EMERGENCY_NUMBER } from "../lib/storage";
import { getNearestHospitals } from "../lib/hospitals";
import { ARKA_JAIN_JAMSHEDPUR_COORDS, ARKA_JAIN_JAMSHEDPUR_LABEL } from "../lib/location";
import { Phone, MapPin, Mic, X, ChevronRight, MessageSquare, Droplets } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

const AUTO_DIAL_COUNTDOWN_SECONDS = 8;

interface SOSActiveProps {
  onDeactivate: () => void;
}

export function SOSActive({ onDeactivate }: SOSActiveProps) {
  const profile = loadProfile();
  const callTargets = useMemo(() => getEmergencyDialTargets(profile), [profile]);
  const navigate = useNavigate();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestHospitals, setNearestHospitals] = useState<ReturnType<typeof getNearestHospitals>>(
    getNearestHospitals(ARKA_JAIN_JAMSHEDPUR_COORDS.lat, ARKA_JAIN_JAMSHEDPUR_COORDS.lng)
  );
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [callStatus, setCallStatus] = useState<string>("Ready. Auto-dialing primary contact shortly...");
  const [smsStatus, setSmsStatus] = useState<string>("Waiting for location lock...");
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [autoDialCountdown, setAutoDialCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDialRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const hasExportedRecordingRef = useRef(false);
  const hasStartedAutoDialRef = useRef(false);
  const activeCoords = coords ?? ARKA_JAIN_JAMSHEDPUR_COORDS;
  const isNative = Capacitor.isNativePlatform();

  const exportAudioEvidence = useCallback((blob: Blob) => {
    if (!blob.size || hasExportedRecordingRef.current) return;
    hasExportedRecordingRef.current = true;

    // Android WebView does not honor <a download> for blob URLs, so on native
    // platforms we just keep the blob in memory. On web we trigger the usual
    // download path so the evidence is at least saved to the user's Downloads.
    if (isNative) {
      setSmsStatus((prev) => (prev.includes("Audio evidence") ? prev : `${prev} Audio recorded locally.`));
      toast.success("SOS audio captured.");
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `sos-audio-${timestamp}.webm`;
    const downloadUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
    setSmsStatus((prev) => (prev.includes("Audio evidence") ? prev : `${prev} Audio evidence saved.`));
    toast.success("SOS audio recording saved.");
  }, [isNative]);

  const stopAudioCapture = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.requestData();
      } catch {
        // Ignore requestData failure and continue stopping recorder.
      }
      try {
        recorder.stop();
      } catch {
        // Ignore stop failure.
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUsingFallbackLocation(false);
        setCoords(c);
        setNearestHospitals(getNearestHospitals(c.lat, c.lng));
      },
      () => {
        const c = { lat: ARKA_JAIN_JAMSHEDPUR_COORDS.lat, lng: ARKA_JAIN_JAMSHEDPUR_COORDS.lng };
        setUsingFallbackLocation(true);
        setCoords(c);
        setNearestHospitals(getNearestHospitals(c.lat, c.lng));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatPhone = (phone: string) => phone.replace(/[^\d+]/g, "");

  const buildEmergencyMessage = useCallback(
    (lat: number, lng: number) => {
      const locationUrl = `https://maps.google.com/?q=${lat},${lng}`;
      return `SOS ALERT! ${profile.fullName} needs urgent help. Blood: ${profile.bloodType}. Allergies: ${profile.allergies.join(", ") || "N/A"}. Location: ${locationUrl}`;
    },
    [profile]
  );

  const callNumber = useCallback((phone: string) => {
    const normalized = formatPhone(phone);
    if (!normalized) return;
    window.location.href = `tel:${normalized}`;
  }, []);

  const openEmergencySmsComposer = useCallback(
    (lat: number, lng: number) => {
      const recipients = Array.from(new Set(callTargets.map((target) => formatPhone(target.phone)).filter(Boolean)));
      if (!recipients.length) return;
      // Android SMS apps are inconsistent about multi-recipient parsing in sms: URIs.
      // Open the composer with the primary recipient only; users can forward or
      // use the dedicated WhatsApp buttons for the rest.
      const primary = recipients[0];
      const body = encodeURIComponent(buildEmergencyMessage(lat, lng));
      const smsUrl = `sms:${primary}?body=${body}`;
      window.location.href = smsUrl;
      setSmsStatus(
        recipients.length > 1
          ? `SMS composer opened for ${primary}. Use WhatsApp buttons for other contacts.`
          : `SMS composer opened for ${primary}. Tap send to dispatch.`
      );
    },
    [buildEmergencyMessage, callTargets]
  );

  const dialContactAtIndex = useCallback(
    (index: number) => {
      const target = callTargets[index];
      if (!target) return;
      setCurrentContactIndex(index);
      setCallStatus(`Calling ${target.name} (${target.relationship}) at ${target.phone}`);
      callNumber(target.phone);
    },
    [callNumber, callTargets]
  );

  const cancelAutoDial = useCallback(() => {
    if (autoDialRef.current) {
      clearInterval(autoDialRef.current);
      autoDialRef.current = null;
    }
    setAutoDialCountdown(null);
  }, []);

  // Single cancelable countdown that auto-dials the FIRST emergency contact only.
  // No background cascade — subsequent contacts must be dialed manually via the
  // Call Next button to avoid surprise calls while the app is backgrounded.
  useEffect(() => {
    if (hasStartedAutoDialRef.current) return;
    if (!callTargets.length) {
      setCallStatus(`No contacts configured. Add contacts in profile. Primary emergency: ${PRIMARY_EMERGENCY_NUMBER}`);
      return;
    }

    hasStartedAutoDialRef.current = true;
    setAutoDialCountdown(AUTO_DIAL_COUNTDOWN_SECONDS);
    const first = callTargets[0];
    setCallStatus(`Auto-dialing ${first.name} in ${AUTO_DIAL_COUNTDOWN_SECONDS}s. Tap Cancel to stop.`);

    autoDialRef.current = setInterval(() => {
      setAutoDialCountdown((current) => {
        if (current === null) return null;
        const next = current - 1;
        if (next <= 0) {
          if (autoDialRef.current) {
            clearInterval(autoDialRef.current);
            autoDialRef.current = null;
          }
          dialContactAtIndex(0);
          return null;
        }
        setCallStatus(`Auto-dialing ${first.name} in ${next}s. Tap Cancel to stop.`);
        return next;
      });
    }, 1000);

    return () => {
      if (autoDialRef.current) {
        clearInterval(autoDialRef.current);
        autoDialRef.current = null;
      }
    };
  }, [callTargets, dialContactAtIndex]);

  useEffect(() => {
    let sirenInterval: ReturnType<typeof setInterval> | undefined;
    let osc: OscillatorNode | null = null;
    let ctx: AudioContext | null = null;

    try {
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
      osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.15;
      osc.frequency.value = 800;
      osc.type = "sawtooth";
      osc.start();

      let freq = 800;
      let dir = 1;
      sirenInterval = setInterval(() => {
        freq += dir * 20;
        if (freq > 1200) dir = -1;
        if (freq < 600) dir = 1;
        osc.frequency.value = freq;
      }, 50);

      return () => {
        if (sirenInterval) clearInterval(sirenInterval);
        try {
          osc?.stop();
        } catch {
          // no-op
        }
        if (ctx && ctx.state !== "closed") void ctx.close();
        audioCtxRef.current = null;
      };
    } catch {
      return () => {
        if (sirenInterval) clearInterval(sirenInterval);
      };
    }
  }, []);

  useEffect(() => {
    let wl: any;
    (async () => {
      try { wl = await (navigator as any).wakeLock.request("screen"); } catch {}
    })();
    return () => { if (wl) wl.release(); };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setSmsStatus((prev) => `${prev} Audio recording unavailable on this device.`);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const mediaRecorder = new MediaRecorder(stream);
        mediaStreamRef.current = stream;
        mediaRecorderRef.current = mediaRecorder;
        mediaChunksRef.current = [];
        hasExportedRecordingRef.current = false;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            mediaChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onerror = () => {
          setSmsStatus((prev) => `${prev} Audio recording error detected.`);
        };

        mediaRecorder.onstop = () => {
          const chunks = mediaChunksRef.current;
          mediaChunksRef.current = [];
          if (!chunks.length) return;
          const mimeType = mediaRecorder.mimeType || "audio/webm";
          exportAudioEvidence(new Blob(chunks, { type: mimeType }));
        };

        mediaRecorder.start(1000);
        setIsRecording(true);
      } catch {
        setIsRecording(false);
        setSmsStatus((prev) => `${prev} Audio recording unavailable (mic permission denied).`);
      }
    })();

    return () => {
      cancelled = true;
      stopAudioCapture();
    };
  }, [exportAudioEvidence, stopAudioCapture]);

  const currentContact = callTargets[currentContactIndex];
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const sendWhatsApp = (phone: string) => {
    if (!coords) {
      toast.info("Using Arka Jain fallback location while live GPS is locking.");
    }
    const msg = encodeURIComponent(`EMERGENCY! ${profile.fullName} needs help. Location: https://maps.google.com/?q=${activeCoords.lat},${activeCoords.lng}`);
    window.open(`https://wa.me/${phone.replace(/\+/g, "")}?text=${msg}`, "_blank");
  };

  const callCurrentContact = () => {
    if (!currentContact) return;
    cancelAutoDial();
    dialContactAtIndex(currentContactIndex);
  };

  const callNextContact = () => {
    if (currentContactIndex >= callTargets.length - 1) return;
    cancelAutoDial();
    dialContactAtIndex(currentContactIndex + 1);
  };

  const sendSmsNow = () => {
    if (!coords) {
      setSmsStatus(`Live GPS pending. Using fallback location: ${ARKA_JAIN_JAMSHEDPUR_LABEL}.`);
    }
    openEmergencySmsComposer(activeCoords.lat, activeCoords.lng);
  };

  const deactivate = () => {
    cancelAutoDial();
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close();
    stopAudioCapture();
    onDeactivate();
  };

  // Navigating to /copilot or /witness from the SOS screen is useless while
  // Layout still returns <SOSActive />. Deactivate SOS first so the target
  // route actually renders in the Outlet.
  const navigateAndDeactivate = (path: string) => {
    deactivate();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#dc2626] to-[#7f1d1d] text-white flex flex-col overflow-y-auto">
      <div className="absolute inset-0 border-4 border-white/20 animate-pulse pointer-events-none" />

      <div className="p-5 space-y-4 flex-1">
        {/* Header */}
        <div className="text-center pt-2">
          <div className="inline-block px-4 py-1 rounded-full bg-white/15 text-sm mb-2">SOS ACTIVE</div>
          <div className="text-5xl mt-2 tabular-nums">{formatTime(timer)}</div>
          {isRecording && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm opacity-80">
              <Mic size={14} />
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Recording audio
            </div>
          )}
        </div>

        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-4 border border-white/10 space-y-2">
          <p className="text-sm">Call Status: <span className="opacity-80">{callStatus}</span></p>
          <p className="text-sm">SMS Status: <span className="opacity-80">{smsStatus}</span></p>
          {autoDialCountdown !== null && (
            <button
              onClick={cancelAutoDial}
              className="w-full px-3 py-2 bg-white text-[#dc2626] rounded-xl text-sm"
            >
              Cancel auto-dial ({autoDialCountdown}s)
            </button>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={callCurrentContact} className="flex-1 px-3 py-2 bg-white/20 rounded-xl text-sm">Call Now</button>
            <button onClick={callNextContact} className="flex-1 px-3 py-2 bg-white/20 rounded-xl text-sm">Call Next</button>
            <button onClick={sendSmsNow} className="flex-1 px-3 py-2 bg-white/20 rounded-xl text-sm">Send SMS</button>
          </div>
        </div>

        {/* Patient info */}
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
          <p className="text-sm opacity-70">Patient</p>
          <p className="text-xl mt-1">{profile.fullName}, {profile.age}</p>
          <div className="flex gap-3 mt-2 text-sm flex-wrap">
            <span className="inline-flex items-center gap-1"><Droplets size={14} /> {profile.bloodType}</span>
            <span>Allergies: {profile.allergies.join(", ")}</span>
          </div>
        </div>

        {/* Location */}
        {coords && (
          <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-4 border border-white/10">
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{usingFallbackLocation ? "Fallback Location" : "Location Locked"}</span>
            </div>
            <p className="text-sm opacity-60 mt-1 tabular-nums">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
            {usingFallbackLocation && <p className="text-xs opacity-60 mt-1">{ARKA_JAIN_JAMSHEDPUR_LABEL}</p>}
          </div>
        )}

        {/* Nearest hospitals */}
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-5 space-y-3 border border-white/10">
          <h3>Nearest Hospitals</h3>
          {nearestHospitals.map((h, i) => (
            <div key={h.name} className="flex items-center justify-between bg-white/10 rounded-2xl p-3">
              <div>
                <p>{i + 1}. {h.name}</p>
                <p className="text-sm opacity-60">{h.distance.toFixed(1)} km | ETA {h.eta} min | {h.bedsAvailable} beds</p>
              </div>
              <a href={`tel:${h.phone}`} className="p-2.5 bg-white/20 rounded-full"><Phone size={16} /></a>
            </div>
          ))}
        </div>

        {/* Contact cascade */}
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-5 space-y-3 border border-white/10">
          <h3>Contact Cascade</h3>
          {callTargets.map((c, i) => (
            <div key={c.phone} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
              i === currentContactIndex ? "bg-white/20 border border-white/30" : "bg-white/5 opacity-50"
            }`}>
              <div>
                <p>{c.name} ({c.relationship})</p>
                <p className="text-sm opacity-60">{c.phone}</p>
              </div>
              <div className="flex gap-2">
                {i === currentContactIndex && (
                  <>
                    <button onClick={() => dialContactAtIndex(i)} className="px-3 py-1.5 bg-green-500 rounded-full text-sm flex items-center gap-1"><Phone size={12} /> Call</button>
                    <button onClick={() => sendWhatsApp(c.phone)} className="px-3 py-1.5 bg-[#25D366] rounded-full text-sm flex items-center gap-1"><MessageSquare size={12} /> WA</button>
                  </>
                )}
                {i < currentContactIndex && <span className="text-sm opacity-40">Called</span>}
                {i > currentContactIndex && <span className="text-sm opacity-40">Pending</span>}
              </div>
            </div>
          ))}
          {currentContactIndex < callTargets.length - 1 && (
            <button onClick={callNextContact} className="w-full py-2.5 bg-white/15 rounded-2xl flex items-center justify-center gap-1 text-sm">
              Skip to next contact <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <button onClick={() => navigateAndDeactivate("/copilot")} className="flex-1 py-3.5 bg-white/15 backdrop-blur rounded-2xl text-center border border-white/10 active:scale-[0.97] transition-transform">
            AI First-Aid Copilot
          </button>
          <button onClick={() => navigateAndDeactivate("/witness")} className="flex-1 py-3.5 bg-white/15 backdrop-blur rounded-2xl text-center border border-white/10 active:scale-[0.97] transition-transform">
            AI Eye Witness
          </button>
        </div>

        {/* Deactivate */}
        <button onClick={deactivate} className="w-full py-4 bg-white text-[#dc2626] rounded-2xl flex items-center justify-center gap-2 mt-2 active:scale-[0.98] transition-transform">
          <X size={20} /> Deactivate SOS
        </button>
      </div>
    </div>
  );
}
