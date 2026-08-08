import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Failing at module load is deliberate: a client built against undefined
  // config produces 401s that look like an auth bug for hours.
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set — see .env.example',
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL to parse in a native app, and leaving this on makes Supabase look
    // for a browser location that does not exist.
    detectSessionInUrl: false,
  },
});

/**
 * Signed URL for a private wardrobe image. Photos are personal data and the
 * bucket is private (spec §7) — there is no public URL to fall back to, so
 * every render path goes through here.
 *
 * The TTL is an hour: long enough that scrolling a 200-garment wardrobe does not
 * re-sign constantly, short enough that a leaked URL expires.
 */
export async function signedImageUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('garments')
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    console.warn('could not sign image url', path, error.message);
    return null;
  }
  return data.signedUrl;
}
