/**
 * Layer slot rules (spec §4.1).
 *
 * A valid outfit MUST have: (top AND bottom) OR (full), plus shoes.
 * Everything else is optional. `full` occupies top + bottom, so it conflicts
 * with either of them. `accessory` is the only repeatable slot.
 */

import type { Garment, LayerSlot } from './types';

export const LAYER_SLOTS: readonly LayerSlot[] = [
  'base',
  'top',
  'mid',
  'outer',
  'bottom',
  'full',
  'shoes',
  'accessory',
];

/** Display order in the builder, outermost-last, accessories at the end. */
export const BUILDER_SLOT_ORDER: readonly LayerSlot[] = [
  'base',
  'top',
  'mid',
  'outer',
  'full',
  'bottom',
  'shoes',
  'accessory',
];

export const SLOT_LABELS: Record<LayerSlot, string> = {
  base: 'Base layer',
  top: 'Top',
  mid: 'Mid layer',
  outer: 'Outer',
  bottom: 'Bottom',
  full: 'One-piece',
  shoes: 'Shoes',
  accessory: 'Accessories',
};

export const REPEATABLE_SLOTS: ReadonlySet<LayerSlot> = new Set<LayerSlot>(['accessory']);

export function isRepeatable(slot: LayerSlot): boolean {
  return REPEATABLE_SLOTS.has(slot);
}

export type OutfitValidity =
  | { valid: true }
  | { valid: false; missing: LayerSlot[]; conflicts: string[] };

/**
 * Validate an outfit's slot composition.
 *
 * Returns *what* is missing rather than a boolean, because the builder needs to
 * name the empty slots explicitly and show "the missing piece" card (spec §6.2).
 */
export function validateOutfit(items: readonly Garment[]): OutfitValidity {
  const bySlot = new Map<LayerSlot, Garment[]>();
  for (const item of items) {
    const list = bySlot.get(item.layerSlot);
    if (list) list.push(item);
    else bySlot.set(item.layerSlot, [item]);
  }

  const conflicts: string[] = [];
  for (const [slot, list] of bySlot) {
    if (list.length > 1 && !isRepeatable(slot)) {
      conflicts.push(`${SLOT_LABELS[slot]} has ${list.length} items but holds one`);
    }
  }

  const hasFull = bySlot.has('full');
  const hasTop = bySlot.has('top');
  const hasBottom = bySlot.has('bottom');
  const hasShoes = bySlot.has('shoes');

  if (hasFull && (hasTop || hasBottom)) {
    conflicts.push('A one-piece already covers the top and bottom slots');
  }

  const missing: LayerSlot[] = [];
  if (!hasFull) {
    if (!hasTop) missing.push('top');
    if (!hasBottom) missing.push('bottom');
  }
  if (!hasShoes) missing.push('shoes');

  if (missing.length === 0 && conflicts.length === 0) return { valid: true };
  return { valid: false, missing, conflicts };
}

/** Slots that could still be filled without creating a conflict. */
export function fillableSlots(items: readonly Garment[]): LayerSlot[] {
  const filled = new Set(items.map((i) => i.layerSlot));
  const hasFull = filled.has('full');
  const hasTopOrBottom = filled.has('top') || filled.has('bottom');

  return LAYER_SLOTS.filter((slot) => {
    if (slot === 'accessory') return true;
    if (filled.has(slot)) return false;
    if (slot === 'full') return !hasTopOrBottom;
    if ((slot === 'top' || slot === 'bottom') && hasFull) return false;
    return true;
  });
}

/**
 * Whether a garment can be added to an outfit as-is. Swapping within an occupied
 * non-repeatable slot is a replace, not an add — that's the builder's job, and
 * it calls this with the outgoing garment already removed.
 */
export function canAdd(items: readonly Garment[], candidate: Garment): boolean {
  return fillableSlots(items).includes(candidate.layerSlot);
}
