/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_GROQ_API_KEY_BACKUP?: string;
  readonly VITE_GROQ_MODEL?: string;
  readonly VITE_TWILIO_ACCOUNT_SID?: string;
  readonly VITE_TWILIO_API_KEY_SID?: string;
  readonly VITE_TWILIO_API_SECRET?: string;
  readonly VITE_TWILIO_FROM_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
