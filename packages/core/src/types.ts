/**
 * Domain types shared by the app, the Edge Functions and the tests.
 *
 * These are hand-written rather than generated from the database because they
 * are the *domain* shape, not the row shape: the scorer wants `Lab` triples and
 * a resolved `layerSlot`, not nullable columns and a `category_id`. Row types
 * come from `supabase gen types` into `database.types.ts` and are mapped at the
 * query boundary.
 */

export type LayerSlot =
  | 'base'
  | 'top'
  | 'mid'
  | 'outer'
  | 'bottom'
  | 'full'
  | 'shoes'
  | 'accessory';

export type GarmentSource = 'photo' | 'link' | 'manual' | 'order_email';
export type GarmentCondition = 'new' | 'good' | 'worn' | 'needs_repair';
export type PatternScale = 'small' | 'medium' | 'large';

/** CIELAB: L* 0–100, a* and b* roughly -128–127. */
export interface Lab {
  L: number;
  a: number;
  b: number;
}

/** Formality, 1 casual … 5 formal. */
export type Formality = 1 | 2 | 3 | 4 | 5;

/**
 * A garment as the scorer and builder see it. Deliberately narrower than the
 * table: no image paths, no purchase data, nothing the scoring rules don't read.
 */
export interface Garment {
  id: string;
  title: string;
  categorySlug: string;
  layerSlot: LayerSlot;
  colourPrimary: Lab | null;
  colourSecondary: Lab | null;
  isNeutral: boolean;
  pattern: string;
  patternScale: PatternScale | null;
  materialMain: string | null;
  /** 0 (none) … 5 (arctic). */
  warmthRating: number;
  waterproof: boolean;
  formality: Formality;
  condition: GarmentCondition;
  inWash: boolean;
  archivedAt: string | null;
}

/** An outfit under construction or being scored. */
export interface OutfitDraft {
  items: Garment[];
}

export interface WeatherContext {
  temperatureC: number;
  /** 0–1. */
  precipitationProbability: number;
  windKph: number;
}

/**
 * A coherence score always travels with its explanation. The API makes it
 * impossible to return one without the other, because a bare number is useless
 * and untrustworthy (spec §4.2).
 */
export interface CoherenceScore {
  /** 0–100. */
  score: number;
  /** One line, derived from the lowest-scoring component. */
  reason: string;
  components: CoherenceComponent[];
}

export interface CoherenceComponent {
  name: 'colourHarmony' | 'formalitySpread' | 'warmthFit' | 'patternLoad' | 'proportionMaterial';
  /** 0–1, before weighting. */
  ratio: number;
  weight: number;
  /** Whether this component was evaluated at all — warmth needs a forecast. */
  applied: boolean;
  explanation: string;
}
