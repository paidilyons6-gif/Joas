/**
 * Every tunable weight, threshold and cadence in the product, in one place
 * (spec §11). Nothing outside this file should contain a magic number that
 * affects scoring, suggestions, alerting, or tier limits.
 *
 * These are the *baked-in defaults*. The scorer must work offline and on first
 * launch, so it cannot depend on fetching config. At runtime the values in the
 * `scoring_config` table override these when reachable — see `resolveConfig`.
 * Precedence: remote row > baked-in default.
 *
 * If you change a value here that also appears in a migration
 * (free-tier limits, scoring_config seed rows), change it in both places.
 */

// ── Coherence scoring (spec §4.2) ────────────────────────────────────────────

/** Component weights. MUST sum to 100 — asserted below. */
export const COHERENCE_WEIGHTS = {
  colourHarmony: 30,
  formalitySpread: 25,
  warmthFit: 20,
  patternLoad: 15,
  proportionMaterial: 10,
} as const;

export const COLOUR_THRESHOLDS = {
  /**
   * The "two browns fighting" band. A ΔE inside [min, max] between two
   * chromatic items is a near-miss and penalised *harder* than an outright
   * clash, because users notice it more (spec §4.2).
   */
  nearMissDeltaEMin: 2.0,
  nearMissDeltaEMax: 18.0,
  /** Hue-angle windows, in degrees, for the harmony relations. */
  monochromeHueDeg: 12,
  analogousHueDeg: 45,
  complementaryHueDeg: 150,
  /** Below this CIELAB chroma an item is a neutral: always-compatible. */
  neutralChromaMax: 12,
} as const;

export const FORMALITY_SPREAD = {
  /** Spread of 0–1 across the outfit scores full marks. */
  freeSpread: 1,
  /** Spread of >= this is the heavy penalty. */
  heavyPenaltySpread: 3,
} as const;

export const PATTERN_LOAD = {
  /** One patterned item is fine. */
  freeCount: 1,
  /** Two is a penalty unless one is a small-scale neutral. */
  twoPatternPenalty: 0.45,
  /** Three or more is heavy. */
  heavyPenalty: 0.85,
} as const;

// ── Weather and warmth (spec §4.3) ───────────────────────────────────────────

export type TemperatureBand = 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';

/** Upper bound in °C for each band; the last band catches everything above. */
export const TEMPERATURE_BANDS: ReadonlyArray<{ band: TemperatureBand; maxC: number }> = [
  { band: 'freezing', maxC: 2 },
  { band: 'cold', maxC: 9 },
  { band: 'cool', maxC: 15 },
  { band: 'mild', maxC: 20 },
  { band: 'warm', maxC: 26 },
  { band: 'hot', maxC: Number.POSITIVE_INFINITY },
];

/** Target sum of `warmth_rating` across an outfit, per band. */
export const WARMTH_TARGETS: Record<TemperatureBand, number> = {
  freezing: 11,
  cold: 9,
  cool: 7,
  mild: 5,
  warm: 3,
  hot: 2,
};

/** Above this precipitation probability, suggestions prefer waterproof outer. */
export const PRECIPITATION_PROBABILITY_THRESHOLD = 0.4;

// ── Daily suggestions (spec §4.3) ────────────────────────────────────────────

export const SUGGESTION_PARAMS = {
  /** Exclude garments worn within this many days. */
  recentWearExclusionDays: 2,
  /** A garment unworn for this long earns the novelty boost. */
  noveltyDays: 30,
  noveltyBoost: 6,
  /** Matching a saved outfit the user kept earns the proven boost. */
  provenBoost: 8,
  /** Beam search cap. Not brute force — prune early on colour and formality. */
  maxCandidates: 3000,
  /** Two or three, never a grid of twenty. */
  resultsReturned: 3,
  /** Beam width per layer slot during candidate generation. */
  beamWidth: 12,
} as const;

/** Near-zero coverage for a slot/band pair is a gap (spec §4.4). */
export const GAP_ANALYSIS = {
  coverageGapThreshold: 3,
  /** A watched product this similar to something owned triggers the redundancy warning. */
  redundancyDeltaEMax: 10,
  redundancyWarmthBandTolerance: 1,
} as const;

// ── Price tracking and alerts (spec §5.3) ────────────────────────────────────

export const PRICE_THRESHOLDS = {
  /**
   * An all-time low claim needs at least this much history. With less, the app
   * says "12-month low unknown" rather than lying.
   */
  allTimeLowMinHistoryDays: 30,
  /** Never alert twice on the same watch within this window. */
  alertDedupeHours: 48,
  defaultDailyAlertCap: 3,
  /** A sale-ending alert fires this long before the end. */
  saleEndingLeadHours: 24,
} as const;

/** Check cadence in hours, by tier (spec §5.3). */
export const CHECK_CADENCE_HOURS = {
  watched: 4, // "every 2–6 hours"
  catalogue: 24,
  longTail: 168,
} as const;

// ── Product resolution (spec §5.2) ───────────────────────────────────────────

export const RESOLUTION_THRESHOLDS = {
  /** Trigram similarity on brand + normalised title. */
  titleSimilarityMin: 0.62,
  /** Cosine similarity on image embeddings. */
  imageSimilarityMin: 0.93,
  /**
   * Below this combined confidence, keep the products separate. Merging two
   * different products produces nonsense price history — the most damaging bug
   * class in the app, so this threshold errs high on purpose.
   */
  mergeConfidenceMin: 0.85,
} as const;

// ── Wardrobe intake (spec §3) ────────────────────────────────────────────────

export const INTAKE = {
  embeddingDimensions: 512,
  /** Longest edge, px, for the upload after client-side resize. */
  uploadMaxEdgePx: 1600,
  /** Confidence below which the confirmation card pre-selects nothing. */
  classificationConfidenceMin: 0.55,
  /** Images per background-removal/embedding batch during bulk import. */
  bulkBatchSize: 8,
} as const;

// ── Entitlements (spec §6.8, §10 decision 5) ──────────────────────────────────

/**
 * Free tier is a permanent 20-garment cap, not a time limit.
 * MIRRORED in migration 0007 `free_tier_limit()` — change both together.
 */
export const ENTITLEMENTS = {
  free: {
    garments: 20,
    outfits: 3,
    watches: 5,
    /** Free-tier alerts are next-day, not instant. */
    alertDelayHours: 24,
    gapAnalysis: false,
  },
  rail_full: {
    garments: Number.POSITIVE_INFINITY,
    outfits: Number.POSITIVE_INFINITY,
    watches: Number.POSITIVE_INFINITY,
    alertDelayHours: 0,
    gapAnalysis: true,
  },
} as const;

export const REVENUECAT_ENTITLEMENT_ID = 'rail_full';

/** Shown on the paywall itself, as App Store review requires (spec §7). */
export const PRICING = {
  monthly: { priceLabel: '€4.99', period: 'month' },
  annual: { priceLabel: '€39', period: 'year' },
  trialDays: 7,
} as const;

// ── Performance budgets (spec §7) ────────────────────────────────────────────

/** Asserted in tests, not just documented — a budget nobody measures is a wish. */
export const PERFORMANCE_BUDGETS = {
  outfitScoreMs: 50,
  todayScreenFromCacheMs: 400,
  coldStartToInteractiveMs: 2000,
} as const;

// ── Remote override ──────────────────────────────────────────────────────────

export type ScoringConfigKey =
  | 'coherence_weights'
  | 'colour_thresholds'
  | 'warmth_targets'
  | 'suggestion_params'
  | 'price_thresholds';

/**
 * Merge a `scoring_config` row over a baked-in default. Shallow by design: the
 * config objects are flat, and a deep merge would make a partial remote row
 * able to half-replace a nested structure in ways nobody can reason about.
 *
 * Unknown keys in the remote value are ignored rather than passed through, so a
 * typo in the config table cannot inject a field the scorer then reads as NaN.
 */
export function resolveConfig<T extends Record<string, number | boolean>>(
  base: T,
  remote: unknown,
): T {
  if (remote === null || typeof remote !== 'object' || Array.isArray(remote)) return base;

  const out = { ...base };
  for (const [key, value] of Object.entries(remote as Record<string, unknown>)) {
    if (!(key in base)) continue;
    if (typeof value !== typeof base[key as keyof T]) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    out[key as keyof T] = value as T[keyof T];
  }
  return out;
}

// A miscounted weight silently rescales every score, and the symptom is
// "suggestions feel a bit off" — which nobody can debug. Fail at import instead.
const weightSum = Object.values(COHERENCE_WEIGHTS).reduce((a, b) => a + b, 0);
if (weightSum !== 100) {
  throw new Error(`COHERENCE_WEIGHTS must sum to 100, got ${weightSum}`);
}
