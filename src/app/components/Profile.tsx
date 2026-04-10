import React, { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import {
  loadProfile,
  saveProfile,
  loadSettings,
  saveSettings,
  MedicalProfile,
  PRIMARY_EMERGENCY_NUMBER,
} from "../lib/storage";
import {
  getAndroidPermissionStates,
  openAndroidPermissionSettings,
  syncAndroidEmergencyConfig,
} from "../lib/androidHotword";
import { GlassCard } from "./GlassCard";
import { User, Heart, Pill, Phone, Save, Plus, X, Siren, ShieldCheck, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMMON_ALLERGIES = ["Penicillin", "Sulfa drugs", "Aspirin", "Ibuprofen", "Latex", "Peanuts", "Shellfish"];
const COMMON_CONDITIONS = ["Hypertension", "Type 2 Diabetes", "Type 1 Diabetes", "Asthma", "Heart Disease", "Epilepsy", "Arthritis"];

type PermissionStateLabel = "granted" | "denied" | "prompt" | "unknown";

type PermissionSnapshot = {
  microphone: PermissionStateLabel;
  camera: PermissionStateLabel;
  location: PermissionStateLabel;
  notifications: PermissionStateLabel;
  phoneCall: PermissionStateLabel;
  sms: PermissionStateLabel;
};

type DiagnosticEntry = {
  timestamp: number;
  type: string;
  source?: string;
  transcript?: string;
  hits?: number;
  count?: number;
  gForce?: number;
  threshold?: number;
  error?: string;
};

const DEFAULT_PERMISSION_SNAPSHOT: PermissionSnapshot = {
  microphone: "unknown",
  camera: "unknown",
  location: "unknown",
  notifications: "unknown",
  phoneCall: "unknown",
  sms: "unknown",
};

const DIAGNOSTICS_EVENT_NAME = "jr_diagnostics_event";
const MAX_DIAGNOSTICS = 20;

function statePillClass(value: PermissionStateLabel): string {
  if (value === "granted") return "bg-green-50 text-green-700 border-green-200";
  if (value === "denied") return "bg-red-50 text-red-700 border-red-200";
  if (value === "prompt") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function stateLabel(value: PermissionStateLabel): string {
  if (value === "granted") return "Granted";
  if (value === "denied") return "Denied";
  if (value === "prompt") return "Ask";
  return "Unknown";
}

export function Profile() {
  const [profile, setProfile] = useState<MedicalProfile>(loadProfile());
  const [shakeSOSEnabled, setShakeSOSEnabled] = useState(() => loadSettings().shakeSOSEnabled);
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [permissionSnapshot, setPermissionSnapshot] = useState<PermissionSnapshot>(DEFAULT_PERMISSION_SNAPSHOT);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const isAndroidNative = Capacitor.getPlatform() === "android";

  const voiceApiAvailable =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const motionApiAvailable = typeof window !== "undefined" && "DeviceMotionEvent" in window;

  useEffect(() => {
    setProfile(loadProfile());
    setShakeSOSEnabled(loadSettings().shakeSOSEnabled);
  }, []);

  const refreshPermissionSnapshot = useCallback(async () => {
    setPermissionsLoading(true);

    try {
      if (isAndroidNative) {
        const status = await getAndroidPermissionStates();
        setPermissionSnapshot({
          microphone: status.audio ? "granted" : "denied",
          camera: status.camera ? "granted" : "denied",
          location: "unknown",
          notifications: status.notifications ? "granted" : "denied",
          phoneCall: status.call ? "granted" : "denied",
          sms: status.sms ? "granted" : "denied",
        });
        return;
      }

      const snapshot: PermissionSnapshot = { ...DEFAULT_PERMISSION_SNAPSHOT };

      if (navigator.permissions?.query) {
        try {
          snapshot.microphone = (await navigator.permissions.query({ name: "microphone" as PermissionName })).state as PermissionStateLabel;
        } catch {
          snapshot.microphone = "unknown";
        }

        try {
          snapshot.camera = (await navigator.permissions.query({ name: "camera" as PermissionName })).state as PermissionStateLabel;
        } catch {
          snapshot.camera = "unknown";
        }

        try {
          snapshot.location = (await navigator.permissions.query({ name: "geolocation" })).state as PermissionStateLabel;
        } catch {
          snapshot.location = "unknown";
        }
      }

      if (typeof Notification !== "undefined") {
        const n = Notification.permission;
        snapshot.notifications = n === "granted" ? "granted" : n === "denied" ? "denied" : "prompt";
      }

      setPermissionSnapshot(snapshot);
    } finally {
      setPermissionsLoading(false);
    }
  }, [isAndroidNative]);

  const applyShakeSetting = useCallback(async (enabled: boolean) => {
    setShakeSOSEnabled(enabled);
    saveSettings({ shakeSOSEnabled: enabled });

    const contactNumbers = profile.emergencyContacts.map((contact) => contact.phone).filter(Boolean);
    try {
      await syncAndroidEmergencyConfig(PRIMARY_EMERGENCY_NUMBER, contactNumbers, enabled);
    } catch {
      // Keep local setting even if native sync is unavailable.
    }
  }, [profile.emergencyContacts]);

  const toggleShakeSOSEnabled = useCallback(async () => {
    const nextValue = !shakeSOSEnabled;
    if (!nextValue) {
      await applyShakeSetting(false);
      return;
    }

    const motionApi = window.DeviceMotionEvent as any;
    if (motionApi && typeof motionApi.requestPermission === "function") {
      try {
        const motionStatus = await motionApi.requestPermission();
        if (motionStatus !== "granted") {
          toast.error("Motion permission is required for Shake SOS.");
          return;
        }
      } catch {
        toast.error("Could not request motion permission.");
        return;
      }
    }

    await applyShakeSetting(true);
  }, [applyShakeSetting, shakeSOSEnabled]);

  useEffect(() => {
    void refreshPermissionSnapshot();

    const onFocus = () => {
      void refreshPermissionSnapshot();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshPermissionSnapshot]);

  useEffect(() => {
    const onDiagnostic = (event: Event) => {
      const customEvent = event as CustomEvent<DiagnosticEntry>;
      const detail = customEvent.detail;
      if (!detail || !detail.type) return;

      setDiagnostics((previous) => [detail, ...previous].slice(0, MAX_DIAGNOSTICS));
    };

    window.addEventListener(DIAGNOSTICS_EVENT_NAME, onDiagnostic as EventListener);
    return () => {
      window.removeEventListener(DIAGNOSTICS_EVENT_NAME, onDiagnostic as EventListener);
    };
  }, []);

  const update = (partial: Partial<MedicalProfile>) => setProfile((p) => ({ ...p, ...partial }));

  const handleSave = async () => {
    saveProfile(profile);
    saveSettings({ shakeSOSEnabled });
    const contactNumbers = profile.emergencyContacts.map((contact) => contact.phone).filter(Boolean);
    try {
      await syncAndroidEmergencyConfig(PRIMARY_EMERGENCY_NUMBER, contactNumbers, shakeSOSEnabled);
    } catch {
      // Ignore non-Android bridge errors while still keeping settings saved in local storage.
    }
    toast.success("Settings saved successfully");
  };

  const addAllergy = (a: string) => {
    if (a && !profile.allergies.includes(a)) update({ allergies: [...profile.allergies, a] });
    setNewAllergy("");
  };

  const addCondition = (c: string) => {
    if (c && !profile.conditions.includes(c)) update({ conditions: [...profile.conditions, c] });
    setNewCondition("");
  };

  const updateContact = (i: number, field: string, value: string) => {
    const contacts = [...profile.emergencyContacts];
    contacts[i] = { ...contacts[i], [field]: value };
    update({ emergencyContacts: contacts });
  };

  const updateMed = (i: number, field: string, value: string) => {
    const meds = [...profile.medications];
    meds[i] = { ...meds[i], [field]: value };
    update({ medications: meds });
  };

  const inputClass = "w-full px-4 py-2.5 rounded-2xl bg-white/60 border border-white/50 outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 transition-all text-[#1e1b4b] placeholder-[#9ca3af]";

  const openSettings = async () => {
    if (isAndroidNative) {
      await openAndroidPermissionSettings();
      return;
    }

    toast("Open your browser/site settings to update permissions manually.");
  };

  const clearDiagnostics = () => setDiagnostics([]);

  const formatDiagnosticLine = (entry: DiagnosticEntry) => {
    const extras: string[] = [];
    if (entry.source) extras.push(`source=${entry.source}`);
    if (typeof entry.hits === "number") extras.push(`hits=${entry.hits}`);
    if (typeof entry.count === "number") extras.push(`count=${entry.count}`);
    if (typeof entry.gForce === "number") extras.push(`g=${entry.gForce}`);
    if (entry.error) extras.push(`error=${entry.error}`);
    return extras.length ? `${entry.type} (${extras.join(", ")})` : entry.type;
  };

  return (
    <div className="p-4 pb-28 space-y-4">
      <div className="pt-6 pb-2">
        <p className="text-sm text-[#7c3aed]/70">Settings Menu</p>
        <h1 className="text-[#1e1b4b]">Emergency Profile & SOS</h1>
      </div>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#b91c1c] flex items-center justify-center">
            <Siren size={16} className="text-white" />
          </div>
          <span className="text-[#1e1b4b]">SOS Trigger Settings</span>
        </div>
        <button
          onClick={() => void toggleShakeSOSEnabled()}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/60 border border-white/50"
        >
          <div className="text-left">
            <p className="text-[#1e1b4b]">Shake to trigger SOS</p>
            <p className="text-xs text-[#6b7280]">Default is OFF. Turn on only when you want shake detection.</p>
          </div>
          <div className={`w-12 h-7 rounded-full p-1 transition-colors ${shakeSOSEnabled ? "bg-[#7c3aed]" : "bg-[#cbd5e1]"}`}>
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${shakeSOSEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </div>
        </button>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <span className="text-[#1e1b4b]">Permissions</span>
        </div>

        <div className="space-y-2">
          {[
            { label: "Microphone", value: permissionSnapshot.microphone },
            { label: "Camera", value: permissionSnapshot.camera },
            { label: "Location", value: permissionSnapshot.location },
            { label: "Notifications", value: permissionSnapshot.notifications },
            { label: "Phone Call", value: permissionSnapshot.phoneCall },
            { label: "SMS", value: permissionSnapshot.sms },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/60 border border-white/50">
              <span className="text-[#1e1b4b] text-sm">{item.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full border ${statePillClass(item.value)}`}>
                {stateLabel(item.value)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void refreshPermissionSnapshot()}
            disabled={permissionsLoading}
            className="flex-1 py-2.5 rounded-2xl bg-white/70 border border-white/50 text-[#0f172a] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} className={permissionsLoading ? "animate-spin" : ""} />
            Refresh Status
          </button>
          <button
            onClick={() => void openSettings()}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#0ea5e9] to-[#0369a1] text-white flex items-center justify-center gap-2"
          >
            <Settings2 size={16} />
            Open App Settings
          </button>
        </div>

        <p className="text-xs text-[#6b7280]">
          For best 24x7 SOS reliability, set battery mode to Unrestricted for this app.
        </p>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[#1e1b4b]">SOS Diagnostics</span>
          <button
            onClick={clearDiagnostics}
            className="px-3 py-1.5 text-xs rounded-full bg-white/70 border border-white/50 text-[#4b5563]"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="px-3 py-2 rounded-xl bg-white/60 border border-white/50">
            <p className="text-[#6b7280]">Voice API</p>
            <p className="text-[#1e1b4b]">{voiceApiAvailable ? "Available" : "Not supported"}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/60 border border-white/50">
            <p className="text-[#6b7280]">Motion API</p>
            <p className="text-[#1e1b4b]">{motionApiAvailable ? "Available" : "Not supported"}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/60 border border-white/50">
            <p className="text-[#6b7280]">Shake SOS</p>
            <p className="text-[#1e1b4b]">{shakeSOSEnabled ? "Enabled" : "Disabled"}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/60 border border-white/50">
            <p className="text-[#6b7280]">Captured events</p>
            <p className="text-[#1e1b4b]">{diagnostics.length}</p>
          </div>
        </div>

        <div className="max-h-52 overflow-y-auto rounded-2xl border border-white/50 bg-white/60">
          {diagnostics.length === 0 ? (
            <p className="px-3 py-4 text-sm text-[#6b7280]">
              No diagnostics yet. Speak hotwords or shake to test event capture.
            </p>
          ) : (
            diagnostics.map((entry, index) => (
              <div
                key={`${entry.timestamp}-${entry.type}-${index}`}
                className="px-3 py-2 border-b border-white/40 last:border-b-0"
              >
                <p className="text-xs text-[#6b7280]">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </p>
                <p className="text-sm text-[#1e1b4b]">{formatDiagnosticLine(entry)}</p>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#7c3aed] mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-[#1e1b4b]">Personal Info</span>
        </div>
        <input className={inputClass} placeholder="Full Name" value={profile.fullName} onChange={(e) => update({ fullName: e.target.value })} />
        <div className="flex gap-2">
          <input type="date" className={`flex-1 ${inputClass}`} value={profile.dob} onChange={(e) => { const d = e.target.value; const age = new Date().getFullYear() - new Date(d).getFullYear(); update({ dob: d, age }); }} />
          <input type="number" className={`w-20 ${inputClass}`} placeholder="Age" value={profile.age} onChange={(e) => update({ age: +e.target.value })} />
        </div>
        <select className={inputClass} value={profile.bloodType} onChange={(e) => update({ bloodType: e.target.value })}>
          <option value="">Blood Type</option>
          {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#ec4899] flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <span className="text-[#1e1b4b]">Allergies</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.allergies.map((a) => (
            <span key={a} className="px-3 py-1.5 rounded-full bg-red-50/80 text-red-600 text-sm flex items-center gap-1.5 border border-red-100/50">
              {a} <X size={14} className="cursor-pointer hover:text-red-800" onClick={() => update({ allergies: profile.allergies.filter((x) => x !== a) })} />
            </span>
          ))}
        </div>
        <select className={inputClass} value={newAllergy} onChange={(e) => { addAllergy(e.target.value); }}>
          <option value="">Add common allergy...</option>
          {COMMON_ALLERGIES.filter((a) => !profile.allergies.includes(a)).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex gap-2">
          <input className={`flex-1 ${inputClass}`} placeholder="Custom allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAllergy(newAllergy)} />
          <button className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white" onClick={() => addAllergy(newAllergy)}><Plus size={18} /></button>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#818cf8] to-[#6366f1] flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <span className="text-[#1e1b4b]">Conditions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.conditions.map((c) => (
            <span key={c} className="px-3 py-1.5 rounded-full bg-indigo-50/80 text-indigo-600 text-sm flex items-center gap-1.5 border border-indigo-100/50">
              {c} <X size={14} className="cursor-pointer hover:text-indigo-800" onClick={() => update({ conditions: profile.conditions.filter((x) => x !== c) })} />
            </span>
          ))}
        </div>
        <select className={inputClass} value={newCondition} onChange={(e) => addCondition(e.target.value)}>
          <option value="">Add common condition...</option>
          {COMMON_CONDITIONS.filter((c) => !profile.conditions.includes(c)).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-2">
          <input className={`flex-1 ${inputClass}`} placeholder="Custom condition" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCondition(newCondition)} />
          <button className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#818cf8] to-[#6366f1] text-white" onClick={() => addCondition(newCondition)}><Plus size={18} /></button>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c084fc] to-[#9333ea] flex items-center justify-center">
            <Pill size={16} className="text-white" />
          </div>
          <span className="text-[#1e1b4b]">Current Medications</span>
        </div>
        {profile.medications.map((m, i) => (
          <div key={i} className="flex gap-2">
            <input className={`flex-1 ${inputClass}`} placeholder="Medicine" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
            <input className={`w-24 ${inputClass}`} placeholder="Dose" value={m.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} />
            <button className="text-red-400 hover:text-red-600 transition" onClick={() => update({ medications: profile.medications.filter((_, j) => j !== i) })}><X size={18} /></button>
          </div>
        ))}
        <button className="flex items-center gap-1.5 text-[#7c3aed] hover:text-[#6d28d9] transition" onClick={() => update({ medications: [...profile.medications, { name: "", dose: "" }] })}>
          <Plus size={16} /> Add Medication
        </button>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#34d399] to-[#059669] flex items-center justify-center">
            <Phone size={16} className="text-white" />
          </div>
          <span className="text-[#1e1b4b]">Emergency Contacts</span>
        </div>
        {profile.emergencyContacts.map((c, i) => (
          <div key={i} className="space-y-2 pb-3 border-b border-white/30 last:border-0 last:pb-0">
            <input className={inputClass} placeholder="Name" value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)} />
            <div className="flex gap-2">
              <input className={`flex-1 ${inputClass}`} placeholder="Relationship" value={c.relationship} onChange={(e) => updateContact(i, "relationship", e.target.value)} />
              <input className={`flex-1 ${inputClass}`} placeholder="Phone" value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} />
            </div>
            <button className="text-red-400 hover:text-red-600 transition flex items-center gap-1 text-sm" onClick={() => update({ emergencyContacts: profile.emergencyContacts.filter((_, j) => j !== i) })}><X size={14} /> Remove</button>
          </div>
        ))}
        {profile.emergencyContacts.length < 3 && (
          <button className="flex items-center gap-1.5 text-[#059669] hover:text-[#047857] transition" onClick={() => update({ emergencyContacts: [...profile.emergencyContacts, { name: "", relationship: "", phone: "" }] })}>
            <Plus size={16} /> Add Contact
          </button>
        )}
      </GlassCard>

      <button onClick={handleSave} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] active:scale-[0.98] transition-transform">
        <Save size={20} /> Save Profile
      </button>
    </div>
  );
}
