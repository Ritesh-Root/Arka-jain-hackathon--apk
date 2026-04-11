
# Jeevan Rakshak

AI-assisted emergency companion app built with React + Vite + Capacitor Android.

It combines emergency profile storage, SOS automation, hospital discovery, camera-based AI guidance, and native Android background protection into one mobile-first experience.

## What This App Does

Jeevan Rakshak is designed for high-stress emergency moments. It helps with:

- Fast SOS triggering (voice, tap, shake, button)
- Emergency contact cascade calling and messaging
- Location-aware nearest hospital assistance
- Public emergency profile sharing through an offline-capable QR
- AI first-aid assistant and injury scan guidance
- Android foreground background guard for 24x7 detection support

## Feature Coverage

### 1) Onboarding + Emergency Profile

- First-run onboarding modal captures:
  - Name
  - Age
  - Blood type
  - Conditions
  - Allergies
  - Primary emergency contact
- Profile is persisted in local storage.
- Profile settings page supports:
  - Personal info updates
  - Allergies and conditions chips (add/remove)
  - Medication list management
  - Up to 3 emergency contacts
  - Shake-to-SOS toggle
  - Save and sync to Android native config

### 2) SOS Trigger System

SOS can be activated using multiple channels:

- Floating SOS button
- Triple tap on non-interactive screen areas
- Voice keyword detection:
  - Single-phrase instant triggers:
    - "SOS SOS SOS"
    - "Help Help Help"
    - "Bachao Bachao Bachao"
  - Rolling keyword accumulation for:
    - sos, help, bachao, madad, emergency
- Shake trigger (when enabled in settings): repeated high-g-force detections

### 3) SOS Active Emergency Console

When SOS is active, the app opens a dedicated emergency screen that includes:

- Live emergency timer
- Audio recording indicator
- Siren tone loop
- Wake lock attempt to keep screen active
- Location lock and lat/lng display
- Nearest hospitals panel with distance, ETA, and beds
- Contact cascade view and actions
- Call flow controls:
  - Call now
  - Call next contact
  - Retry/skip options
- SMS dispatch support:
  - Auto-opens SMS composer with emergency message when location is available
  - Manual "Send SMS" fallback button
- WhatsApp quick message button for active contact
- Quick links to:
  - AI First-Aid Copilot
  - AI Eye Witness

### 4) Emergency Contact Cascade Logic

- Dial targets are deduplicated and normalized.
- Cascade order includes:
  - Primary emergency number
  - Secondary emergency number
  - User contacts
- Auto-advance to next number after timeout window.

Default emergency numbers in app config:

- Primary: `8210950528`
- Secondary: `9304673802`

### 5) Lockscreen QR + Offline Emergency Data

- QR is generated from profile data and public token.
- Compressed medical payload is embedded in URL hash (`OFFLINE_DATA`) using `lz-string`.
- Bystander can scan and view emergency profile even without network fetch.
- QR page supports:
  - Live profile preview
  - Link copy
  - Downloadable lockscreen wallpaper with QR + key medical info

### 6) Public Emergency Profile Page

`/q/:token` shows emergency profile data for bystanders:

- Name, age, blood type
- Allergies
- Conditions
- Medications
- Tap-to-call emergency contacts

It prefers offline embedded payload when available; otherwise falls back to token match in local profile context.

### 7) Hospital Map + Triage Helper

- Uses Leaflet (`react-leaflet`) with live user location.
- Uses Jamshedpur hospital dataset from `src/data/hospitals_jamshedpur.json`.
- Shows:
  - User marker
  - Hospital markers
  - Highlighted nearest hospitals with route polylines
  - Distance, ETA, bed availability, trauma level, ICU/blood-bank flags
  - Emergency and ambulance call buttons with confirmation prompt
- Also includes a scrollable "All hospitals" list.

### 8) AI Eye Witness (Scene Reporter)

- Camera capture flow for accident scene observation.
- Generates structured scene report UI with:
  - Incident type
  - Victims/vehicles
  - Severity
  - Immediate actions
  - "Do not" warnings
  - Hindi + English summary
- Hindi summary text-to-speech playback available.

Note: current scene analysis uses in-app mock reports for deterministic UI behavior.

### 9) Scan Patient (AI Injury + Treatment Flow)

- Camera-based patient image capture.
- Sends multimodal request to Groq model and expects strict JSON output.
- Displays:
  - Severity
  - Likely injuries
  - Immediate treatment steps
  - "Do not do" list
  - Escalation advice
- Includes fallback report when API/model response is unavailable.
- Includes one-tap call to emergency services (`tel:112`).

### 10) AI Emergency Copilot

- Profile-aware conversational first-aid assistant.
- Streaming response rendering (SSE chunk handling) from Groq Chat Completions API.
- Voice input support via browser speech recognition.
- Text-to-speech for assistant replies.
- Multi-key failover support:
  - Primary API key
  - Backup API key
- Local fallback responder when API is unavailable.

### 11) Permission Setup UX

First-run permission wizard with platform-specific behavior:

- Android native: launches sequential native permission flow via Capacitor plugin.
- Web: requests motion, microphone, camera, geolocation, notifications step-by-step.
- Includes:
  - Retry path
  - Open app settings shortcut
  - Skip for now option
- Settings page includes permission status dashboard and refresh action.

### 12) Android Native Background Guard

Native Android integration adds always-on protection scaffolding:

- Capacitor plugin: `HotwordService`
- Foreground service: `EmergencyHotwordService`
- Boot receiver restarts service after reboot/update
- Native speech recognition loop for hotword listening
- Native shake detection via accelerometer
- Emergency sequence from service:
  - Siren tone
  - SMS attempts (device SMS, optional Twilio fallback)
  - Call cascade
- App settings launcher from plugin for permission recovery

## Tech Stack

### Frontend

- React `18.3.1`
- React Router `7.13.0`
- Vite `6.3.5`
- TypeScript (via Vite TS env typings)
- Tailwind CSS `4.1.12`
- Lucide React icons
- Sonner for toast notifications

### Mapping + Data

- Leaflet `1.9.4`
- react-leaflet `5.0.0`
- Local JSON dataset for hospitals

### QR + Compression

- qrcode `1.5.4`
- lz-string `1.5.0`

### AI + Voice

- Groq OpenAI-compatible endpoint
- Browser SpeechRecognition/WebKitSpeechRecognition
- Browser SpeechSynthesis API

### Android Native

- Capacitor `8.3.0`
  - `@capacitor/core`
  - `@capacitor/android`
  - `@capacitor/cli`
- Java Android service/plugin code
- Android SDK 36 / targetSdk 36 / minSdk 24
- Java 21 + Android Gradle Plugin 8.13.0

### CI/CD

- GitHub Actions workflow for APK build
- Automated artifact uploads:
  - Debug APK
  - Gradle build log

## Route Map

- `/` Home
- `/profile` Settings + emergency profile
- `/qr` QR generator and preview
- `/hospitals` Hospital map and nearest facilities
- `/witness` AI Eye Witness
- `/scan` Scan Patient
- `/vitals` Alias route to Scan Patient
- `/copilot` AI Emergency Copilot
- `/q/:token` Public emergency profile view

## Project Structure (Key Paths)

- `src/app/components/Layout.tsx` App shell, onboarding, permission wizard, SOS triggers
- `src/app/components/SOSActive.tsx` Active emergency console
- `src/app/components/Profile.tsx` Profile + permissions dashboard + shake setting
- `src/app/components/HospitalMap.tsx` Map + nearest hospitals + call actions
- `src/app/components/QRCard.tsx` QR generation + offline payload + wallpaper export
- `src/app/components/PublicProfile.tsx` Bystander emergency profile page
- `src/app/components/Copilot.tsx` Streaming AI assistant + speech input/output
- `src/app/components/VitalSigns.tsx` Scan Patient AI flow
- `src/app/components/EyeWitness.tsx` Scene capture + structured report UI
- `src/app/lib/storage.ts` Profile/settings persistence and emergency target logic
- `src/app/lib/androidHotword.ts` Web-to-native bridge wrapper
- `android/app/src/main/java/com/jeevanrakshak/app/HotwordPlugin.java` Native plugin + permission callbacks
- `android/app/src/main/java/com/jeevanrakshak/app/EmergencyHotwordService.java` Foreground guard service
- `android/app/src/main/java/com/jeevanrakshak/app/BootReceiver.java` Auto-start on boot/package replace
- `.github/workflows/android-apk.yml` CI APK workflow

## Environment Configuration

Copy `.env.example` to `.env.local` and set values as needed:

```bash
cp .env.example .env.local
```

Supported vars:

- `VITE_GROQ_API_KEY`
- `VITE_GROQ_API_KEY_BACKUP`
- `VITE_GROQ_MODEL`
- `VITE_TWILIO_ACCOUNT_SID`
- `VITE_TWILIO_API_KEY_SID`
- `VITE_TWILIO_API_SECRET`
- `VITE_TWILIO_FROM_NUMBER`

Notes:

- Current app code uses Groq env keys directly for AI features.
- Native Twilio fallback in Android service requires native secret wiring (`AppSecrets`) if you enable it.
- Keep `.env.local` and native secrets out of source control.

## Local Development

### Prerequisites

- Node.js 20+
- npm
- Android Studio (for native run/build)
- Android SDK platform 36 + build tools 36.0.0
- Java 21 (for Gradle builds)

### Install

```bash
npm install --legacy-peer-deps
```

### Run Web App

```bash
npm run dev
```

### Build Web App

```bash
npm run build
```

## Android Commands

### Sync web build into Android project

```bash
npm run android:sync
```

### Open Android Studio project

```bash
npm run android:open
```

### Build and run on connected device

```bash
npm run android:run
```

## CI APK Build (GitHub Actions)

Workflow: `.github/workflows/android-apk.yml`

Triggers:

- Manual (`workflow_dispatch`)
- Push to `main` or `master`

Pipeline summary:

1. Checkout repository
2. Setup Node 20
3. Setup Java 21
4. Setup Android SDK + install platform tools/build tools
5. Install dependencies (`npm install --legacy-peer-deps`)
6. Build web app (`npm run build`)
7. Copy web assets into Android assets directory
8. Build debug APK with Gradle
9. Upload artifacts:
   - `jeevan-rakshak-debug-apk`
   - `gradle-build-log`

## Permissions Used

Android manifest permissions include:

- `INTERNET`
- `RECORD_AUDIO`
- `CAMERA`
- `CALL_PHONE`
- `SEND_SMS`
- `RECEIVE_BOOT_COMPLETED`
- `WAKE_LOCK`
- `POST_NOTIFICATIONS`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_MICROPHONE`
- `FOREGROUND_SERVICE_PHONE_CALL`

## Known Notes / Current Behavior

- AI Eye Witness currently uses mock result data for reporting UI.
- Browser voice recognition depends on device/browser support.
- Background call launching behavior can vary by Android OEM restrictions.
- Reliable 24x7 Android behavior may require:
  - Granting all requested permissions
  - Setting battery mode to Unrestricted for the app

## Scripts

- `npm run dev` Start Vite dev server
- `npm run build` Build production web bundle
- `npm run android:sync` Build web + Capacitor sync
- `npm run android:open` Open native Android project
- `npm run android:run` Build web + run on Android target

## Attribution

See `ATTRIBUTIONS.md` for additional attribution details.
