/**
 * Wardrobe intake (spec §3). Paths A (photo) and B (retailer link) ship in
 * Milestone 1; path C (order email) is in scope for v1 but arrives later
 * (docs/DECISIONS.md), and path D (manual) is the fallback.
 *
 * The budget is ~15 seconds per garment. Two consequences shape this file:
 *   * The UI is never blocked on embedding generation. A garment row is created
 *     immediately from the local image, and the embedding lands afterwards.
 *   * Bulk import is resumable: each photo is an independent job with its own
 *     status, so a killed app resumes rather than restarting.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';
import { garmentKeys } from './garments';
import { INTAKE } from '@rail/core';

export type ImportStage = 'queued' | 'uploading' | 'analysing' | 'ready' | 'failed';

export interface ImportJob {
  /** Local id; becomes the garment id once the row is created. */
  id: string;
  localUri: string;
  stage: ImportStage;
  error?: string;
  /** The confirmation card's contents once analysis returns (spec §3 step 4). */
  guess?: {
    categorySlug: string | null;
    categoryConfidence: number;
    brandName: string | null;
    materialMain: string | null;
  };
}

/** Free-tier rejection from the database trigger in migration 0007. */
export class FreeTierLimitError extends Error {
  constructor(readonly resource: string) {
    super(`free tier limit reached for ${resource}`);
    this.name = 'FreeTierLimitError';
  }
}

function isFreeTierRejection(message: string): string | null {
  const match = /free_tier_limit_reached: (\w+)/.exec(message);
  return match?.[1] ?? null;
}

/** Resize before upload. A camera original is 4-12MB; the model does not need it,
 *  and on a mobile connection the upload is the whole 15-second budget. */
async function prepareImage(uri: string): Promise<{ uri: string; blob: Blob }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: INTAKE.uploadMaxEdgePx } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );

  const response = await fetch(result.uri);
  return { uri: result.uri, blob: await response.blob() };
}

/**
 * Import one photo.
 *
 * Order is deliberate: create the garment row first, so the user sees it in the
 * wardrobe immediately and so the free-tier check fails fast before any bytes
 * are uploaded. The image and embedding attach to that row afterwards.
 */
export async function importPhoto(
  userId: string,
  localUri: string,
  onStage: (stage: ImportStage) => void,
): Promise<ImportJob> {
  onStage('uploading');

  // A minimal row. Title and category are placeholders the confirmation card
  // replaces — the user is never shown a form (spec §3 zero-tag onboarding).
  const { data: created, error: createError } = await supabase
    .from('garments')
    .insert({
      user_id: userId,
      title: 'New garment',
      // The taxonomy's fallback bucket. The classifier or the user narrows it.
      category_id: await defaultCategoryId(),
      source: 'photo',
    })
    .select('id')
    .single();

  if (createError) {
    const resource = isFreeTierRejection(createError.message);
    if (resource) throw new FreeTierLimitError(resource);
    throw createError;
  }

  const garmentId = created.id;
  const objectPath = `${userId}/${garmentId}/original.jpg`;

  try {
    const { blob } = await prepareImage(localUri);

    const { error: uploadError } = await supabase.storage
      .from('garments')
      .upload(objectPath, blob, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) throw uploadError;

    // The row is usable from here on: the wardrobe can show it with its image
    // while the embedding is still being computed.
    await supabase.from('garments').update({ image_path: objectPath }).eq('id', garmentId);

    onStage('analysing');

    const { data: analysis, error: analysisError } = await supabase.functions.invoke<{
      classification: {
        categorySlug: string | null;
        categoryConfidence: number;
        brandName: string | null;
        materialMain: string | null;
      };
    }>('embed-garment', {
      body: { garmentId, imagePath: objectPath },
    });

    if (analysisError) {
      // Analysis failing is not an import failing. The garment exists with its
      // photo; the user can fill in what the classifier would have guessed.
      console.warn('analysis failed, garment kept', analysisError.message);
      onStage('ready');
      return { id: garmentId, localUri, stage: 'ready' };
    }

    onStage('ready');
    const job: ImportJob = { id: garmentId, localUri, stage: 'ready' };
    // Assigned conditionally rather than as `guess: analysis?.classification`:
    // under exactOptionalPropertyTypes an explicit `undefined` is not the same
    // as an absent optional property, and "we did not classify it" is absence.
    if (analysis?.classification) job.guess = analysis.classification;
    return job;
  } catch (error) {
    // Roll the placeholder row back, or the wardrobe fills with untitled ghosts
    // and the free-tier count is spent on nothing.
    await supabase.from('garments').delete().eq('id', garmentId);
    onStage('failed');
    throw error;
  }
}

/** The taxonomy's least-committal category, used for a row that has not been
 *  classified yet. Cached because it is the same uuid for every import. */
let defaultCategoryCache: string | null = null;

async function defaultCategoryId(): Promise<string> {
  if (defaultCategoryCache) return defaultCategoryCache;

  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 't-shirt')
    .single();

  if (error || !data) throw new Error('taxonomy is not seeded: run the migrations');
  defaultCategoryCache = data.id;
  return data.id;
}

/**
 * Confirm the classifier's guesses (spec §3 step 4: one tap to accept).
 * This is the only place intake writes user-facing metadata.
 */
export function useConfirmGarment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      garmentId,
      title,
      categorySlug,
      colourPrimaryHex,
      brandId,
    }: {
      garmentId: string;
      title: string;
      categorySlug: string;
      colourPrimaryHex: string | null;
      brandId: string | null;
    }) => {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      if (categoryError || !category) throw new Error(`unknown category: ${categorySlug}`);

      // colour_primary_lab and is_neutral are derived by the sync_lab trigger
      // (migration 0012), so hex is the only colour field written here.
      const { error } = await supabase
        .from('garments')
        .update({
          title,
          category_id: category.id,
          colour_primary_hex: colourPrimaryHex,
          brand_id: brandId,
        })
        .eq('id', garmentId);

      if (error) throw error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: garmentKeys.all });
    },
  });
}

/**
 * Path B — retailer link (spec §3B). Resolves the URL against the catalogue, and
 * otherwise scrapes Open Graph and JSON-LD Product schema. This path gives
 * near-perfect metadata, so the UI should encourage it over photo capture.
 *
 * The scrape runs in an Edge Function, not on-device: it needs to follow
 * redirects, set an honest user agent, and respect robots.txt (spec §5.1), none
 * of which belong in the client.
 */
export function useImportLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url }: { url: string }) => {
      let parsed: URL;
      try {
        parsed = new URL(url.trim());
      } catch {
        throw new Error('That does not look like a link.');
      }
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Only http and https links are supported.');
      }

      const { data, error } = await supabase.functions.invoke<{ garmentId: string }>(
        'import-link',
        { body: { url: parsed.toString() } },
      );

      if (error) {
        const resource = isFreeTierRejection(error.message);
        if (resource) throw new FreeTierLimitError(resource);
        throw error;
      }
      if (!data) throw new Error('Could not read that product page.');

      return data.garmentId;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: garmentKeys.all });
    },
  });
}
