import React, { useState, useEffect } from "react";
import { loadProfile, saveProfile, MedicalProfile, PRIMARY_EMERGENCY_NUMBER } from "../lib/storage";
import { syncAndroidEmergencyConfig } from "../lib/androidHotword";
import { GlassCard } from "./GlassCard";
import { User, Heart, Pill, Phone, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMMON_ALLERGIES = ["Penicillin", "Sulfa drugs", "Aspirin", "Ibuprofen", "Latex", "Peanuts", "Shellfish"];
const COMMON_CONDITIONS = ["Hypertension", "Type 2 Diabetes", "Type 1 Diabetes", "Asthma", "Heart Disease", "Epilepsy", "Arthritis"];

export function Profile() {
  const [profile, setProfile] = useState<MedicalProfile>(loadProfile());
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");

  useEffect(() => { setProfile(loadProfile()); }, []);

  const update = (partial: Partial<MedicalProfile>) => setProfile((p) => ({ ...p, ...partial }));

  const handleSave = async () => {
    saveProfile(profile);
    const contactNumbers = profile.emergencyContacts.map((contact) => contact.phone).filter(Boolean);
    await syncAndroidEmergencyConfig(PRIMARY_EMERGENCY_NUMBER, contactNumbers);
    toast.success("Profile saved successfully");
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

  return (
    <div className="p-4 pb-28 space-y-4">
      <div className="pt-6 pb-2">
        <p className="text-sm text-[#7c3aed]/70">Settings</p>
        <h1 className="text-[#1e1b4b]">Emergency Profile</h1>
      </div>

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
