/**
 * Server state for the wardrobe (spec §1: TanStack Query).
 *
 * Every read is offline-capable: the query fetches from Supabase, writes the
 * result into the SQLite mirror, and falls back to the mirror when the fetch
 * fails. Every write is optimistic and queued in the outbox when offline, so
 * logging a wear on the train works and lands later (spec §7).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  replaceGarments,
  readGarments,
  replaceWears,
  readWears,
  enqueue,
  readOutbox,
  dropOutboxEntry,
  recordOutboxFailure,
  type MirroredGarment,
} from '../lib/offline';
import type { Garment, LayerSlot, GarmentCondition, PatternScale } from '@rail/core';
import { labFromArray } from '@rail/core';

export const garmentKeys = {
  all: ['garments'] as const,
  wears: ['garment-wears'] as const,
};

/** Columns the wardrobe needs. Explicit rather than `*` so adding a column to the
 *  table does not silently widen every list query and the payload with it. */
const GARMENT_SELECT = `
  id, title, size_label, purchase_price_cents, currency, purchased_at,
  colour_primary_hex, colour_primary_lab, colour_secondary_hex, is_neutral,
  pattern, pattern_scale, material_main, warmth_rating, waterproof, formality,
  image_path, condition, in_wash, archived_at, updated_at,
  brands ( name ),
  categories ( slug, display_name, layer_slot )
`;

interface GarmentRow {
  id: string;
  title: string;
  size_label: string | null;
  purchase_price_cents: number | null;
  currency: string;
  purchased_at: string | null;
  colour_primary_hex: string | null;
  colour_primary_lab: number[] | null;
  colour_secondary_hex: string | null;
  is_neutral: boolean;
  pattern: string;
  pattern_scale: string | null;
  material_main: string | null;
  warmth_rating: number | null;
  waterproof: boolean;
  formality: number | null;
  image_path: string | null;
  condition: string;
  in_wash: boolean;
  archived_at: string | null;
  updated_at: string;
  brands: { name: string } | null;
  categories: { slug: string; display_name: string; layer_slot: string } | null;
}

/**
 * The wardrobe list item: the domain `Garment` the scorer understands, plus the
 * display-only fields the list needs. Kept as one type so a screen never has to
 * join two shapes back together at render time.
 */
export interface WardrobeGarment extends Garment {
  brandName: string | null;
  categoryDisplayName: string;
  colourPrimaryHex: string | null;
  colourLabel: string | null;
  sizeLabel: string | null;
  purchasePriceCents: number | null;
  currency: string;
  purchasedAt: string | null;
  imagePath: string | null;
  updatedAt: string;
}

function rowToGarment(row: GarmentRow): WardrobeGarment {
  return {
    id: row.id,
    title: row.title,
    categorySlug: row.categories?.slug ?? 'unknown',
    layerSlot: (row.categories?.layer_slot ?? 'top') as LayerSlot,
    colourPrimary: labFromArray(row.colour_primary_lab),
    colourSecondary: null,
    isNeutral: row.is_neutral,
    pattern: row.pattern,
    patternScale: (row.pattern_scale as PatternScale | null) ?? null,
    materialMain: row.material_main,
    warmthRating: row.warmth_rating ?? 0,
    waterproof: row.waterproof,
    // The column is nullable but the scorer needs a value; 2 is "everyday",
    // which is the least wrong assumption for an unclassified garment.
    formality: (row.formality ?? 2) as Garment['formality'],
    condition: row.condition as GarmentCondition,
    inWash: row.in_wash,
    archivedAt: row.archived_at,

    brandName: row.brands?.name ?? null,
    categoryDisplayName: row.categories?.display_name ?? 'Uncategorised',
    colourPrimaryHex: row.colour_primary_hex,
    colourLabel: null,
    sizeLabel: row.size_label,
    purchasePriceCents: row.purchase_price_cents,
    currency: row.currency,
    purchasedAt: row.purchased_at,
    imagePath: row.image_path,
    updatedAt: row.updated_at,
  };
}

function mirroredToGarment(row: MirroredGarment): WardrobeGarment {
  let lab: number[] | null = null;
  if (row.colour_primary_lab) {
    try {
      const parsed: unknown = JSON.parse(row.colour_primary_lab);
      if (Array.isArray(parsed)) lab = parsed as number[];
    } catch {
      lab = null;
    }
  }

  return {
    id: row.id,
    title: row.title,
    categorySlug: row.category_slug,
    layerSlot: row.layer_slot as LayerSlot,
    colourPrimary: labFromArray(lab),
    colourSecondary: null,
    isNeutral: row.is_neutral === 1,
    pattern: row.pattern,
    patternScale: (row.pattern_scale as PatternScale | null) ?? null,
    materialMain: row.material_main,
    warmthRating: row.warmth_rating,
    waterproof: row.waterproof === 1,
    formality: row.formality as Garment['formality'],
    condition: row.condition as GarmentCondition,
    inWash: row.in_wash === 1,
    archivedAt: row.archived_at,

    brandName: row.brand_name,
    categoryDisplayName: row.category_slug,
    colourPrimaryHex: row.colour_primary_hex,
    colourLabel: row.colour_label,
    sizeLabel: row.size_label,
    purchasePriceCents: row.purchase_price_cents,
    currency: row.currency,
    purchasedAt: row.purchased_at,
    imagePath: row.image_path,
    updatedAt: row.updated_at,
  };
}

function garmentToMirrored(g: WardrobeGarment): MirroredGarment {
  return {
    id: g.id,
    title: g.title,
    brand_name: g.brandName,
    category_slug: g.categorySlug,
    layer_slot: g.layerSlot,
    colour_primary_hex: g.colourPrimaryHex,
    colour_primary_lab: g.colourPrimary
      ? JSON.stringify([g.colourPrimary.L, g.colourPrimary.a, g.colourPrimary.b])
      : null,
    colour_label: g.colourLabel,
    is_neutral: g.isNeutral ? 1 : 0,
    pattern: g.pattern,
    pattern_scale: g.patternScale,
    material_main: g.materialMain,
    warmth_rating: g.warmthRating,
    waterproof: g.waterproof ? 1 : 0,
    formality: g.formality,
    size_label: g.sizeLabel,
    purchase_price_cents: g.purchasePriceCents,
    currency: g.currency,
    purchased_at: g.purchasedAt,
    image_path: g.imagePath,
    condition: g.condition,
    in_wash: g.inWash ? 1 : 0,
    archived_at: g.archivedAt,
    updated_at: g.updatedAt,
  };
}

export interface WardrobeResult {
  garments: WardrobeGarment[];
  /** True when the list came from the mirror because the fetch failed. Screens
   *  must label stale data rather than pretending it is live (spec §7). */
  fromCache: boolean;
}

export function useWardrobe(): UseQueryResult<WardrobeResult> {
  return useQuery({
    queryKey: garmentKeys.all,
    queryFn: async (): Promise<WardrobeResult> => {
      const { data, error } = await supabase
        .from('garments')
        .select(GARMENT_SELECT)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        const cached = await readGarments();
        // An empty mirror and a failed fetch is a real failure, not an empty
        // wardrobe — surfacing it as "no garments" would look like data loss.
        if (cached.length === 0) throw error;
        return { garments: cached.map(mirroredToGarment), fromCache: true };
      }

      const garments = (data as unknown as GarmentRow[]).map(rowToGarment);
      await replaceGarments(garments.map(garmentToMirrored));
      return { garments, fromCache: false };
    },
    staleTime: 30_000,
  });
}

export interface WearRow {
  id: string;
  garment_id: string;
  worn_on: string;
  source: string;
}

export function useWears(): UseQueryResult<WearRow[]> {
  return useQuery({
    queryKey: garmentKeys.wears,
    queryFn: async (): Promise<WearRow[]> => {
      const { data, error } = await supabase
        .from('garment_wears')
        .select('id, garment_id, worn_on, source')
        .order('worn_on', { ascending: false });

      if (error) {
        const cached = await readWears();
        if (cached.length === 0) throw error;
        return cached;
      }

      const rows = data as WearRow[];
      await replaceWears(rows);
      return rows;
    },
    staleTime: 30_000,
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Log a wear. Optimistic, and queued to the outbox if the write fails — the
 * "worn today" tap is the app's most frequent interaction and must never
 * present a spinner or a failure dialog.
 */
export function useLogWear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ garmentId, wornOn = today() }: { garmentId: string; wornOn?: string }) => {
      const { error } = await supabase
        .from('garment_wears')
        .insert({ garment_id: garmentId, worn_on: wornOn, source: 'manual' });

      // The unique index makes a double-tap a duplicate rather than an error;
      // 23505 here means "already logged", which is the state the user wanted.
      if (error && error.code !== '23505') {
        await enqueue('log_wear', { garmentId, wornOn });
        throw error;
      }
    },

    onMutate: async ({ garmentId, wornOn = today() }) => {
      await queryClient.cancelQueries({ queryKey: garmentKeys.wears });
      const previous = queryClient.getQueryData<WearRow[]>(garmentKeys.wears);

      queryClient.setQueryData<WearRow[]>(garmentKeys.wears, (old = []) => {
        if (old.some((w) => w.garment_id === garmentId && w.worn_on === wornOn)) return old;
        return [
          { id: `optimistic-${garmentId}-${wornOn}`, garment_id: garmentId, worn_on: wornOn, source: 'manual' },
          ...old,
        ];
      });

      return { previous };
    },

    onError: (_error, _vars, context) => {
      // The write is in the outbox, so the optimistic row is not a lie — but the
      // server's copy is what the id must come from, so roll back and let the
      // outbox flush reconcile.
      if (context?.previous) {
        queryClient.setQueryData(garmentKeys.wears, context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: garmentKeys.wears });
    },
  });
}

export function useSetInWash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ garmentId, inWash }: { garmentId: string; inWash: boolean }) => {
      const { error } = await supabase
        .from('garments')
        .update({ in_wash: inWash })
        .eq('id', garmentId);
      if (error) {
        await enqueue('update_garment', { garmentId, patch: { in_wash: inWash } });
        throw error;
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: garmentKeys.all });
    },
  });
}

/**
 * Replay queued writes. Called on reconnect and at app foreground.
 *
 * Entries are replayed in order and dropped on success. A failing entry is left
 * in place with its attempt count bumped — after enough attempts it is dropped,
 * because an entry that can never apply (a garment deleted on another device)
 * would otherwise block every write behind it forever.
 */
const MAX_OUTBOX_ATTEMPTS = 5;

export async function flushOutbox(): Promise<{ sent: number; failed: number }> {
  const entries = await readOutbox();
  let sent = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const payload: unknown = JSON.parse(entry.payload);

      if (entry.kind === 'log_wear') {
        const { garmentId, wornOn } = payload as { garmentId: string; wornOn: string };
        const { error } = await supabase
          .from('garment_wears')
          .insert({ garment_id: garmentId, worn_on: wornOn, source: 'manual' });
        if (error && error.code !== '23505') throw new Error(error.message);
      } else if (entry.kind === 'unlog_wear') {
        const { garmentId, wornOn } = payload as { garmentId: string; wornOn: string };
        const { error } = await supabase
          .from('garment_wears')
          .delete()
          .eq('garment_id', garmentId)
          .eq('worn_on', wornOn);
        if (error) throw new Error(error.message);
      } else {
        const { garmentId, patch } = payload as { garmentId: string; patch: Record<string, unknown> };
        const { error } = await supabase.from('garments').update(patch).eq('id', garmentId);
        if (error) throw new Error(error.message);
      }

      await dropOutboxEntry(entry.seq);
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : 'unknown error';

      if (entry.attempts + 1 >= MAX_OUTBOX_ATTEMPTS) {
        console.warn(`dropping outbox entry ${entry.seq} after ${MAX_OUTBOX_ATTEMPTS} attempts: ${message}`);
        await dropOutboxEntry(entry.seq);
      } else {
        await recordOutboxFailure(entry.seq, message);
        // Stop at the first failure: later entries may depend on this one, and
        // replaying out of order is worse than replaying late.
        break;
      }
    }
  }

  return { sent, failed };
}
