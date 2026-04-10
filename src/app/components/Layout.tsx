import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, QrCode, Map, Camera, Mic, Settings } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { SOSActive } from "./SOSActive";
import {
  loadProfile,
  saveProfile,
  loadSettings,
  isOnboardingCompleted,
  markOnboardingCompleted,
  PRIMARY_EMERGENCY_NUMBER,
  SETTINGS_UPDATED_EVENT,
} from "../lib/storage";
import {
  enableAndroidBackgroundProtection,
  openAndroidPermissionSettings,
  syncAndroidEmergencyConfig,
} from "../lib/androidHotword";
import { toast } from "sonner";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const PERMISSION_SETUP_KEY = "jeevan_rakshak_permission_setup_completed";

type PermissionStep = {
  id: "android-system" | "system" | "microphone" | "camera" | "location" | "notifications";
  title: string;
  description: string;
};

const ANDROID_PERMISSION_STEPS: PermissionStep[] = [
  {
    id: "android-system",
    title: "System Permission Flow",
    description:
      "Tap continue to open native Android permission popups one-by-one (microphone, camera, call, SMS, notifications).",
  },
];

const WEB_PERMISSION_STEPS: PermissionStep[] = [
  {
    id: "system",
    title: "System Motion Permission",
    description: "Required for shake-based SOS trigger on supported phones.",
  },
  {
    id: "microphone",
    title: "Microphone Permission",
    description: "Required for 24x7 SOS hotword listening.",
  },
  {
    id: "camera",
    title: "Camera Permission",
    description: "Required for Scan Patient and emergency visual analysis.",
  },
  {
    id: "location",
    title: "Location Permission",
    description: "Required to send exact coordinates during SOS.",
  },
  {
    id: "notifications",
    title: "Notification Permission",
    description: "Required to keep background emergency guard service visible.",
  },
];

function splitCsv(text: string): string[] {
  return text
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sosActive, setSosActive] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [settings, setSettings] = useState(() => loadSettings());
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [permissionSetupOpen, setPermissionSetupOpen] = useState(false);
  const [permissionStepIndex, setPermissionStepIndex] = useState(0);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [setupName, setSetupName] = useState("");
  const [setupAge, setSetupAge] = useState("");
  const [setupBloodType, setSetupBloodType] = useState("");
  const [setupConditions, setSetupConditions] = useState("");
  const [setupAllergies, setSetupAllergies] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRelationship, setContactRelationship] = useState("Family");
  const [contactPhone, setContactPhone] = useState("");
  const tapTimesRef = useRef<number[]>([]);
  const recognitionRef = useRef<any>(null);
  const keywordDetectionsRef = useRef<number[]>([]);
  const isAndroidNative = Capacitor.getPlatform() === "android";
  const permissionSteps = isAndroidNative ? ANDROID_PERMISSION_STEPS : WEB_PERMISSION_STEPS;

  const syncBackgroundProtection = useCallback(async (options?: { suppressToast?: boolean }) => {
    const profile = loadProfile();
    const currentSettings = loadSettings();
    const contactNumbers = profile.emergencyContacts.map((contact) => contact.phone).filter(Boolean);

    try {
      await syncAndroidEmergencyConfig(
        PRIMARY_EMERGENCY_NUMBER,
        contactNumbers,
        currentSettings.shakeSOSEnabled
      );
      await enableAndroidBackgroundProtection(
        PRIMARY_EMERGENCY_NUMBER,
        contactNumbers,
        currentSettings.shakeSOSEnabled
      );
      return true;
    } catch {
      if (!options?.suppressToast) {
        toast.error("Allow microphone, call and SMS permissions for 24x7 Android protection.");
      }
      return false;
    }
  }, []);

  const triggerSOS = useCallback(() => {
    setSosActive(true);
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  }, []);

  const requestPermissionStep = useCallback(async (step: PermissionStep["id"]) => {
    if (step === "android-system") {
      const started = await syncBackgroundProtection({ suppressToast: true });
      if (!started) {
        await openAndroidPermissionSettings();
      }
      return started;
    }

    switch (step) {
      case "system": {
        const evt = window.DeviceMotionEvent as any;
        if (evt && typeof evt.requestPermission === "function") {
          const status = await evt.requestPermission();
          return status === "granted";
        }
        return true;
      }
      case "microphone": {
        if (navigator.permissions?.query) {
          try {
            const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
            if (status.state === "granted") return true;
          } catch {
            // Continue with direct request.
          }
        }

        if (!navigator.mediaDevices?.getUserMedia) return false;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return true;
      }
      case "camera": {
        if (navigator.permissions?.query) {
          try {
            const status = await navigator.permissions.query({ name: "camera" as PermissionName });
            if (status.state === "granted") return true;
          } catch {
            // Continue with direct request.
          }
        }

        if (!navigator.mediaDevices?.getUserMedia) return false;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        return true;
      }
      case "location": {
        return await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { enableHighAccuracy: true, timeout: 15000 }
          );
        });
      }
      case "notifications": {
        if (!("Notification" in window)) return true;
        const result = await Notification.requestPermission();
        return result === "granted";
      }
      default:
        return true;
    }
  }, [syncBackgroundProtection]);

  const openSettingsManually = useCallback(async () => {
    try {
      await openAndroidPermissionSettings();
      setPermissionError(
        "App Settings opened. Enable Microphone, Camera, Phone, SMS and Notifications, then return and tap the button again."
      );
    } catch {
      setPermissionError("Could not open app settings automatically. Please open app settings manually.");
    }
  }, []);

  const runPermissionStep = useCallback(async () => {
    const current = permissionSteps[permissionStepIndex];
    if (!current || permissionBusy) return;

    setPermissionBusy(true);
    setPermissionError("");

    try {
      const granted = await requestPermissionStep(current.id);
      if (!granted) {
        setPermissionError(`Please allow ${current.title} to continue always-on SOS protection.`);
        return;
      }

      if (permissionStepIndex >= permissionSteps.length - 1) {
        localStorage.setItem(PERMISSION_SETUP_KEY, "true");
        setPermissionSetupOpen(false);
        setPermissionStepIndex(0);
        toast.success("All emergency permissions granted.");
        if (!isAndroidNative) {
          await syncBackgroundProtection();
        }
        return;
      }

      setPermissionStepIndex((index) => index + 1);
    } catch {
      setPermissionError(`Could not complete ${current.title}. Please try again.`);
    } finally {
      setPermissionBusy(false);
    }
  }, [
    isAndroidNative,
    permissionBusy,
    permissionStepIndex,
    permissionSteps,
    requestPermissionStep,
    syncBackgroundProtection,
  ]);

  useEffect(() => {
    const handleSettingsUpdated = () => setSettings(loadSettings());
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
  }, []);

  useEffect(() => {
    if (!isOnboardingCompleted()) {
      const profile = loadProfile();
      const firstContact = profile.emergencyContacts[0];
      setSetupName(profile.fullName || "");
      setSetupAge(profile.age ? String(profile.age) : "");
      setSetupBloodType(profile.bloodType || "");
      setSetupConditions(profile.conditions.join(", "));
      setSetupAllergies(profile.allergies.join(", "));
      setContactName(firstContact?.name || "");
      setContactRelationship(firstContact?.relationship || "Family");
      setContactPhone(firstContact?.phone || "");
      setOnboardingOpen(true);
    }
  }, []);

  const handleOnboardingSave = async () => {
    if (!setupName.trim() || !setupBloodType.trim() || !contactName.trim() || !contactPhone.trim()) {
      toast.error("Please fill name, blood type, and primary emergency contact");
      return;
    }

    const profile = loadProfile();
    const parsedAge = Number.parseInt(setupAge, 10);
    const newContact = {
      name: contactName.trim(),
      relationship: contactRelationship.trim() || "Emergency Contact",
      phone: contactPhone.trim(),
    };

    const customConditions = splitCsv(setupConditions);
    const customAllergies = splitCsv(setupAllergies);

    const updatedProfile = {
      ...profile,
      fullName: setupName.trim(),
      age: Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : profile.age,
      bloodType: setupBloodType,
      conditions: customConditions.length ? customConditions : profile.conditions,
      allergies: customAllergies.length ? customAllergies : profile.allergies,
      emergencyContacts: [newContact, ...profile.emergencyContacts].slice(0, 3),
    };

    saveProfile(updatedProfile);
    markOnboardingCompleted();
    setOnboardingOpen(false);
    toast.success("Profile setup saved");
    await syncBackgroundProtection();
  };

  useEffect(() => {
    if (!onboardingOpen && isOnboardingCompleted()) {
      const permissionDone = localStorage.getItem(PERMISSION_SETUP_KEY) === "true";
      if (!permissionDone) {
        setPermissionSetupOpen(true);
        return;
      }

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
    if (permissionSetupOpen) return;
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      const keywordPattern = /\bsos\b|\bhelp\b|bachao|बचाओ|madad|मदद|emergency/gi;
      const now = Date.now();

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();

        if (
          transcript.includes("sos sos sos") ||
          transcript.includes("help help help") ||
          transcript.includes("bachao bachao bachao") ||
          transcript.includes("बचाओ बचाओ बचाओ")
        ) {
          triggerSOS();
          return;
        }

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
  }, [permissionSetupOpen, triggerSOS]);

  useEffect(() => {
    if (!settings.shakeSOSEnabled) {
      return;
    }

    const shakeDetections: number[] = [];
    let lastSampleAt = 0;

    const onMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const now = Date.now();
      if (now - lastSampleAt < 300) return;

      const x = (acc.x || 0) / 9.80665;
      const y = (acc.y || 0) / 9.80665;
      const z = (acc.z || 0) / 9.80665;
      const gForce = Math.sqrt(x * x + y * y + z * z);

      if (gForce < 2.7) return;

      lastSampleAt = now;
      shakeDetections.push(now);

      while (shakeDetections.length && now - shakeDetections[0] > 4500) {
        shakeDetections.shift();
      }

      if (shakeDetections.length >= 4) {
        shakeDetections.length = 0;
        triggerSOS();
      }
    };

    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [settings.shakeSOSEnabled, triggerSOS]);

  if (sosActive) {
    return <SOSActive onDeactivate={() => setSosActive(false)} />;
  }

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: QrCode, label: "QR", path: "/qr" },
    { icon: Map, label: "Map", path: "/hospitals" },
    { icon: Camera, label: "Scan", path: "/scan" },
    { icon: Settings, label: "Settings", path: "/profile" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#e0c3fc] via-[#d5c6f9] to-[#c7d2fe]">
      {/* Decorative blurred orbs */}
      <div className="fixed top-[-80px] left-[-60px] w-[280px] h-[280px] rounded-full bg-[#c084fc]/30 blur-[56px] pointer-events-none" />
      <div className="fixed top-[30%] right-[-80px] w-[240px] h-[240px] rounded-full bg-[#818cf8]/20 blur-[52px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-40px] w-[200px] h-[200px] rounded-full bg-[#67e8f9]/20 blur-[44px] pointer-events-none" />

      {/* Voice indicator */}
      {voiceListening && (
        <div className="fixed top-3 right-3 z-50 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-lg text-[#7c3aed] text-xs flex items-center gap-1.5 shadow-sm border border-white/40">
          <Mic size={12} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse" />
          Voice SOS/Help/Bachao/Madad
        </div>
      )}

      {permissionSetupOpen && (() => {
        const current = permissionSteps[permissionStepIndex];
        return (
          <div className="fixed inset-0 z-[125] bg-[#1e1b4b]/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-white/40">
              <p className="text-sm text-[#7c3aed]/80">Permissions Setup ({permissionStepIndex + 1}/{permissionSteps.length})</p>
              <h2 className="text-[#1e1b4b] mt-1">{current?.title}</h2>
              <p className="text-sm text-[#6b7280] mt-1">{current?.description}</p>
              <p className="text-xs text-[#9ca3af] mt-3">
                Allow permissions one-by-one to keep SOS detection active even when app is not open.
              </p>

              {permissionError && (
                <div className="mt-4 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                  {permissionError}
                </div>
              )}

              <button
                onClick={runPermissionStep}
                disabled={permissionBusy}
                className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white disabled:opacity-60"
              >
                {permissionBusy
                  ? "Requesting permission..."
                  : isAndroidNative
                    ? "Open System Permission Popup"
                    : `Allow ${current?.title}`}
              </button>

              {isAndroidNative && (
                <button
                  onClick={openSettingsManually}
                  disabled={permissionBusy}
                  className="mt-2 w-full py-3 rounded-2xl bg-white border border-[#d8b4fe] text-[#7c3aed] disabled:opacity-60"
                >
                  Open App Settings
                </button>
              )}

              {Capacitor.getPlatform() === "android" && (
                <p className="text-[11px] text-[#6b7280] mt-3">
                  After this, keep battery optimization OFF for this app to improve 24x7 hotword reliability.
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {onboardingOpen && (
        <div className="fixed inset-0 z-[120] bg-[#1e1b4b]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-white/40 max-h-[90vh] overflow-y-auto">
            <p className="text-sm text-[#7c3aed]/80">Account setup</p>
            <h2 className="text-[#1e1b4b] mt-1">Complete your emergency profile</h2>
            <p className="text-sm text-[#6b7280] mt-1">This will be saved and auto-loaded every time you open the app.</p>

            <div className="mt-4 space-y-3">
              <input
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#d8b4fe] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={setupAge}
                  onChange={(e) => setSetupAge(e.target.value)}
                  placeholder="Age"
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#d8b4fe] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
                />
                <select
                  value={setupBloodType}
                  onChange={(e) => setSetupBloodType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#d8b4fe] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
                >
                  <option value="">Blood type</option>
                  {BLOOD_TYPES.map((bloodType) => (
                    <option key={bloodType} value={bloodType}>
                      {bloodType}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={setupConditions}
                onChange={(e) => setSetupConditions(e.target.value)}
                placeholder="Health conditions (comma separated)"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#d8b4fe] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
              />
              <input
                value={setupAllergies}
                onChange={(e) => setSetupAllergies(e.target.value)}
                placeholder="Allergies (comma separated)"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#d8b4fe] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
              />
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Primary emergency contact name"
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
              Save & Continue
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
        <div className="bg-white/70 backdrop-blur-xl rounded-full border border-white/50 shadow-[0_8px_24px_rgba(124,58,237,0.10)] px-2 py-2">
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
