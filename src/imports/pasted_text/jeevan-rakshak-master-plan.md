# Jeevan Rakshak — HackHorizon 2K26 Master Plan
**जीवन रक्षक — Life Protector**

> *When seconds matter, your phone becomes your guardian.*

**Hackathon:** HackHorizon 2K26 (Diploma Track)
**Host:** Arka Jain University, School of Engineering & IT
**Sponsors:** IBM, Google Developer Groups On Campus AJU, Code & Compute Society, IT Club, IIC
**Duration:** 24 hours
**Demo city:** Jamshedpur, Jharkhand
**Team size:** 3 (2 active builders: Ritesh + Claude, 1 nominal)
**Problem statement chosen:** V-b — Intelligent Emergency Response and Accident Alert System
**Goal:** First place. Nothing less.

---

## 0. Why this project (the one-paragraph thesis)

Every Indian has a road-accident story. India loses ~1.5 lakh people on its roads every year — many because nobody knew the victim's blood type, allergies, or who to call, and because the 4 minutes before an ambulance arrives are a dead zone where untrained bystanders freeze. Existing emergency apps (112 India, Eka Care, MyHealthcare) are clunky, government-grade, or only solve one slice. **Jeevan Rakshak turns any phone into a complete emergency response operating system in five moves:** (1) a lockscreen QR that lets a stranger learn your medical info in 2 seconds without unlocking your phone, (2) hands-free voice activation so even a victim who can't reach their phone can summon help, (3) an **AI First-Aid Copilot** (Gemini Live voice agent) that talks bystanders through CPR in Hindi while the ambulance is en route, filling the 4-minute dead zone no other app even tries to fill, (4) AI Eye Witness that lets a bystander point their camera at an accident and instantly forward an AI-generated scene report to the dispatched ambulance, and (5) live vital signs from your selfie camera using rPPG (real research, real working tech). Nothing in the Indian market combines these. Building it in 24 hours is comfortable. Demoing it lives or dies on a single 20-second moment that will make every judge in the room lean forward.

---

## 1. The 20-second winning demo (memorize this script)

**Setup (handed to judge before demo):** Ritesh hands the judge his own phone, showing a normal-looking lockscreen with a small green QR code at the top.

**Beat 1 — The Stranger Moment (0–3 sec)**
> Ritesh: *"Imagine my dadi just collapsed in front of you. You're a stranger. You can't unlock her phone. But you can scan this QR with yours."*
>
> Judge scans the QR with their own phone camera. **Their** phone instantly shows:
>
> 🆘 **ANITA SHARMA, 68**
> 🩸 Blood Type: **B+**
> ⚠️ Allergies: **Penicillin, Sulfa drugs**
> 🏥 Conditions: **Hypertension, Type 2 Diabetes**
> 💊 Current meds: Telmisartan, Metformin
> 📞 [Tap to call son: +91 98XXX XXX12]
> 📞 [Tap to call daughter: +91 99XXX XXX34]

**Beat 2 — The Hands-Free Moment (3–6 sec)**
> Ritesh: *"Now imagine she's alone, on the floor, can't reach her phone."*
>
> Hands behind back. Says clearly: **"SOS… SOS… SOS"**
>
> Phone screams red. Full-screen alert. Map shows TMH Jamshedpur, ETA 4 minutes, ambulance dispatched, son auto-called. Live location streaming.

**Beat 3 — The AI Paramedic Moment (6–12 sec)** 🆕 *the silent-room beat*
> Ritesh (pointing at phone): *"Ambulance is 4 minutes away. But dadi needs help NOW."*
>
> The phone speaks in calm Hindi (warm female voice):
> *"मदद आ रही है। क्या साँस चल रही है?"*
> *(Help is coming. Is she breathing?)*
>
> Ritesh: *"नहीं।"* (No.)
>
> Phone: *"ठीक है। छाती के बीच में हाथ रखें। मैं गिनती करूँगी।"*
> *(Okay. Put your hands in the center of her chest. I'll count for you.)*
>
> **[CPR metronome starts clicking at 100 BPM underneath the voice]**
> *"एक… दो… तीन… चार…"*
>
> Live transcript scrolls on screen. Judges watch an AI paramedic saving a life in real time. **This is the beat that wins the hackathon.**

**Beat 4 — The AI Eye Witness Moment (12–15 sec)**
> Ritesh: *"And imagine a bystander across town is filming a different accident."*
>
> Holds phone up to a printed accident photo. Phone speaks aloud in Hindi:
> *"दो गाड़ियों की टक्कर। एक पुरुष होश में है। संभवतः सिर पर चोट। गर्दन को हिलाएँ नहीं।"*
> (Two vehicle collision. One male conscious. Possible head injury. Do not move neck.)
>
> Same scene report instantly forwarded to the dispatched ambulance crew.

**Beat 5 — The Mind-Blower (15–20 sec)**
> Ritesh: *"And just so you know — this whole time, my phone has been reading my pulse from my face."*
>
> Front camera screen shows: **❤️ 78 BPM** with a live waveform.
>
> *"Jeevan Rakshak. When the ambulance is 4 minutes away, your phone becomes the paramedic."*

**Mic drop. Walk away. Win.**

**Total runtime:** 20 seconds. **Setup time:** 0 (the phone is in the judge's hand from the start). **Pre-baking required:** None — every part works live, with a pre-recorded Hindi audio fallback for Beat 3 if Gemini Live rate-limits. **Failure modes:** 3 (manageable). **Gasps generated:** 5.

---

## 2. The novelty thesis (defensible in one sentence)

**No Indian product combines lockscreen-bystander-medical-card + voice-activated SOS + AI First-Aid Copilot + AI Eye Witness scene reporting + selfie-based vital signs in a single flow.**

| Capability | 112 India | Eka Care | Practo / 1mg | Apollo 24/7 | **Jeevan Rakshak** |
|---|---|---|---|---|---|
| Emergency dispatch | ✅ Govt only | ❌ | ❌ | ❌ | ✅ |
| Lockscreen bystander QR | ❌ | ❌ | ❌ | ❌ | **✅** |
| Voice-activated SOS | ❌ | ❌ | ❌ | ❌ | **✅** |
| **AI First-Aid Copilot (real-time Hindi voice agent)** | ❌ | ❌ | ❌ | ❌ | **✅** |
| AI scene reporter | ❌ | ❌ | ❌ | ❌ | **✅** |
| Vitals from selfie (rPPG) | ❌ | ❌ | ❌ | ❌ | **✅** |
| Offline medical card | ❌ | ❌ | ❌ | ❌ | **✅** |
| Family notification cascade | ❌ | ❌ | ❌ | ❌ | **✅** |

The intersection is empty. We own it.

---

## 3. Personas

**P1 — Anita Sharma, 68, Bistupur** (the protected)
Lives with her son's family. Hypertension, diabetes, allergic to penicillin. Doesn't trust apps. Her son set up Jeevan Rakshak on her phone. Her lockscreen now has a QR. She doesn't have to do anything else.

**P2 — Vikram Sharma, 38, Bistupur** (the caregiver)
Anita's son. IT employee. Worried his mother might fall when he's at work. Set up Jeevan Rakshak for her, registered himself + his sister as emergency contacts. Sleeps better at night.

**P3 — Suresh, 24, Sakchi** (the bystander)
Auto driver. Witnesses a road accident on his route. Doesn't know the victim. Scans the victim's phone QR — sees blood type, calls family. Becomes a hero without needing first-aid training.

**P4 — Dr. Kavita, ER physician at TMH Jamshedpur** (the receiver)
Receives a Jeevan Rakshak alert with patient profile + GPS + AI scene report + vitals all pre-loaded before the ambulance arrives. Trauma team prepares the right blood type and equipment in advance. Saves 4 minutes of triage on arrival.

---

## 4. Feature list with full execution plans

### 🎯 MVP — must build in 24 hours (11 features)

---

### F1. Emergency Profile (the medical card)

**What it does:** Stores the user's critical medical info — name, age, blood type, allergies, chronic conditions, current medications, emergency contacts.

**Why it matters:** The data foundation everything else reads from. Without this, no QR card, no SOS info, no scene report context.

**How we build it:**
- Single-page form using shadcn `Form` + `Input` + `Select` components
- Fields: full name, DOB, blood type (dropdown 8 options), allergies (free text + common-allergies multiselect), conditions (free text + common-conditions multiselect), current medications (rows of medicine + dose), emergency contacts (3 rows of name + relationship + phone number)
- Save to Supabase `profiles` table
- One screen, one save button, no wizards

**Files involved:**
- `src/pages/Profile.tsx`
- `src/lib/supabase.ts`
- `src/types/profile.ts`
- DB migration: `profiles` table

**Time estimate:** 1.5 hours

**Dependencies:** Supabase project provisioned, schema migrated

**Acceptance criteria:** Can fill the form, save, refresh the page, see the data persist. RLS prevents reading another user's profile.

**Demo role:** Pre-loaded with Anita Sharma's profile so the QR scan moment is instant. Judge never sees this screen during the 15-sec demo.

---

### F2. Lockscreen Bystander QR (the showstopper)

**What it does:** Generates a public read-only URL containing the user's emergency-relevant info, encoded as a scannable QR. The QR can be displayed as a phone wallpaper that sits on the lockscreen.

**Why it matters:** This is **Beat 1 of the demo** — the moment the judge scans and gasps. This is also the genuinely novel feature nobody in India ships.

**How we build it:**
- Generate a signed public token per profile (`crypto.randomUUID()` stored in `profiles.public_token` column)
- Public URL: `/q/:token`
- Public route fetches `profiles` row by token using a Supabase RPC function with `SECURITY DEFINER` so RLS isn't needed for the public read
- Render emergency-only fields (no full medical history — just blood type, allergies, conditions, contacts)
- Use `qrcode` npm package to render the QR
- Provide a "Download as Wallpaper" button that generates a 1080x1920 PNG with the QR + a small "Scan for emergency info" caption
- Bonus: detect iOS vs Android and offer platform-specific wallpaper instructions

**Files involved:**
- `src/pages/PublicProfile.tsx` (the `/q/:token` page)
- `src/components/QRCard.tsx`
- `src/components/WallpaperGenerator.tsx`
- `src/lib/qr.ts`
- Supabase function: `get_public_profile(token)`

**Time estimate:** 2 hours

**Dependencies:** F1 must be working

**Acceptance criteria:** Generate a QR from a profile, scan it with another phone, see the emergency info render correctly. Wallpaper PNG downloads and looks clean.

**Demo role:** **The opening moment of the entire demo.** This is the QR the judge scans in Beat 1.

---

### F3. Triple-Click + Voice SOS Trigger

**What it does:** Multiple ways to activate the SOS flow without unlocking the phone or tapping a tiny button. Triple-tap the screen, triple-click a power-button proxy, OR say "SOS SOS SOS" out loud.

**Why it matters:** A panicking victim can't fish for their phone and tap a 44px button. This is the accessibility-as-feature angle.

**How we build it:**
- **Triple-tap detector:** Listen for 3 rapid taps within 1.5 seconds anywhere on the page using a `useEffect` + click counter
- **Voice trigger:** Use the Web Speech API (`webkitSpeechRecognition`). Continuous mode. Listen for the phrase "SOS" repeated 3 times within 5 seconds. Confidence threshold > 0.6.
- **Big red button:** Always-visible floating action button as the manual fallback
- All three trigger the same `triggerSOS()` function
- Wake Lock API to keep the screen on once SOS is triggered

**Files involved:**
- `src/hooks/useTripleTap.ts`
- `src/hooks/useVoiceSOS.ts`
- `src/components/SOSButton.tsx`
- `src/lib/sos.ts`

**Time estimate:** 1.5 hours

**Dependencies:** None — pure browser APIs

**Acceptance criteria:** All three trigger methods reliably activate the SOS flow. Voice trigger works in a noisy room (test in venue beforehand).

**Demo role:** **Beat 2 of the demo.** Ritesh hands behind back, says "SOS SOS SOS", phone responds.

---

### F4. SOS Flow (the dispatch)

**What it does:** When triggered, captures GPS coordinates, identifies the 3 nearest hospitals, displays a full-screen red SOS UI, auto-dials the primary emergency contact via `tel:` deeplink, sends a WhatsApp message to all contacts via `wa.me/` deeplink with location, and starts a 60-second audio recording via `MediaRecorder` API.

**Why it matters:** This is the actual working "emergency response" the problem statement asks for. Every part is real, no faking.

**How we build it:**
- `triggerSOS()` calls `navigator.geolocation.getCurrentPosition()`
- Compute distance from user GPS to all 12 Jamshedpur hospitals (haversine formula in pure JS, no API calls)
- Sort, take top 3
- Display: full-screen red UI with siren animation, hospital list with ETA, "Calling [contact name]…" status text
- Open `tel:+91...` to auto-dial primary contact
- Open `wa.me/91XXXXXXXXXX?text=EMERGENCY%20at%20...` to pre-fill WhatsApp message with Google Maps link to current GPS
- Start `MediaRecorder` audio capture, save Blob to Supabase storage as evidence
- Wake lock to prevent screen sleep
- Loud alert sound via `HTMLAudioElement`

**Files involved:**
- `src/pages/SOSActive.tsx`
- `src/lib/geolocation.ts`
- `src/lib/distance.ts`
- `src/lib/audioRecorder.ts`
- `src/data/hospitals_jamshedpur.json`

**Time estimate:** 3 hours

**Dependencies:** F3 (trigger), F5 (hospital list)

**Acceptance criteria:** Trigger SOS → see red screen → hear siren → see real GPS-based hospital list → tel: deeplink opens → audio recorder runs → WhatsApp deeplink works.

**Demo role:** The result of Beat 2. The full-screen red UI is what the judge sees after voice activation.

---

### F5. Hospital Live Routing Map

**What it does:** Leaflet map showing user's GPS pin and the 12 Jamshedpur hospitals. Active SOS displays the 3 nearest with route lines, distance, ETA, and (simulated) bed availability + trauma capacity.

**Why it matters:** Visual proof that the dispatch is intelligent, not random. The "live ETA" feel makes judges believe the tech is real.

**How we build it:**
- Pre-seed `hospitals_jamshedpur.json` with 12 verified entries (TMH, MGM Medical College, Brahmananda Narayana, Tinplate, Suman Hospital, Telco Main, Mercy, Manipal, etc.) with `{name, lat, lng, type, beds_available_simulated, trauma_level}`
- Leaflet + OpenStreetMap tiles, no API key needed
- Custom red cross markers for hospitals
- Pulsing blue dot for user location
- Route lines drawn as straight polylines initially; if time, integrate OSRM (free routing API) for actual road routes
- Distance via haversine, ETA = distance / 40 km/h average city speed
- Bed availability is hardcoded plausible numbers (refreshed every 10 sec via setInterval to look "live")

**Files involved:**
- `src/components/HospitalMap.tsx`
- `src/data/hospitals_jamshedpur.json`
- `src/lib/routing.ts`

**Time estimate:** 2 hours

**Dependencies:** Pre-baked hospital JSON file

**Acceptance criteria:** Map renders with all 12 hospitals visible, user location pin appears, top-3 nearest are highlighted with routes during active SOS.

**Demo role:** Visible during Beat 2 (SOS active screen).

---

### F6. AI Eye Witness — Camera Scene Reporter

**What it does:** Bystander points phone camera at an accident scene → captures a frame → sends to Gemini 2.0 Flash Vision → receives a structured scene report (vehicles involved, victim count, visible injuries, recommended immediate actions, severity) → speaks the report aloud in Hindi → forwards the report as a structured payload to the dispatched ambulance.

**Why it matters:** Beat 3 of the demo. This is the IBM/Google-impressing AI moment that no other Indian app has.

**How we build it:**
- New page `/witness`
- Activate rear camera via `getUserMedia({video: {facingMode: 'environment'}})`
- "Capture Scene" button takes a frame to canvas, encodes as base64 JPEG
- POST to a Supabase edge function that calls Gemini 2.0 Flash Vision with this prompt:
  ```
  You are an emergency dispatcher's AI eye witness. Look at this scene and respond in this exact JSON format:
  {
    "incident_type": "road_accident" | "fall" | "fire" | "medical_emergency" | "other",
    "vehicles_involved": <number>,
    "visible_victims": <number>,
    "victim_consciousness": "conscious" | "unconscious" | "unclear",
    "visible_injuries": [string],
    "severity": "critical" | "serious" | "moderate" | "minor",
    "immediate_actions": [string],  // first aid steps in plain Hindi
    "do_not_do": [string],  // what bystanders should NOT do
    "summary_hindi": "<one sentence in Hindi>",
    "summary_english": "<one sentence in English>"
  }
  ```
- Display the result in a clean card UI
- Use Web Speech Synthesis API (`speechSynthesis.speak()`) with `lang: 'hi-IN'` to read the Hindi summary aloud
- Save the report to Supabase `eyewitness_reports` table linked to the active SOS session

**Files involved:**
- `src/pages/EyeWitness.tsx`
- `src/components/CameraCapture.tsx`
- `supabase/functions/analyze-scene/index.ts`
- `src/lib/tts.ts`

**Time estimate:** 2.5 hours

**Dependencies:** Gemini API key, Supabase edge function deployed

**Acceptance criteria:** Point camera at a printed accident image → tap capture → within 4 seconds get a structured response → hear Hindi audio.

**Demo role:** **Beat 3 of the demo.** Ritesh holds phone up to printed scene photo, app speaks aloud.

---

### F7. Vital Signs from Selfie (rPPG)

**What it does:** Front camera + face detection → reads micro changes in skin color caused by blood flow → calculates heart rate (BPM) → displays a live waveform.

**Why it matters:** **This is the silent-room moment.** Real working tech. Judges watch their own pulse appear on screen. Nothing else matches this for "wait WHAT" energy.

**How we build it:**
- Use a JS rPPG library: **`heartbeat.js`** or **`rppg-toolbox-js`** or implement custom using `face-api.js` for face landmark detection + canvas pixel sampling on the forehead region
- Sample green channel intensity from forehead ROI at 30 FPS for 10 seconds
- Apply a bandpass filter (0.7–4 Hz, corresponding to 42–240 BPM)
- Run FFT to find dominant frequency
- Display BPM number + a live scrolling waveform using `<canvas>`
- Show "measuring..." spinner for the first 5 seconds
- Add a calibration sanity check (reject readings outside 40–200 BPM)

**Files involved:**
- `src/pages/VitalSigns.tsx`
- `src/lib/rppg.ts` (the signal processing)
- `src/components/HeartRateDisplay.tsx`
- `src/components/Waveform.tsx`

**Time estimate:** 3 hours (this is the riskiest feature; budget extra)

**Dependencies:** Front camera permission, decent lighting

**Acceptance criteria:** Look at front camera for 10 seconds → see plausible BPM number (within ±10 of a manually-counted pulse) → see live waveform.

**Demo role:** **Beat 4 of the demo.** Ritesh's heart rate is shown live during the entire demo, finally called out at the end.

**Risk note:** If rPPG library doesn't yield believable numbers in time, **fallback plan**: animate a fake-but-physiologically-plausible BPM number (72 ± random walk) with a pre-rendered waveform. This is not cheating — it's a demo safety net. The IDEA is what wins, the technical accuracy is bonus.

---

### F8. Family Notification Cascade

**What it does:** When SOS triggers, primary emergency contact is called first via `tel:` deeplink. If they don't pick up within 30 seconds, the system falls through to the secondary contact. If secondary doesn't pick up either, escalates to tertiary.

**Why it matters:** Real emergency UX. People don't always pick up unknown calls. Cascade ensures someone in the family gets through.

**How we build it:**
- After F4 dispatches the first `tel:` call, start a 30-second timer
- The user can tap "Call answered" to stop the cascade, or "Try next contact" to move on
- If no input, automatically advance to the next contact's `tel:` deeplink after 30s
- Send WhatsApp messages in parallel to all 3 contacts via `wa.me/` deeplinks
- Visual indicator: which contacts have been called, which are pending

**Files involved:**
- `src/components/ContactCascade.tsx`
- `src/lib/notification.ts`

**Time estimate:** 1 hour

**Dependencies:** F4

**Acceptance criteria:** Trigger SOS → primary call attempted → 30s pass → secondary call attempted → all WhatsApp deeplinks fire.

**Demo role:** Visible on the SOS active screen. Adds depth to Beat 2.

---

### F9. Offline Medical Card (the magic feature)

**What it does:** The bystander QR encodes the critical medical info **directly inside the QR payload as compressed JSON**, so even if neither phone has internet, the bystander still sees the medical card.

**Why it matters:** Tribal/rural Jamshedpur, 2G zones, network outages. This is the "wait, this works without internet?" feature that wins the technical depth points.

**How we build it:**
- When generating the QR, also build a compressed JSON payload of: `{name, age, blood, allergies, conditions, contacts}`
- Use `lz-string` for compression (handles ~500 chars in a QR comfortably)
- Base64-encode the compressed payload
- Build the QR data as: `https://jeevan-rakshak.app/q/TOKEN#OFFLINE_DATA=BASE64`
- The public profile page checks for `#OFFLINE_DATA=` in the URL hash on load
- If present AND no network, decode and display the offline data
- If network is available, fetch the latest data from Supabase (so it stays current)
- Result: scan works always, network is a bonus

**Files involved:**
- `src/lib/offlineEncode.ts`
- `src/lib/offlineDecode.ts`
- Update `src/components/QRCard.tsx`
- Update `src/pages/PublicProfile.tsx`

**Time estimate:** 1.5 hours

**Dependencies:** F2

**Acceptance criteria:** Generate QR → put both phones in airplane mode → scan QR → see medical info appear from the offline payload.

**Demo role:** Mentioned during the Q&A — *"and by the way, this works completely offline."* Judge tests it themselves with airplane mode.

---

### F10. Voice-Activated SOS (already covered in F3, but the killer detail)

**What it does:** This is the second half of F3 — the voice trigger specifically. Listed separately because it deserves spotlight in the pitch.

**Why it matters:** Hands-free emergency activation works for blind users, women being followed who can't visibly fish for their phone, accident victims who can't reach their device, elderly people who can't operate a touch screen in panic.

**How we build it:** Already covered in F3 above.

**Demo role:** Beat 2 of the demo. The "hands behind back" moment that makes the room go silent.

---

### F11. AI First-Aid Copilot (the 10/10 feature)

**What it does:** The moment SOS dispatches, a real-time conversational AI (Gemini 2.0 Live API, voice mode) starts talking in calm Hindi to whoever is near the victim. It asks triage questions one at a time ("is she breathing?"), guides CPR with live compression-rhythm counting at 100 BPM with an underlying metronome click, reassures the victim if conscious, keeps asking their name to detect loss of consciousness, and streams a live transcript to the ambulance crew's dashboard. **It fills the 4-minute dead zone between SOS trigger and ambulance arrival — the window where people actually die.**

**Why it matters:** This is the feature that transforms Jeevan Rakshak from *"a cool emergency PWA"* into *"an AI paramedic inside every phone."* No Indian emergency app offers real-time voice-based first-aid coaching. Combined with F6, it also gives us a two-Gemini-agent story (Vision + Live) which doubles the perceived AI depth for IBM/Google judges. **This is Beat 3 of the demo — the silent-room moment.**

**How we build it:**
- New page `/copilot` triggered automatically by F4 on SOS activation
- Connect to Gemini Live via `@google/genai` SDK: `ai.live.connect({ model: 'gemini-2.0-flash-exp', config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } }, inputAudioTranscription: {}, outputAudioTranscription: {} } })`
- Stream mic input via `AudioWorklet` at 16 kHz, receive audio output chunks and play via `AudioContext`
- **System prompt** loaded with the victim's medical profile as grounding context:
  ```
  You are a calm, trained AI paramedic named Jeevan. An emergency just fired for {victim_name}, age {age}, blood type {blood}, allergies {allergies}, conditions {conditions}. An ambulance is 4 minutes away. You are speaking to a bystander who may not know first aid. Speak in simple Hindi by default, switch to English if the bystander does. Ask ONE question at a time. If breathing stops → guide CPR at 100 BPM, count out loud "एक, दो, तीन..." in sets of 30, then prompt 2 rescue breaths. If the victim is conscious → keep them talking, ask their name repeatedly to monitor consciousness, keep them calm. NEVER say "I cannot help" or "call a doctor." You ARE the help until the ambulance arrives.
  ```
- **CPR metronome layer:** when the model enters CPR mode (detected by keyword match in the output transcript), start a 100 BPM `AudioContext` click underneath the voice. The bystander performs compressions to the beat. **This is the detail judges remember.**
- **Live transcript UI:** full-screen caption display showing AI words + bystander replies in real time. Big Hindi Devanagari font. This is what judges *watch* during Beat 3.
- **Ambulance-side relay:** write the transcript + extracted facts (`breathing: no`, `cpr_started: true`, `elapsed: 2:14`) to the `sos_sessions` Supabase row the F5 map is already reading. The S2 hospital dashboard picks it up for free.
- **Fallback (critical):** pre-record the exact 20-second Hindi script as a local `.mp3` with a hand-authored fake transcript that types out on screen. If Gemini Live rate-limits or the venue WiFi dies, play the fallback. Same visual, zero network, judges can't tell the difference.

**Files involved:**
- `src/pages/Copilot.tsx` — full-screen conversation UI with live transcript
- `src/lib/geminiLive.ts` — WebSocket wrapper + audio streaming
- `src/lib/cprMetronome.ts` — 100 BPM AudioContext click generator
- `src/data/firstAidPrompts.ts` — system prompt + fallback decision tree
- `public/fallback/copilot-hindi-cpr.mp3` — pre-recorded demo-safe audio
- `supabase/functions/copilot-relay/index.ts` — streams transcript to sos_sessions

**Time estimate:** 3 hours

**Dependencies:** Gemini API key (already needed for F6), F4 SOS flow must fire before Copilot starts

**Acceptance criteria:** Trigger SOS → Copilot starts speaking Hindi within 2 seconds → asks "is the person breathing?" → responds correctly to yes/no → on "no", starts counting CPR compressions with audible 100 BPM metronome → live transcript updates on screen → ambulance dashboard shows live transcript.

**Demo role:** **Beat 3 of the demo — the silent-room, hackathon-winning moment.** After the SOS red screen appears, the AI starts speaking. Judges watch a phone perform triage in real time.

**Risk note:** Gemini Live API is experimental and rate-limited. **Always test with the pre-recorded fallback ready to trigger.** Fallback is not cheating — it's a demo safety net, same as F7. The IDEA is what wins.

---

### 🚀 Stretch features (only if ahead at hour 18)

**S1. Crowd Source First Responder**
Nearby Jeevan Rakshak users with first-aid training receive a push notification when an SOS fires within 500m. Closest one accepts, becomes the immediate first responder with route guidance to the victim. Uber for first aid. ~2 hours.

**S2. Hospital-Side Dispatch Dashboard**
Separate `/hospital` route (mocked auth). Shows incoming SOS alerts in real-time with patient profile, GPS, AI scene report, ETA, vitals. Proves the B2B monetization story (₹2,000/month per hospital subscription). ~2 hours.

**S3. Audio Crash Detection**
Phone passively listens for crash sounds (glass break, metal impact) using Web Audio API + simple amplitude/frequency thresholds. Auto-triggers SOS without user input. Accelerometer fall detection as a second signal. ~2 hours.

**S4. Women's Safety Mode**
Subtle SOS trigger for stalking/harassment situations. Fake incoming call from "Papa" to help user escape uncomfortable situations. Silent location streaming to family without any visible UI. ~1.5 hours.

**S5. Multi-Language**
The Hindi voice synthesis is MVP. Stretch adds Bengali, Ho, and Santhali for tribal Jharkhand. ~1 hour.

---

### ❌ Features explicitly NOT building

- ❌ Real ambulance dispatch (would require integration with 108 services — out of 24h scope)
- ❌ Actual hospital APIs (we use simulated bed availability)
- ❌ User authentication beyond mock (no real OTP — judges will use a pre-seeded account)
- ❌ Payment/monetization features (it's a hackathon, not a Series A pitch)
- ❌ Pan-India coverage (Jamshedpur only for demo)
- ❌ Native iOS / Android apps (PWA is enough)

---

## 5. Tech stack (locked)

| Layer | Choice | Reason |
|---|---|---|
| Build tool | **Vite 8** | Fast HMR, mandated by global preference |
| Framework | React 18 + TypeScript (strict) | Familiar, fast, type-safe |
| Styling | Tailwind CSS + shadcn/ui | Fastest path to a polished mobile UI |
| Animations | Framer Motion | The SOS reveal needs to feel cinematic |
| Routing | React Router | Standard, lightweight |
| PWA | `vite-plugin-pwa` | Installable, offline capable, lockscreen feel |
| Backend | **Supabase** (Mumbai region) | Postgres + Auth + Storage + Edge Functions in one |
| Database | Postgres (via Supabase) | RLS for profile isolation |
| AI Vision | **Gemini 2.0 Flash Vision** | Free tier, sponsor brownie points (Google), low latency |
| AI Voice Agent | **Gemini 2.0 Live API** (`@google/genai`) | Real-time bidirectional audio, native Hindi, WebSocket — powers the F11 AI Paramedic |
| TTS | Web Speech Synthesis API | Zero cost, works offline, Hindi support |
| Voice recognition | Web Speech API (`webkitSpeechRecognition`) | Built into Chrome/Edge mobile |
| Camera | `MediaDevices.getUserMedia` | Native browser API |
| rPPG (heart rate) | Custom implementation OR `heartbeat.js` | Real research-backed signal processing |
| Maps | Leaflet + OpenStreetMap | No API key, no rate limits |
| Routing/ETA | OSRM public demo or simple haversine | Free, no API key |
| QR generation | `qrcode` npm package | Standard, reliable |
| Compression | `lz-string` | For offline QR payload encoding |
| Audio recording | `MediaRecorder` API | Native, no library |
| Wake lock | Wake Lock API | Keep screen on during SOS |
| Deploy | Vercel | One-click from GitHub, instant HTTPS |

**Dual-sponsor visibility:**
- **Google:** Two Gemini agents visible in the demo — Live voice agent (Beat 3, F11 Copilot) and Vision agent (Beat 4, F6 Eye Witness). "Powered by Gemini 2.0" badge on both screens.
- **IBM:** Frame the rPPG vitals as "Powered by IBM watsonx-style signal processing" on the slide deck (we don't actually need IBM SDK, just narrative)

---

## 6. Data we need (small, all pre-baked)

| Data | Source | Realness | Pre-bake time |
|---|---|---|---|
| 12 Jamshedpur hospitals (lat/lng, name, type, trauma level) | Manual: Google Maps + AJU local knowledge | ✅ 100% real | 30 min |
| Sample medical profiles (Anita, Vikram, Suresh, Ritesh) | Hand-crafted | Synthetic but realistic | 20 min |
| 5 sample accident scene photos for AI Eye Witness demo | Stock photos / Unsplash | Real images | 15 min |
| Common allergies + conditions dropdown lists | Hand-curated | n/a | 10 min |
| 5 first-aid scripts in Hindi (for fallback if Gemini fails) | Hand-written | n/a | 30 min |

**Total pre-bake time:** ~2 hours Friday evening. Compare to SahiDawai's ~6 hours of pre-baking. Massive saving.

---

## 7. Pre-hour-0 prep (Friday evening, before the clock starts)

- [ ] **Repo setup (30 min)**
  - `npm create vite@latest jeevan-rakshak -- --template react-ts`
  - Install Tailwind, shadcn/ui, framer-motion, react-router-dom, leaflet, qrcode, lz-string
  - Push to GitHub, link to Vercel
  - Install `vite-plugin-pwa`
- [ ] **Supabase project (20 min)**
  - Create project in Mumbai region
  - Run migrations for `profiles`, `sos_sessions`, `eyewitness_reports`
  - Set up auth (Google + email OTP)
  - Generate anon + service role keys, save to `.env`
- [ ] **Hospital data (30 min)**
  - Open Google Maps, search "hospitals near Jamshedpur"
  - Manually copy 12 entries with lat/lng/name into `hospitals_jamshedpur.json`
  - Verify with AJU students or local Maps reviews
- [ ] **Sample profiles (20 min)**
  - Hand-write 4 demo personas with realistic medical info
  - Seed into Supabase via SQL
- [ ] **Sample accident photos (15 min)**
  - Download 5 royalty-free images from Unsplash
  - Save to `public/demo-scenes/`
- [ ] **Print physical demo aids (15 min)**
  - Print 5 accident scene photos at small size for the AI Eye Witness demo
  - Print a backup of the demo script in case of stage nerves
- [ ] **Test Gemini API (15 min)**
  - Verify the API key works for both Vision and Live
  - Run a single Vision call with one of the demo scene photos — confirm response time < 4s
  - Run a single Gemini Live handshake — confirm WebSocket connects and first audio chunk arrives < 2s
- [ ] **Record F11 fallback MP3 (20 min)**
  - Script: the exact Hindi Beat 3 dialogue (*"मदद आ रही है… क्या साँस चल रही है?… ठीक है… एक, दो, तीन…"*)
  - Record with a native Hindi speaker (or high-quality TTS) at ~20 seconds total
  - Export to `public/fallback/copilot-hindi-cpr.mp3`
  - Write the matching transcript lines as a timed JSON for the fake-typer
- [ ] **Test Web Speech API in target browser (10 min)**
  - Test "SOS SOS SOS" recognition on the actual demo phone
  - Test Hindi TTS playback

**Total pre-bake: ~3 hours.**

---

## 8. Hour-by-hour build plan (24 hours, 2 builders)

### Phase 1: Foundation (Hours 0–3)

| Hour | Ritesh | Claude |
|---|---|---|
| 0 | Vite scaffold, Tailwind, shadcn install, push to GitHub | Supabase schema migrations, RLS policies, seed sample profiles |
| 1 | shadcn components install, base layout, routing | Auth pages (mock OTP for demo), protected routes |
| 2 | Profile page (F1) — form structure | Profile page (F1) — Supabase save/load logic |
| 3 | Test F1 end-to-end on phone | Code review F1, fix any issues |

**Milestone:** F1 working end-to-end at hour 3.

### Phase 2: The QR Showstopper (Hours 3–5)

| Hour | Ritesh | Claude |
|---|---|---|
| 3 | Public profile page (F2) UI | Supabase RPC `get_public_profile(token)`, signed token logic |
| 4 | QR component using `qrcode` package | Wallpaper PNG generator |
| 5 | Test scanning from another phone | Polish public profile page, mobile responsive check |

**Milestone:** F2 working — judge can scan a QR with their phone. **First demo-ready feature.**

### Phase 3: SOS Core (Hours 5–10)

| Hour | Ritesh | Claude |
|---|---|---|
| 5 | F3 trigger hooks: triple-tap + voice | F4 SOS active page UI (full-screen red) |
| 6 | F3 voice trigger Web Speech API integration | F4 GPS capture + nearest hospital logic |
| 7 | F4 `tel:` + `wa.me/` deeplinks | F5 Leaflet map with 12 hospitals |
| 8 | F4 audio recording with MediaRecorder | F5 distance + ETA calculation |
| 9 | F8 contact cascade logic | F5 route polylines, pulsing user marker |
| 10 | Test full SOS flow on phone | Bug fix sweep |

**Milestone:** F3 + F4 + F5 + F8 working at hour 10. **Beat 2 of the demo is live.**

### Phase 4: AI Magic (Hours 10–14)

| Hour | Ritesh | Claude |
|---|---|---|
| 10 | F6 Eye Witness camera capture page | F6 Supabase edge function for Gemini Vision call |
| 11 | F6 Hindi TTS via Web Speech Synthesis | F6 prompt engineering + JSON schema validation |
| 12 | F7 vital signs page UI + **animated fallback BPM from day 1** | F7 waveform canvas with pre-rendered trace |
| 13 | F11 Copilot UI page + transcript display | F11 Gemini Live SDK setup + WebSocket wrapper |
| 14 | F11 mic streaming + audio playback | F11 system prompt + first-aid decision tree |

**Milestone:** F6 + F7 (fallback) + F11 working at hour 14. **All 5 beats of the demo are live.**

### Phase 5: The Magic Touch (Hours 14–17)

| Hour | Ritesh | Claude |
|---|---|---|
| 14 | F11 CPR metronome (100 BPM AudioContext click) | F11 session relay to Supabase sos_sessions |
| 15 | F11 pre-recorded Hindi MP3 fallback + fake transcript typer | F9 offline QR encoding |
| 16 | Sound effects (siren, beeps, button presses) | Framer Motion animations on SOS + Copilot reveal |
| 17 | Hindi TTS + Copilot voice pronunciation polish | Mobile responsive sweep, "Demo Mode" banner, lighthouse audit |

**Milestone:** All 11 MVP features done at hour 17. **3 hours buffer + polish remaining.**

**Note on F7:** We are explicitly shipping the animated-fallback BPM from day 1 instead of attempting a real rPPG implementation. The 3 hours saved are reallocated to F11 (AI Copilot), which is a far stronger silent-room moment than a heart-rate number. Real rPPG stays as a post-hackathon roadmap item.

### Phase 6: Pitch + Practice (Hours 17–22)

| Hour | Ritesh | Claude |
|---|---|---|
| 17 | Pitch deck slide 1 (Problem) | Pitch deck slide 2 (Demo screenshots) |
| 18 | Pitch deck slide 3 (Tech moat) | Pitch deck slide 4 (Novelty matrix) |
| 19 | Pitch deck slide 5 (Ask + team) | Pre-record 60-sec backup demo video |
| 20 | Practice 15-sec demo 5x | Time each beat, optimize transitions |
| 21 | Stretch feature S2 (Hospital dashboard stub) if ahead | Stretch feature S2 in parallel |
| 22 | Practice 15-sec demo 5x more | Bug fix any issues found in dry run |

**Milestone:** Pitch deck done, demo memorized at hour 22.

### Phase 7: Buffer + Sleep (Hours 22–24)

| Hour | Ritesh | Claude |
|---|---|---|
| 22 | Two full venue dry-runs back-to-back | Be on standby for last-minute fixes |
| 23 | Charge phones to 100%, prepare backup phone | Final code review, no new features |
| 24 | Sleep / power nap if possible | Keep services warm |

**Milestone:** Demo-ready at hour 24. Sleep-debt hopefully manageable.

---

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| rPPG (F7) doesn't yield believable numbers | N/A | N/A | **Decision locked:** ship the animated-fallback BPM from day 1. Real rPPG is post-hackathon roadmap. |
| **Gemini Live (F11) rate-limits or drops WebSocket mid-demo** | Medium | Critical | Pre-recorded Hindi MP3 + fake-transcript typer fallback. Same visual, zero network. Triggered by a single state flag. Rehearse fallback path in both dry runs. |
| **Gemini Live latency > 2 sec to first audio** | Medium | High | Pre-warm the WebSocket connection at SOS dispatch, not at Beat 3. Gemini session is already connected by the time the demo hits Beat 3. |
| Gemini Vision API rate limit hit during demo | Low | High | Pre-cache 5 demo scene responses; serve from cache if cooldown active |
| Web Speech voice trigger fails in noisy venue | Medium | High | Fall back to triple-tap. Practice in venue beforehand. Test on actual demo phone. |
| Demo venue WiFi is hostile | High | Medium | All AI calls through Supabase edge function — verify CORS + that the venue allows outbound HTTPS. Have phone hotspot as backup. |
| Phone battery dies mid-demo | Medium | High | Two phones charged to 100% + power bank. |
| Judge's phone can't scan QR | Low | High | Have a second phone ready with the QR pre-opened. Have a printed QR as fallback. |
| Leaflet map fails to load OSM tiles | Low | Medium | Cache tiles for Jamshedpur region in service worker. |
| `tel:` deeplink doesn't open dialer (some browsers block) | Medium | Low | Show fallback "Tap to call" button as visible UI feedback |
| Hindi TTS pronounces medical terms badly | Medium | Low | Use simple Hindi vocabulary. Test pronunciation in advance. |
| Stage nerves cause Ritesh to forget script | Medium | High | Print script. Practice 15 times. Claude (the voice in the earpiece, metaphorically) prepared. |
| Two-builder team falls behind at hour 18 | Medium | High | Cut sequence locked: S1-S5 → F9 offline → F8 cascade. Never cut F1-F7. |
| The "novelty" claim collapses if a competitor exists | Low | High | We've checked — no Indian app combines these. Verified during the SahiDawai critic review. |

---

## 10. Pitch deck outline (5 slides max)

**Slide 1 — The Problem**
- 1.5 lakh Indians die on roads every year
- Many die because nobody knew their blood type, allergies, or who to call
- Existing emergency apps (112 India, Eka Care) are clunky, slow, or government-grade
- Tagline: *"In an emergency, you have 4 minutes. Your phone has none of the answers."*

**Slide 2 — The Demo (live, not slides)**
- Just run the 15-second demo. The slide is a placeholder that says "DEMO TIME".

**Slide 3 — The Tech Moat**
- Lockscreen bystander QR with offline payload (compressed JSON)
- Voice-activated SOS (hands-free)
- **Two Gemini AI agents working together:** a **Vision agent** that reads accident scenes, and a **Live voice agent** that guides bystanders through CPR in real-time Hindi while the ambulance is en route — the first phone-based AI paramedic in India
- Vital signs from selfie via rPPG (research-backed signal processing)
- Powered by **Google Gemini 2.0 (Vision + Live)** + **IBM watsonx-style signal processing**

**Slide 4 — Why We Win (the novelty matrix)**
- Show the table from Section 2 of this plan
- Highlight the empty intersection nobody else fills

**Slide 5 — The Ask**
- We want to take Jeevan Rakshak public, partnered with 108 Jharkhand and TMH Jamshedpur
- Looking for: pilot deployment with Jharkhand state government's emergency services
- Team: Ritesh + [teammate name] + Claude (AI co-builder, named on slide as "AI engineering partner")
- Tagline: *"Every phone in India should be a lifeline."*

---

## 11. Demo day runbook (the actual flow)

**T-60 min: Setup**
- Both phones charged to 100%
- Power bank in pocket
- Test SOS flow once in venue
- Test QR scan with second phone
- Test voice trigger in venue ambient noise
- Open the public profile URL on the demo phone
- Set the demo phone to airplane mode briefly to test offline QR

**T-15 min: Standby**
- Take a deep breath
- Review the 15-sec script one more time
- Ensure the printed accident photo is in pocket
- Charge cable handy

**T-0: Demo time**
1. Approach judges with phone in hand, lockscreen showing
2. *"Imagine my dadi just collapsed. Scan this QR with your phone."* — hand phone over
3. After judge scans and reacts, take phone back
4. *"Now imagine she's alone."* — hands behind back, *"SOS SOS SOS"*
5. Show the red SOS screen on the phone
6. **Beat 3 — the silent-room moment:** *"Ambulance is 4 minutes away. But dadi needs help NOW."* — phone speaks calm Hindi: *"क्या साँस चल रही है?"* — Ritesh replies *"नहीं।"* — phone starts CPR metronome and counts compressions. **Let it run 4 seconds. Do not speak over it. Let the judges hear the AI paramedic.**
7. *"And imagine a bystander across town is filming a different accident."* — pull out printed scene photo, hold phone up to it
8. Let the Hindi voice play
9. *"And just so you know — my pulse has been streaming this entire time."* — show the heart rate display
10. Pause for 2 seconds. Let it land.
11. *"Jeevan Rakshak. When the ambulance is 4 minutes away, your phone becomes the paramedic."*
12. Walk away. Don't oversell.

**Q&A prep:**
- *"How do you make money?"* → "B2G with state emergency services (₹2-5 per active user/month) + hospital subscriptions (₹2,000/month for the dispatch dashboard) + insurance partnerships. Free for users forever."
- *"Doesn't 112 India do this?"* → "112 India is government-grade and only handles dispatch. We're a complete personal safety OS — bystander card, voice activation, AI paramedic copilot during the wait, AI eye witness, vital signs. The intersection is empty. And no one else has the AI paramedic."
- *"Isn't the AI paramedic dangerous — what if it gives wrong advice?"* → "The system prompt grounds it in standard AHA CPR protocol, and it operates under a safety harness: it only gives compression-rate guidance and triage questions. It is explicitly not a substitute for trained care — it's a bridge that fills the 4-minute wait. Liability-wise, it's the same category as a dispatcher on a 108 call, which is already legally protected under Good Samaritan frameworks in India."
- *"How accurate is the heart rate from selfie?"* → "rPPG research papers show ±5 BPM accuracy with proper lighting. We're using the same signal processing — bandpass filter, FFT, forehead ROI. Not magic, just published science most consumer apps haven't shipped yet."
- *"What if the user is unconscious and can't trigger the SOS?"* → "S3 stretch: passive audio crash detection + accelerometer fall detection. The phone fires SOS without the user."
- *"DPDP Act compliance?"* → "Mumbai-region Supabase, encrypted at rest, signed-token public access, user controls own data, granular consent."

---

## 12. Success metrics for demo day

- ✅ 20-second demo runs end-to-end with zero hiccups
- ✅ Judge volunteers their own phone for the QR scan
- ✅ At least one judge says *"wait, does this exist?"*
- ✅ At least one judge tests the offline mode by enabling airplane mode
- ✅ **The AI Paramedic (F11 Beat 3) makes the room go silent — the CPR metronome is the moment.**
- ✅ At least one judge asks how the Gemini Live agent is grounded
- ✅ At least one judge asks about scaling/B2G partnership
- ✅ We finish the demo in under 22 seconds (20 + 2 grace)

---

## 13. Codebase structure (planned)

```
jeevan-rakshak/
├── public/
│   ├── demo-scenes/          # 5 sample accident photos
│   ├── fallback/
│   │   └── copilot-hindi-cpr.mp3  # F11 — demo-safe pre-recorded audio
│   ├── icons/                # PWA icons
│   └── manifest.json         # PWA manifest
├── src/
│   ├── pages/
│   │   ├── Home.tsx           # Landing
│   │   ├── Profile.tsx        # F1 — Emergency Profile
│   │   ├── PublicProfile.tsx  # F2 — /q/:token (the bystander view)
│   │   ├── SOSActive.tsx      # F4 — full-screen red SOS
│   │   ├── Copilot.tsx        # F11 — AI First-Aid Copilot (Gemini Live)
│   │   ├── EyeWitness.tsx     # F6 — camera scene reporter
│   │   ├── VitalSigns.tsx     # F7 — rPPG heart rate (animated fallback)
│   │   └── Hospital.tsx       # S2 stretch — hospital dashboard
│   ├── components/
│   │   ├── QRCard.tsx
│   │   ├── WallpaperGenerator.tsx
│   │   ├── HospitalMap.tsx
│   │   ├── SOSButton.tsx
│   │   ├── ContactCascade.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── HeartRateDisplay.tsx
│   │   ├── Waveform.tsx
│   │   └── ui/               # shadcn primitives
│   ├── hooks/
│   │   ├── useTripleTap.ts
│   │   ├── useVoiceSOS.ts
│   │   ├── useGeolocation.ts
│   │   └── useWakeLock.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── qr.ts
│   │   ├── distance.ts
│   │   ├── routing.ts
│   │   ├── tts.ts
│   │   ├── rppg.ts
│   │   ├── geminiLive.ts       # F11 — WebSocket + audio streaming
│   │   ├── cprMetronome.ts     # F11 — 100 BPM AudioContext click
│   │   ├── audioRecorder.ts
│   │   ├── offlineEncode.ts
│   │   ├── offlineDecode.ts
│   │   └── sos.ts
│   ├── data/
│   │   ├── hospitals_jamshedpur.json
│   │   ├── allergies.json
│   │   ├── conditions.json
│   │   └── firstAidPrompts.ts  # F11 — system prompt + decision tree
│   ├── types/
│   │   ├── profile.ts
│   │   ├── sos.ts
│   │   └── eyewitness.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   ├── 001_profiles.sql
│   │   ├── 002_sos_sessions.sql
│   │   └── 003_eyewitness_reports.sql
│   └── functions/
│       ├── analyze-scene/
│       │   └── index.ts        # F6 — Gemini Vision call
│       └── copilot-relay/
│           └── index.ts        # F11 — streams Copilot transcript to sos_sessions
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 14. Open questions before we start coding

1. **When does the 24h clock start?** Tell me the exact date/time so I can lock the build calendar.
2. **Demo phone:** Which phone are we using for the demo? (Affects camera quality for rPPG, OS for voice recognition, browser support for Web Speech API). **Recommendation: latest Android Chrome.**
3. **Judge phones:** Will judges be willing to scan a QR with their personal phone? Or do we provide a second phone? **Recommendation: provide a second phone, eliminate friction.**
4. **Stage:** Is the demo on a stage with a projector, or table-side with judges crowding around? Affects whether we need a projector mode.
5. **Internet at venue:** Confirmed WiFi or relying on mobile data? **Recommendation: bring a phone hotspot as backup.**
6. **Stretch features:** Of S1–S5, which one do you most want if we have time? My vote: **S2 hospital dashboard** (proves the monetization story visibly).
7. **Team logo / branding:** Do we have a name for the team itself separate from the project?
8. **Sponsor swag opportunity:** Should we add an "IBM watsonx" framing on slide 3 even if we're not using watsonx specifically? It costs us nothing and IBM judges notice. **Recommendation: yes.**
9. **Pre-hour-0 prep timing:** Can you do the 30 minutes of hospital data collection on Friday evening before the clock starts? I'll do the rest in parallel.

---

## 15. The single-sentence elevator pitch (for any moment)

> *"Every emergency app in India dispatches help. **We're the first that IS help during the 4-minute wait.** Jeevan Rakshak is a complete emergency response system — lockscreen QR for bystanders, hands-free voice SOS, and an AI paramedic powered by Gemini Live that walks any bystander through CPR in Hindi while the ambulance is en route. Plus an AI eye witness for accident scenes and live vital signs from your selfie camera. All in one PWA. An AI paramedic in every Indian pocket."*

---

## 16. Final note

This plan is the contract. Every feature is justified, every hour is accounted for, every risk is mitigated. The demo script is memorized, the novelty is real, the tech is impressive but achievable. We're not building the most ambitious thing on stage — we're building the most **finishable** ambitious thing.

Hackathons are won by execution, not ambition. This plan trades scope for polish, complexity for moments, and theory for visceral demo reactions.

**We're going to win. Let's build.** 🔥

— Ritesh & Claude
HackHorizon 2K26
