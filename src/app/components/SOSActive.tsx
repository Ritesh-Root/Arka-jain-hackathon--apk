import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { loadProfile, getEmergencyDialTargets, PRIMARY_EMERGENCY_NUMBER } from "../lib/storage";
import { getNearestHospitals } from "../lib/hospitals";
import { Phone, MapPin, Mic, X, ChevronRight, MessageSquare, Droplets } from "lucide-react";
import { useNavigate } from "react-router";

interface SOSActiveProps {
  onDeactivate: () => void;
}

export function SOSActive({ onDeactivate }: SOSActiveProps) {
  const profile = loadProfile();
  const callTargets = useMemo(() => getEmergencyDialTargets(profile), [profile]);
  const navigate = useNavigate();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestHospitals, setNearestHospitals] = useState<ReturnType<typeof getNearestHospitals>>([]);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [callStatus, setCallStatus] = useState<string>("Preparing emergency dispatch...");
  const [smsStatus, setSmsStatus] = useState<string>("Waiting for location lock...");
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const cascadeRef = useRef<ReturnType<typeof setTimeout>>();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const hasStartedCallsRef = useRef(false);
  const hasTriggeredSmsRef = useRef(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setNearestHospitals(getNearestHospitals(c.lat, c.lng));
      },
      () => {
        const c = { lat: 22.8046, lng: 86.2030 };
        setCoords(c);
        setNearestHospitals(getNearestHospitals(c.lat, c.lng));
      }
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
      const smsUrl = `sms:${recipients.join(",")}?body=${encodeURIComponent(buildEmergencyMessage(lat, lng))}`;
      window.location.href = smsUrl;
      setSmsStatus(`SMS composer opened for ${recipients.length} emergency numbers. Tap send to dispatch.`);
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

  useEffect(() => {
    if (hasStartedCallsRef.current) return;
    if (!callTargets.length) {
      setCallStatus(`No contacts configured. Add contacts in profile. Primary emergency: ${PRIMARY_EMERGENCY_NUMBER}`);
      return;
    }
    hasStartedCallsRef.current = true;
    dialContactAtIndex(0);
  }, [callTargets, dialContactAtIndex]);

  useEffect(() => {
    if (!callTargets.length) return;
    if (currentContactIndex >= callTargets.length - 1) {
      setCallStatus("Reached last emergency number in cascade. Use Call button to retry.");
      return;
    }

    cascadeRef.current = setTimeout(() => {
      const nextIndex = currentContactIndex + 1;
      const nextTarget = callTargets[nextIndex];
      setCallStatus(`No response detected. Trying next number: ${nextTarget.name}`);
      dialContactAtIndex(nextIndex);
    }, 30000);

    return () => clearTimeout(cascadeRef.current);
  }, [currentContactIndex, callTargets, dialContactAtIndex]);

  useEffect(() => {
    if (!coords || hasTriggeredSmsRef.current) return;
    hasTriggeredSmsRef.current = true;

    const timeout = setTimeout(() => {
      try {
        openEmergencySmsComposer(coords.lat, coords.lng);
      } catch {
        setSmsStatus("Could not open SMS app automatically. Use the Send SMS button.");
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [coords, openEmergencySmsComposer]);

  useEffect(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.15;
      osc.frequency.value = 800;
      osc.type = "sawtooth";
      osc.start();

      let freq = 800;
      let dir = 1;
      const sirenInterval = setInterval(() => {
        freq += dir * 20;
        if (freq > 1200) dir = -1;
        if (freq < 600) dir = 1;
        osc.frequency.value = freq;
      }, 50);

      return () => { clearInterval(sirenInterval); osc.stop(); if (ctx.state !== "closed") ctx.close(); audioCtxRef.current = null; };
    } catch {}
  }, []);

  useEffect(() => {
    let wl: any;
    (async () => {
      try { wl = await (navigator as any).wakeLock.request("screen"); } catch {}
    })();
    return () => { if (wl) wl.release(); };
  }, []);

  useEffect(() => {
    let mediaRecorder: MediaRecorder | null = null;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        setIsRecording(true);
      } catch {}
    })();
    return () => { if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop(); };
  }, []);

  const currentContact = callTargets[currentContactIndex];
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const sendWhatsApp = (phone: string) => {
    const msg = encodeURIComponent(`EMERGENCY! ${profile.fullName} needs help. Location: https://maps.google.com/?q=${coords?.lat},${coords?.lng}`);
    window.open(`https://wa.me/${phone.replace(/\+/g, "")}?text=${msg}`, "_blank");
  };

  const callCurrentContact = () => {
    if (!currentContact) return;
    dialContactAtIndex(currentContactIndex);
  };

  const callNextContact = () => {
    if (currentContactIndex >= callTargets.length - 1) return;
    clearTimeout(cascadeRef.current);
    dialContactAtIndex(currentContactIndex + 1);
  };

  const sendSmsNow = () => {
    if (!coords) {
      setSmsStatus("Waiting for GPS lock before SMS.");
      return;
    }
    openEmergencySmsComposer(coords.lat, coords.lng);
  };

  const deactivate = () => {
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close();
    onDeactivate();
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
              <span>Location Locked</span>
            </div>
            <p className="text-sm opacity-60 mt-1 tabular-nums">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
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
          <button onClick={() => navigate("/copilot")} className="flex-1 py-3.5 bg-white/15 backdrop-blur rounded-2xl text-center border border-white/10 active:scale-[0.97] transition-transform">
            AI First-Aid Copilot
          </button>
          <button onClick={() => navigate("/witness")} className="flex-1 py-3.5 bg-white/15 backdrop-blur rounded-2xl text-center border border-white/10 active:scale-[0.97] transition-transform">
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
