import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';

import { initSessionListener, useSession } from '../src/state/session';
import { flushOutbox } from '../src/data/garments';
import { supabase } from '../src/lib/supabase';
import { colours } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The wardrobe is offline-first; retrying a failed fetch three times just
      // delays the fall back to the mirror.
      retry: 1,
      // Data is mirrored locally, so refetching on every mount costs more than
      // it gains. Screens invalidate explicitly after a write.
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

/** Let TanStack Query know when the device is actually online, so mutations
 *  pause rather than failing into the outbox unnecessarily. */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected === true && state.isInternetReachable !== false);
  }),
);

export default function RootLayout() {
  const { session, loading, setEntitlement } = useSession();
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = initSessionListener();
    setReady(true);
    return unsubscribe;
  }, []);

  // Replay queued writes when connectivity returns, and when the app comes back
  // to the foreground — a socket can die without NetInfo noticing.
  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      if (online && wasOffline.current) {
        void flushOutbox().then(() => queryClient.invalidateQueries());
      }
      wasOffline.current = !online;
    });

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') void flushOutbox();
    };
    const appStateSub = AppState.addEventListener('change', onAppState);

    return () => {
      unsubscribeNet();
      appStateSub.remove();
    };
  }, []);

  // The entitlement gates features in the UI. The server enforces it too
  // (migration 0007) — this is presentation, not security.
  useEffect(() => {
    if (!session) return;
    void supabase
      .from('entitlements')
      .select('entitlement, expires_at')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        const active =
          data?.entitlement === 'rail_full' &&
          (!data.expires_at || new Date(data.expires_at) > new Date());
        setEntitlement(active ? 'rail_full' : 'free');
      });
  }, [session, setEntitlement]);

  // Routing waits on `loading`, otherwise every cold start flashes sign-in
  // before the persisted session is read.
  useEffect(() => {
    if (!ready || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/wardrobe');
    }
  }, [ready, loading, session, segments, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colours.background },
          headerTitleStyle: { color: colours.text },
          contentStyle: { backgroundColor: colours.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="garment/[id]" options={{ title: 'Garment' }} />
        <Stack.Screen name="import" options={{ title: 'Add garments', presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
