import { describe, it, expect } from 'vitest';
import {
  costPerWear,
  daysSinceLastWear,
  eligibleForSuggestion,
  underWorn,
  countBySlot,
  palette,
} from '../src/wardrobe';
import { SUGGESTION_PARAMS } from '../src/config';
import type { Garment, LayerSlot, GarmentCondition } from '../src/types';

const TODAY = new Date('2026-08-08T12:00:00Z');

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function garment(
  id: string,
  layerSlot: LayerSlot,
  overrides: Partial<Garment> = {},
): Garment {
  return {
    id,
    title: id,
    categorySlug: id,
    layerSlot,
    colourPrimary: { L: 40, a: 0, b: 0 },
    colourSecondary: null,
    isNeutral: true,
    pattern: 'solid',
    patternScale: null,
    materialMain: 'cotton',
    warmthRating: 2,
    waterproof: false,
    formality: 2,
    condition: 'good',
    inWash: false,
    archivedAt: null,
    ...overrides,
  };
}

describe('costPerWear', () => {
  it('divides price by wears', () => {
    expect(costPerWear(10_000, 4)).toBe(2_500);
  });

  it('treats an unworn garment as costing its full price, not infinity', () => {
    expect(costPerWear(10_000, 0)).toBe(10_000);
  });

  it('returns null when the price is unknown rather than implying it was free', () => {
    expect(costPerWear(null, 10)).toBeNull();
  });

  it('rounds to whole cents', () => {
    expect(costPerWear(10_000, 3)).toBe(3_333);
  });
});

describe('daysSinceLastWear', () => {
  it('returns null for a garment never worn', () => {
    expect(daysSinceLastWear([], 'g1', TODAY)).toBeNull();
  });

  it('uses the most recent wear, not the first in the list', () => {
    const wears = [
      { garmentId: 'g1', wornOn: daysAgo(30) },
      { garmentId: 'g1', wornOn: daysAgo(2) },
      { garmentId: 'g1', wornOn: daysAgo(14) },
    ];
    expect(daysSinceLastWear(wears, 'g1', TODAY)).toBe(2);
  });

  it('ignores other garments wears', () => {
    const wears = [{ garmentId: 'other', wornOn: daysAgo(1) }];
    expect(daysSinceLastWear(wears, 'g1', TODAY)).toBeNull();
  });

  it('returns 0 for something worn today', () => {
    expect(daysSinceLastWear([{ garmentId: 'g1', wornOn: daysAgo(0) }], 'g1', TODAY)).toBe(0);
  });

  it('skips unparseable dates rather than returning NaN', () => {
    const wears = [
      { garmentId: 'g1', wornOn: 'not-a-date' },
      { garmentId: 'g1', wornOn: daysAgo(5) },
    ];
    expect(daysSinceLastWear(wears, 'g1', TODAY)).toBe(5);
  });
});

describe('eligibleForSuggestion', () => {
  const { recentWearExclusionDays } = SUGGESTION_PARAMS;

  it('excludes garments in the wash', () => {
    const g = garment('g1', 'top', { inWash: true });
    expect(eligibleForSuggestion([g], [], TODAY)).toEqual([]);
  });

  it('excludes archived garments', () => {
    const g = garment('g1', 'top', { archivedAt: '2026-01-01T00:00:00Z' });
    expect(eligibleForSuggestion([g], [], TODAY)).toEqual([]);
  });

  it('excludes garments needing repair', () => {
    const g = garment('g1', 'top', { condition: 'needs_repair' as GarmentCondition });
    expect(eligibleForSuggestion([g], [], TODAY)).toEqual([]);
  });

  it('excludes garments worn inside the exclusion window', () => {
    const g = garment('g1', 'top');
    const wears = [{ garmentId: 'g1', wornOn: daysAgo(recentWearExclusionDays) }];
    expect(eligibleForSuggestion([g], wears, TODAY)).toEqual([]);
  });

  it('includes garments worn just outside the window', () => {
    const g = garment('g1', 'top');
    const wears = [{ garmentId: 'g1', wornOn: daysAgo(recentWearExclusionDays + 1) }];
    expect(eligibleForSuggestion([g], wears, TODAY)).toHaveLength(1);
  });

  it('includes never-worn garments', () => {
    expect(eligibleForSuggestion([garment('g1', 'top')], [], TODAY)).toHaveLength(1);
  });

  it('keeps worn-but-not-recent garments in worse condition', () => {
    const g = garment('g1', 'top', { condition: 'worn' });
    expect(eligibleForSuggestion([g], [], TODAY)).toHaveLength(1);
  });
});

describe('underWorn', () => {
  it('includes garments unworn for the novelty window or longer', () => {
    const g = garment('g1', 'top');
    const wears = [{ garmentId: 'g1', wornOn: daysAgo(SUGGESTION_PARAMS.noveltyDays) }];
    expect(underWorn([g], wears, TODAY)).toHaveLength(1);
  });

  it('excludes recently worn garments', () => {
    const g = garment('g1', 'top');
    const wears = [{ garmentId: 'g1', wornOn: daysAgo(3) }];
    expect(underWorn([g], wears, TODAY)).toEqual([]);
  });

  it('includes never-worn garments — those are the point of the row', () => {
    expect(underWorn([garment('g1', 'top')], [], TODAY)).toHaveLength(1);
  });

  it('excludes archived garments', () => {
    const g = garment('g1', 'top', { archivedAt: '2026-01-01T00:00:00Z' });
    expect(underWorn([g], [], TODAY)).toEqual([]);
  });
});

describe('countBySlot', () => {
  it('counts per slot and reports zero for empty slots', () => {
    const counts = countBySlot([
      garment('a', 'top'),
      garment('b', 'top'),
      garment('c', 'shoes'),
    ]);
    expect(counts.top).toBe(2);
    expect(counts.shoes).toBe(1);
    expect(counts.outer).toBe(0);
    expect(counts.full).toBe(0);
  });

  it('excludes archived garments', () => {
    const counts = countBySlot([garment('a', 'top', { archivedAt: '2026-01-01T00:00:00Z' })]);
    expect(counts.top).toBe(0);
  });
});

describe('palette', () => {
  const entry = (hex: string | null, label: string | null, archived = false) => ({
    colourPrimaryHex: hex,
    colourLabel: label,
    archivedAt: archived ? '2026-01-01T00:00:00Z' : null,
  });

  it('groups by colour, most common first', () => {
    const result = palette([
      entry('#1b2430', 'Navy'),
      entry('#1b2430', 'Navy'),
      entry('#8b4513', 'Brown'),
    ]);
    expect(result[0]).toEqual({ hex: '#1b2430', label: 'Navy', count: 2 });
    expect(result[1]?.count).toBe(1);
  });

  it('is case-insensitive about hex', () => {
    const result = palette([entry('#1B2430', 'Navy'), entry('#1b2430', 'Navy')]);
    expect(result).toHaveLength(1);
    expect(result[0]?.count).toBe(2);
  });

  it('always carries a text label, so colour is never the only signal', () => {
    const result = palette([entry('#1b2430', null)]);
    expect(result[0]?.label).toBe('Unnamed colour');
  });

  it('skips garments with no colour and archived garments', () => {
    expect(palette([entry(null, 'Navy'), entry('#1b2430', 'Navy', true)])).toEqual([]);
  });

  it('breaks count ties deterministically', () => {
    const a = palette([entry('#aaaaaa', 'A'), entry('#bbbbbb', 'B')]);
    const b = palette([entry('#bbbbbb', 'B'), entry('#aaaaaa', 'A')]);
    expect(a).toEqual(b);
  });
});
