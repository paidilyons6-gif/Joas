/**
 * Wardrobe-level derivations used by the Wardrobe screen (spec §6.4) and by
 * intake. Pure functions over rows the caller has already fetched — no I/O, so
 * they run identically against the local SQLite mirror when offline.
 */

import type { Garment, LayerSlot } from './types';
import { SUGGESTION_PARAMS } from './config';

export interface WearRecord {
  garmentId: string;
  wornOn: string; // ISO date, YYYY-MM-DD
}

/**
 * Cost per wear, in cents. Null when the garment has no purchase price — showing
 * "€0.00 per wear" for an unpriced garment reads as free rather than unknown.
 *
 * An unworn garment costs its full price per wear, not infinity: the point of the
 * metric is to shame expensive things you never wear, and infinity sorts badly.
 */
export function costPerWear(
  purchasePriceCents: number | null,
  wearCount: number,
): number | null {
  if (purchasePriceCents === null) return null;
  return Math.round(purchasePriceCents / Math.max(1, wearCount));
}

/** Days since a garment was last worn; null if never worn. */
export function daysSinceLastWear(
  wears: readonly WearRecord[],
  garmentId: string,
  today = new Date(),
): number | null {
  let latest: number | null = null;
  for (const w of wears) {
    if (w.garmentId !== garmentId) continue;
    const t = Date.parse(`${w.wornOn}T00:00:00Z`);
    if (Number.isNaN(t)) continue;
    if (latest === null || t > latest) latest = t;
  }
  if (latest === null) return null;

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.round((todayUtc - latest) / 86_400_000));
}

/**
 * Garments eligible for a suggestion today (spec §4.3 step 2): not in the wash,
 * not archived, not needing repair, and not worn in the last N days.
 *
 * Never-worn garments are always eligible — `daysSinceLastWear` returning null
 * means no wear to be recent.
 */
export function eligibleForSuggestion(
  garments: readonly Garment[],
  wears: readonly WearRecord[],
  today = new Date(),
): Garment[] {
  const { recentWearExclusionDays } = SUGGESTION_PARAMS;

  return garments.filter((g) => {
    if (g.inWash) return false;
    if (g.archivedAt !== null) return false;
    if (g.condition === 'needs_repair') return false;

    const days = daysSinceLastWear(wears, g.id, today);
    return days === null || days > recentWearExclusionDays;
  });
}

/** Garments not worn in `noveltyDays` or more — the "not seen in a while" row. */
export function underWorn(
  garments: readonly Garment[],
  wears: readonly WearRecord[],
  today = new Date(),
): Garment[] {
  const { noveltyDays } = SUGGESTION_PARAMS;
  return garments.filter((g) => {
    if (g.archivedAt !== null) return false;
    const days = daysSinceLastWear(wears, g.id, today);
    return days === null || days >= noveltyDays;
  });
}

export type SlotCounts = Record<LayerSlot, number>;

/** Garment count per layer slot. Drives the wardrobe's category counts and §4.4. */
export function countBySlot(garments: readonly Garment[]): SlotCounts {
  const counts: SlotCounts = {
    base: 0,
    top: 0,
    mid: 0,
    outer: 0,
    bottom: 0,
    full: 0,
    shoes: 0,
    accessory: 0,
  };
  for (const g of garments) {
    if (g.archivedAt !== null) continue;
    counts[g.layerSlot] += 1;
  }
  return counts;
}

/**
 * The wardrobe's colour palette bar, most-common first.
 *
 * Returns text labels alongside the counts because colour must never be the sole
 * carrier of meaning (spec §7 accessibility) — the bar needs a text equivalent,
 * so the data layer produces one rather than leaving it to each call site.
 */
export interface PaletteEntry {
  hex: string;
  label: string;
  count: number;
}

export function palette(
  garments: ReadonlyArray<{
    colourPrimaryHex: string | null;
    colourLabel: string | null;
    archivedAt: string | null;
  }>,
): PaletteEntry[] {
  const byHex = new Map<string, PaletteEntry>();
  for (const g of garments) {
    if (g.archivedAt !== null || !g.colourPrimaryHex) continue;
    const key = g.colourPrimaryHex.toLowerCase();
    const existing = byHex.get(key);
    if (existing) existing.count += 1;
    else byHex.set(key, { hex: key, label: g.colourLabel ?? 'Unnamed colour', count: 1 });
  }
  return [...byHex.values()].sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex));
}
