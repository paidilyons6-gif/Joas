/**
 * Colour maths for intake and the coherence scorer.
 *
 * Everything downstream works in CIELAB (spec §4.2). Garments store their Lab
 * triple at import time rather than converting on every comparison — the scorer
 * has a 50ms budget for a whole outfit and sRGB→Lab is not free.
 *
 * ΔE is CIEDE2000, not CIE76. This matters specifically for the case the spec
 * calls out: two browns fighting. CIE76 badly overstates distance in the
 * saturated warm region, so the "small but non-zero ΔE" near-miss band would
 * catch pairs that actually look fine and miss pairs that don't.
 */

import type { Lab } from './types';
import { COLOUR_THRESHOLDS } from './config';

const D65 = { X: 95.047, Y: 100.0, Z: 108.883 } as const;

/** `#rrggbb` (case-insensitive, `#` optional) → sRGB 0–255. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`not a 6-digit hex colour: ${hex}`);
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** sRGB 0–255 → CIELAB, D65 white point. */
export function rgbToLab({ r, g, b }: { r: number; g: number; b: number }): Lab {
  // Undo the sRGB transfer function.
  const linear = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rl = linear(r);
  const gl = linear(g);
  const bl = linear(b);

  // Linear sRGB → XYZ (D65), scaled to 0–100.
  const X = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) * 100;
  const Y = (0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl) * 100;
  const Z = (0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl) * 100;

  const f = (t: number): number =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(X / D65.X);
  const fy = f(Y / D65.Y);
  const fz = f(Z / D65.Z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function hexToLab(hex: string): Lab {
  return rgbToLab(hexToRgb(hex));
}

/** Chroma C* — distance from the neutral axis. */
export function chroma({ a, b }: Lab): number {
  return Math.sqrt(a * a + b * b);
}

/** Hue angle h°, 0–360. Meaningless for near-neutrals; guard with `isNeutral`. */
export function hueAngle({ a, b }: Lab): number {
  const deg = (Math.atan2(b, a) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}

/**
 * Neutrals are always-compatible in the scorer, so this predicate decides
 * whether a garment participates in hue-relation scoring at all. Low chroma is
 * the test — black, white, grey, navy-so-dark-it-reads-as-black, and most
 * true beiges land below the threshold.
 */
export function isNeutral(lab: Lab): boolean {
  return chroma(lab) <= COLOUR_THRESHOLDS.neutralChromaMax;
}

/** Smallest angle between two hues, 0–180. */
export function hueDifference(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * CIEDE2000 colour difference.
 *
 * Implemented from Sharma, Wu & Dalal (2005), whose paper is also the source of
 * the standard test vectors in colour.test.ts. Note the `h` values are handled
 * in degrees throughout, with the wrap-around cases spelled out rather than
 * folded into a modulo — those cases are exactly where naive implementations
 * disagree with the reference data.
 */
export function deltaE2000(lab1: Lab, lab2: Lab, weights = { kL: 1, kC: 1, kH: 1 }): number {
  const { kL, kC, kH } = weights;

  const C1 = chroma(lab1);
  const C2 = chroma(lab2);
  const Cbar = (C1 + C2) / 2;

  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));

  const a1p = (1 + G) * lab1.a;
  const a2p = (1 + G) * lab2.a;

  const C1p = Math.sqrt(a1p * a1p + lab1.b * lab1.b);
  const C2p = Math.sqrt(a2p * a2p + lab2.b * lab2.b);

  const hp = (ap: number, b: number): number => {
    if (ap === 0 && b === 0) return 0;
    const deg = (Math.atan2(b, ap) * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
  };
  const h1p = hp(a1p, lab1.b);
  const h2p = hp(a2p, lab2.b);

  const dLp = lab2.L - lab1.L;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);

  const Lbarp = (lab1.L + lab2.L) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp: number;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hbarp = (h1p + h2p + 360) / 2;
  } else {
    hbarp = (h1p + h2p - 360) / 2;
  }

  const rad = (deg: number) => (deg * Math.PI) / 180;
  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.2 * Math.cos(rad(4 * hbarp - 63));

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
  const RT = -RC * Math.sin(rad(2 * dTheta));

  const Lbarp50 = Math.pow(Lbarp - 50, 2);
  const SL = 1 + (0.015 * Lbarp50) / Math.sqrt(20 + Lbarp50);
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;

  const termL = dLp / (kL * SL);
  const termC = dCp / (kC * SC);
  const termH = dHp / (kH * SH);

  return Math.sqrt(
    termL * termL + termC * termC + termH * termH + RT * termC * termH,
  );
}

export type ColourRelation =
  | 'neutral'        // at least one item is a neutral: always compatible
  | 'monochrome'     // same hue, differing lightness/chroma
  | 'analogous'      // adjacent hues
  | 'complementary'  // opposing hues
  | 'near-miss'      // small but non-zero ΔE — the "two browns fighting" case
  | 'clash';         // unrelated hues

/**
 * Classify the relationship between two garment colours.
 *
 * Order matters: `near-miss` is checked before the hue relations, because two
 * browns a few ΔE apart *are* technically monochrome, and calling them
 * monochrome is precisely the mistake that makes an outfit look accidental.
 */
export function classifyColourRelation(lab1: Lab, lab2: Lab): ColourRelation {
  if (isNeutral(lab1) || isNeutral(lab2)) return 'neutral';

  const dE = deltaE2000(lab1, lab2);
  const { nearMissDeltaEMin, nearMissDeltaEMax } = COLOUR_THRESHOLDS;
  if (dE > nearMissDeltaEMin && dE < nearMissDeltaEMax) return 'near-miss';

  const dH = hueDifference(hueAngle(lab1), hueAngle(lab2));
  if (dH <= COLOUR_THRESHOLDS.monochromeHueDeg) return 'monochrome';
  if (dH <= COLOUR_THRESHOLDS.analogousHueDeg) return 'analogous';
  if (dH >= COLOUR_THRESHOLDS.complementaryHueDeg) return 'complementary';
  return 'clash';
}

/** Serialisation helpers for the `real[3]` columns. */
export function labToArray(lab: Lab): [number, number, number] {
  return [lab.L, lab.a, lab.b];
}

export function labFromArray(arr: readonly number[] | null): Lab | null {
  if (!arr || arr.length !== 3) return null;
  const [L, a, b] = arr;
  if (typeof L !== 'number' || !Number.isFinite(L)) return null;
  if (typeof a !== 'number' || !Number.isFinite(a)) return null;
  if (typeof b !== 'number' || !Number.isFinite(b)) return null;
  return { L, a, b };
}
