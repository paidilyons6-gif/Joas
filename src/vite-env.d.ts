/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_ADMIN_EMAILS?: string;
  /** Set to "false" to open the full site after launch announce */
  readonly VITE_WAITLIST_MODE?: string;
  /** Local-only staff bypass when Netlify functions are unavailable */
  readonly VITE_WAITLIST_BYPASS_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
