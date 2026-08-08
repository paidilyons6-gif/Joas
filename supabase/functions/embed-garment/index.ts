/**
 * embed-garment — background removal, 512-dim image embedding, and automatic
 * classification for one imported photo (spec §3 path A).
 *
 * Embeddings run server-side (§10 decision 3). Consequences the client must
 * honour and this function must not undermine:
 *
 *   * The photo is already in the private `garments` bucket before this is
 *     called. This function reads it with the caller's own token, so RLS and the
 *     storage policies still apply — a user cannot embed someone else's image.
 *   * Nothing is written to `garments` here except the embedding and the
 *     *guesses*. The user confirms on a single card (spec §3 step 4); this
 *     function never silently sets a field the user then has to discover.
 *
 * Vectors are L2-normalised before storage. The HNSW indexes in migration 0005
 * are built with `vector_cosine_ops` on the assumption that they are — if this
 * stops normalising, similarity search quietly returns the wrong neighbours.
 */

import { authenticate, AuthError } from '../_shared/auth.ts';
import { preflight, json } from '../_shared/cors.ts';

const EMBEDDING_DIMENSIONS = 512;

/**
 * The classifier's minimum confidence before a guess is offered as
 * pre-selected. Mirrors INTAKE.classificationConfidenceMin in
 * packages/core/src/config.ts.
 */
const CLASSIFICATION_CONFIDENCE_MIN = 0.55;

interface EmbedRequest {
  garmentId: string;
  /** Object key in the `garments` bucket: `<uid>/<garment_id>/original.webp`. */
  imagePath: string;
  /** Skip background removal when the client already did it on-device. */
  backgroundRemoved?: boolean;
}

interface Classification {
  categorySlug: string | null;
  categoryConfidence: number;
  colourPrimaryHex: string | null;
  colourSecondaryHex: string | null;
  pattern: string;
  materialMain: string | null;
  brandId: string | null;
  brandName: string | null;
}

function parseRequest(body: unknown): EmbedRequest {
  if (typeof body !== 'object' || body === null) {
    throw new AuthError('body must be an object', 400);
  }
  const { garmentId, imagePath, backgroundRemoved } = body as Record<string, unknown>;

  if (typeof garmentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(garmentId)) {
    throw new AuthError('garmentId must be a uuid', 400);
  }
  if (typeof imagePath !== 'string' || imagePath.length === 0) {
    throw new AuthError('imagePath is required', 400);
  }
  // Traversal guard. The storage policies already scope reads to the caller's
  // uid prefix, but a `..` segment should never reach them in the first place.
  if (imagePath.includes('..')) {
    throw new AuthError('imagePath must not contain ..', 400);
  }

  return {
    garmentId,
    imagePath,
    backgroundRemoved: backgroundRemoved === true,
  };
}

/** L2-normalise, so cosine distance is a dot product and the HNSW index is valid. */
function normalise(vector: number[]): number[] {
  let sumSquares = 0;
  for (const v of vector) sumSquares += v * v;
  const magnitude = Math.sqrt(sumSquares);
  // A zero vector cannot be normalised. It means the model returned nothing
  // useful, which is a failure to surface rather than a vector to store.
  if (magnitude === 0 || !Number.isFinite(magnitude)) {
    throw new Error('embedding model returned a zero or non-finite vector');
  }
  return vector.map((v) => v / magnitude);
}

/**
 * Call the hosted image-embedding model.
 *
 * Kept behind an env-configured endpoint rather than a hard-coded provider: the
 * model choice is a tuning decision, and swapping it means re-embedding the
 * whole catalogue, so it needs to be a config change and not a code change.
 * `RAIL_EMBEDDING_MODEL` is recorded on the row so a future migration can tell
 * which vectors need recomputing.
 */
async function embedImage(imageBytes: Uint8Array): Promise<number[]> {
  const endpoint = Deno.env.get('RAIL_EMBEDDING_ENDPOINT');
  const apiKey = Deno.env.get('RAIL_EMBEDDING_API_KEY');
  if (!endpoint || !apiKey) {
    throw new Error('embedding endpoint is not configured');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBytes,
  });

  if (!response.ok) {
    throw new Error(`embedding request failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { embedding?: unknown };
  const embedding = payload.embedding;

  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `expected a ${EMBEDDING_DIMENSIONS}-dim embedding, got ${
        Array.isArray(embedding) ? embedding.length : typeof embedding
      }`,
    );
  }
  if (!embedding.every((v): v is number => typeof v === 'number' && Number.isFinite(v))) {
    throw new Error('embedding contains non-finite values');
  }

  return normalise(embedding);
}

/**
 * Remove the garment's background.
 *
 * Falls back to the original image rather than failing the import: a garment
 * with a background is worth having, and blocking intake on a cosmetic step
 * would break the 15-second budget that decides whether the app survives
 * onboarding (spec §3).
 */
async function removeBackground(imageBytes: Uint8Array): Promise<Uint8Array> {
  const endpoint = Deno.env.get('RAIL_BG_REMOVAL_ENDPOINT');
  const apiKey = Deno.env.get('RAIL_BG_REMOVAL_API_KEY');
  if (!endpoint || !apiKey) return imageBytes;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBytes,
    });
    if (!response.ok) return imageBytes;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return imageBytes;
  }
}

/**
 * Classify by nearest neighbour against the products catalogue (spec §3 step 3).
 *
 * With no affiliate feed approved (§10 decision 1) the catalogue holds only the
 * fixture products, so this will usually find nothing and return nulls. That is
 * the honest outcome: the confirmation card shows an unprefilled category rather
 * than a confident guess drawn from ten fixture rows.
 */
async function classify(
  db: import('jsr:@supabase/supabase-js@2').SupabaseClient,
  embedding: number[],
): Promise<Classification> {
  const empty: Classification = {
    categorySlug: null,
    categoryConfidence: 0,
    colourPrimaryHex: null,
    colourSecondaryHex: null,
    pattern: 'solid',
    materialMain: null,
    brandId: null,
    brandName: null,
  };

  const { data, error } = await db.rpc('match_products_by_embedding', {
    query_embedding: embedding,
    match_count: 5,
  });

  if (error) {
    // Classification is best-effort; the embedding is the part that matters.
    console.error('classification lookup failed', error.message);
    return empty;
  }

  const matches = (data ?? []) as Array<{
    similarity: number;
    category_slug: string | null;
    colour: string | null;
    material: string | null;
    brand_id: string | null;
    brand_name: string | null;
  }>;

  const best = matches[0];
  if (!best || best.similarity < CLASSIFICATION_CONFIDENCE_MIN) return empty;

  return {
    categorySlug: best.category_slug,
    categoryConfidence: best.similarity,
    // The catalogue stores colour names, not hex. Dominant-colour extraction
    // from the cut-out is a separate step and is not implemented yet — see the
    // TODO in docs/MILESTONES.md rather than guessing a hex here.
    colourPrimaryHex: null,
    colourSecondaryHex: null,
    pattern: 'solid',
    materialMain: best.material,
    brandId: best.brand_id,
    brandName: best.brand_name,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  const early = preflight(req);
  if (early) return early;

  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405, origin);
  }

  try {
    const caller = await authenticate(req);
    const { garmentId, imagePath, backgroundRemoved } = parseRequest(await req.json());

    // Read through the caller's client: the storage policy scopes this to their
    // own `<uid>/` prefix, so an imagePath belonging to another user 404s here.
    const download = await caller.db.storage.from('garments').download(imagePath);
    if (download.error || !download.data) {
      return json({ error: 'image not found' }, 404, origin);
    }

    const original = new Uint8Array(await download.data.arrayBuffer());
    const prepared = backgroundRemoved ? original : await removeBackground(original);

    // Store the cut-out alongside the original. The original is kept because
    // background removal is not reversible and a bad cut-out would otherwise
    // mean re-photographing the garment.
    let cutoutPath: string | null = null;
    if (prepared !== original) {
      cutoutPath = imagePath.replace(/\/original(\.\w+)?$/, '/cutout.png');
      if (cutoutPath === imagePath) cutoutPath = `${imagePath}.cutout.png`;

      const upload = await caller.db.storage
        .from('garments')
        .upload(cutoutPath, prepared, { contentType: 'image/png', upsert: true });
      if (upload.error) {
        console.error('cutout upload failed', upload.error.message);
        cutoutPath = null;
      }
    }

    const embedding = await embedImage(prepared);
    const classification = await classify(caller.db, embedding);

    // Write only the embedding and the image path. The guesses go back to the
    // client for the confirmation card — the user's tap is what commits them.
    const { error: updateError } = await caller.db
      .from('garments')
      .update({
        image_embedding: embedding,
        image_path: cutoutPath ?? imagePath,
      })
      .eq('id', garmentId)
      .eq('user_id', caller.userId);

    if (updateError) {
      return json({ error: `could not store embedding: ${updateError.message}` }, 500, origin);
    }

    return json(
      {
        garmentId,
        imagePath: cutoutPath ?? imagePath,
        backgroundRemoved: cutoutPath !== null,
        embeddingModel: Deno.env.get('RAIL_EMBEDDING_MODEL') ?? 'unknown',
        classification,
      },
      200,
      origin,
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status, origin);
    }
    console.error('embed-garment failed', error);
    return json({ error: 'internal error' }, 500, origin);
  }
});
