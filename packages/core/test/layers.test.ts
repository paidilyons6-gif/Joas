import { describe, it, expect } from 'vitest';
import { validateOutfit, fillableSlots, canAdd, isRepeatable } from '../src/layers';
import type { Garment, LayerSlot } from '../src/types';

function garment(id: string, layerSlot: LayerSlot): Garment {
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
  };
}

describe('validateOutfit', () => {
  it('accepts top + bottom + shoes', () => {
    const result = validateOutfit([garment('t', 'top'), garment('b', 'bottom'), garment('s', 'shoes')]);
    expect(result.valid).toBe(true);
  });

  it('accepts a one-piece + shoes', () => {
    const result = validateOutfit([garment('f', 'full'), garment('s', 'shoes')]);
    expect(result.valid).toBe(true);
  });

  it('rejects an outfit with no shoes and names the missing slot', () => {
    const result = validateOutfit([garment('t', 'top'), garment('b', 'bottom')]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.missing).toEqual(['shoes']);
  });

  it('reports every missing slot, not just the first', () => {
    const result = validateOutfit([garment('m', 'mid')]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.missing.sort()).toEqual(['bottom', 'shoes', 'top']);
  });

  it('does not ask for a top or bottom when a one-piece is present', () => {
    const result = validateOutfit([garment('f', 'full')]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.missing).toEqual(['shoes']);
  });

  it('flags a one-piece worn with a top as a conflict', () => {
    const result = validateOutfit([garment('f', 'full'), garment('t', 'top'), garment('s', 'shoes')]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.conflicts).toHaveLength(1);
  });

  it('flags two garments in a single-occupancy slot', () => {
    const result = validateOutfit([
      garment('t1', 'top'),
      garment('t2', 'top'),
      garment('b', 'bottom'),
      garment('s', 'shoes'),
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.conflicts[0]).toMatch(/Top/);
  });

  it('allows several accessories', () => {
    const result = validateOutfit([
      garment('t', 'top'),
      garment('b', 'bottom'),
      garment('s', 'shoes'),
      garment('belt', 'accessory'),
      garment('watch', 'accessory'),
      garment('cap', 'accessory'),
    ]);
    expect(result.valid).toBe(true);
  });

  it('treats optional layers as optional', () => {
    const result = validateOutfit([
      garment('base', 'base'),
      garment('t', 'top'),
      garment('m', 'mid'),
      garment('o', 'outer'),
      garment('b', 'bottom'),
      garment('s', 'shoes'),
    ]);
    expect(result.valid).toBe(true);
  });

  it('rejects an empty outfit', () => {
    const result = validateOutfit([]);
    expect(result.valid).toBe(false);
  });
});

describe('isRepeatable', () => {
  it('is true only for accessories', () => {
    expect(isRepeatable('accessory')).toBe(true);
    for (const slot of ['base', 'top', 'mid', 'outer', 'bottom', 'full', 'shoes'] as LayerSlot[]) {
      expect(isRepeatable(slot), slot).toBe(false);
    }
  });
});

describe('fillableSlots', () => {
  it('offers everything for an empty outfit', () => {
    expect(fillableSlots([])).toContain('full');
    expect(fillableSlots([])).toContain('top');
  });

  it('withdraws `full` once a top or bottom is chosen', () => {
    expect(fillableSlots([garment('t', 'top')])).not.toContain('full');
    expect(fillableSlots([garment('b', 'bottom')])).not.toContain('full');
  });

  it('withdraws top and bottom once a one-piece is chosen', () => {
    const slots = fillableSlots([garment('f', 'full')]);
    expect(slots).not.toContain('top');
    expect(slots).not.toContain('bottom');
    expect(slots).toContain('outer');
  });

  it('keeps accessories fillable no matter how many are present', () => {
    const items = [garment('a1', 'accessory'), garment('a2', 'accessory')];
    expect(fillableSlots(items)).toContain('accessory');
  });

  it('withdraws an occupied single-occupancy slot', () => {
    expect(fillableSlots([garment('s', 'shoes')])).not.toContain('shoes');
  });
});

describe('canAdd', () => {
  it('refuses a second garment in an occupied slot', () => {
    expect(canAdd([garment('t1', 'top')], garment('t2', 'top'))).toBe(false);
  });

  it('refuses a one-piece over an existing bottom', () => {
    expect(canAdd([garment('b', 'bottom')], garment('f', 'full'))).toBe(false);
  });

  it('allows an outer layer over a top', () => {
    expect(canAdd([garment('t', 'top')], garment('o', 'outer'))).toBe(true);
  });
});
