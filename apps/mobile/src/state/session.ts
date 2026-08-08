/**
 * UI state only (spec §1: Zustand for UI state, TanStack Query for server state).
 *
 * The session lives here rather than in a query because it is not fetched — it
 * arrives via `onAuthStateChange` and every screen needs it synchronously to
 * decide whether to render at all.
 */

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearMirror } from '../lib/offline';

interface SessionState {
  session: Session | null;
  /** True until the persisted session has been read from storage. Screens must
   *  wait on this — routing on `session === null` before it resolves flashes the
   *  sign-in screen at every cold start. */
  loading: boolean;
  entitlement: 'free' | 'rail_full';
  setSession: (session: Session | null) => void;
  setEntitlement: (entitlement: 'free' | 'rail_full') => void;
  signOut: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  loading: true,
  entitlement: 'free',

  setSession: (session) => set({ session, loading: false }),
  setEntitlement: (entitlement) => set({ entitlement }),

  signOut: async () => {
    await supabase.auth.signOut();
    // The mirror holds this user's wardrobe. Leaving it for whoever signs in
    // next on this device is a data leak, not a cache.
    await clearMirror();
    set({ session: null, entitlement: 'free' });
  },
}));

/** Wire Supabase auth into the store. Called once, from the root layout. */
export function initSessionListener(): () => void {
  void supabase.auth.getSession().then(({ data }) => {
    useSession.getState().setSession(data.session);
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useSession.getState().setSession(session);
  });

  return () => data.subscription.unsubscribe();
}
