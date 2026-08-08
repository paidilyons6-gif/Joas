import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Image, type ImageStyle } from 'expo-image';
import { signedImageUrl } from '../lib/supabase';
import { colours, radius, type } from '../theme';

/**
 * Signed URLs are per-object and expire, so they cannot live in the row. Cache
 * them in module scope keyed by path: a 200-garment wardrobe would otherwise
 * issue 200 sign requests every time the list remounts, which is exactly the
 * scroll-performance problem the 60fps criterion is about (spec §6.4).
 */
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const TTL_SECONDS = 3600;
/** Re-sign a minute early so a URL never expires mid-render. */
const REFRESH_MARGIN_MS = 60_000;

async function resolveUrl(path: string): Promise<string | null> {
  const cached = urlCache.get(path);
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) return cached.url;

  const url = await signedImageUrl(path, TTL_SECONDS);
  if (url) {
    urlCache.set(path, { url, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }
  return url;
}

interface Props {
  path: string | null;
  /** Shown when there is no image, and used as the accessibility label. */
  title: string;
  size: number;
  /** Extra geometry only. Typed as the intersection so a caller cannot pass a
   *  property that one of the two render branches rejects. */
  style?: ViewStyle & ImageStyle;
}

export function GarmentImage({ path, title, size, style }: Props) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!path) return null;
    const cached = urlCache.get(path);
    return cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now() ? cached.url : null;
  });

  useEffect(() => {
    if (!path || url) return;
    let cancelled = false;
    void resolveUrl(path).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [path, url]);

  // Shared geometry, typed as the intersection both consumers accept: a
  // ViewStyle permits `overflow: 'scroll'` and expo-image's ImageStyle does not.
  const box = { width: size, height: size, borderRadius: radius.md } satisfies ViewStyle &
    ImageStyle;

  if (!url) {
    // A placeholder carrying the garment's initials, so an un-imaged wardrobe is
    // still navigable rather than a column of identical grey squares.
    const initials = title
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

    return (
      <View
        style={[styles.placeholder, box, style]}
        accessible
        accessibilityLabel={`${title}, no photo`}
      >
        <Text style={styles.initials}>{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={[box, style]}
      contentFit="cover"
      // expo-image caches to disk, which is what keeps a re-scroll from
      // re-downloading. `transition` is short so it reads as instant.
      cachePolicy="disk"
      transition={120}
      accessible
      accessibilityLabel={title}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colours.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...type.label, color: colours.textMuted },
});
