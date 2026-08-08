/**
 * Design tokens.
 *
 * `minTouch` is 44 and is not negotiable: spec §7 requires every interactive
 * element to be at least 44pt. It is a token rather than a literal so a review
 * can grep for the ones that missed it.
 */

export const colours = {
  background: '#faf9f7',
  surface: '#ffffff',
  border: '#e4e1db',
  text: '#1c1b19',
  textMuted: '#6f6b64',
  accent: '#1f4f43',
  accentText: '#ffffff',
  warning: '#8a5a00',
  danger: '#8c2f22',
  staleBanner: '#f2ead9',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

/** Minimum interactive size in points (spec §7 accessibility). */
export const minTouch = 44;

export const type = {
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

/** Format cents for display. Never returns "€0.00" for an unknown price — see
 *  costPerWear, which returns null rather than zero for exactly this reason. */
export function formatMoney(cents: number | null, currency = 'EUR'): string {
  if (cents === null) return '—';
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(cents / 100);
}
