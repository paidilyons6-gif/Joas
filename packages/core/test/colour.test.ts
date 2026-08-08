import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  hexToLab,
  rgbToLab,
  chroma,
  hueAngle,
  hueDifference,
  isNeutral,
  deltaE2000,
  classifyColourRelation,
  labToArray,
  labFromArray,
} from '../src/colour';
import { COLOUR_THRESHOLDS } from '../src/config';

describe('hex parsing', () => {
  it('parses with and without the leading hash', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb('ff8000')).toEqual({ r: 255, g: 128, b: 0 });
  });

  it('is case-insensitive', () => {
    expect(hexToRgb('#AABBCC')).toEqual(hexToRgb('#aabbcc'));
  });

  it('rejects anything that is not 6 hex digits', () => {
    expect(() => hexToRgb('#fff')).toThrow();
    expect(() => hexToRgb('#gggggg')).toThrow();
    expect(() => hexToRgb('')).toThrow();
  });

  it('round-trips through rgbToHex', () => {
    for (const hex of ['#000000', '#ffffff', '#1a2b3c', '#7f7f7f']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });

  it('clamps out-of-range channels rather than emitting invalid hex', () => {
    expect(rgbToHex({ r: -20, g: 300, b: 128 })).toBe('#00ff80');
  });
});

describe('rgbToLab', () => {
  // Reference values for sRGB primaries under D65, from the standard conversion.
  it('maps black and white to the ends of the L* axis', () => {
    const black = rgbToLab({ r: 0, g: 0, b: 0 });
    expect(black.L).toBeCloseTo(0, 4);
    expect(chroma(black)).toBeCloseTo(0, 4);

    const white = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(white.L).toBeCloseTo(100, 3);
    expect(chroma(white)).toBeCloseTo(0, 2);
  });

  it('matches known Lab values for the sRGB primaries', () => {
    const red = rgbToLab({ r: 255, g: 0, b: 0 });
    expect(red.L).toBeCloseTo(53.24, 1);
    expect(red.a).toBeCloseTo(80.09, 1);
    expect(red.b).toBeCloseTo(67.2, 1);

    const green = rgbToLab({ r: 0, g: 255, b: 0 });
    expect(green.L).toBeCloseTo(87.73, 1);
    expect(green.a).toBeCloseTo(-86.18, 1);
    expect(green.b).toBeCloseTo(83.18, 1);

    const blue = rgbToLab({ r: 0, g: 0, b: 255 });
    expect(blue.L).toBeCloseTo(32.3, 1);
    expect(blue.a).toBeCloseTo(79.19, 1);
    expect(blue.b).toBeCloseTo(-107.86, 1);
  });

  it('keeps mid-grey on the neutral axis', () => {
    const grey = rgbToLab({ r: 128, g: 128, b: 128 });
    expect(chroma(grey)).toBeLessThan(0.5);
    expect(grey.L).toBeCloseTo(53.59, 1);
  });
});

describe('deltaE2000', () => {
  it('is zero for identical colours', () => {
    const lab = hexToLab('#3c6e47');
    expect(deltaE2000(lab, lab)).toBe(0);
  });

  it('is symmetric', () => {
    const a = hexToLab('#8b4513');
    const b = hexToLab('#a0522d');
    expect(deltaE2000(a, b)).toBeCloseTo(deltaE2000(b, a), 10);
  });

  /**
   * Sharma, Wu & Dalal (2005) test vectors. These are the cases that catch the
   * hue wrap-around and the RT rotation term — the two places CIEDE2000
   * implementations usually go wrong, and both are silent failures.
   */
  const sharmaVectors: Array<[[number, number, number], [number, number, number], number]> = [
    [[50.0, 2.6772, -79.7751], [50.0, 0.0, -82.7485], 2.0425],
    [[50.0, 3.1571, -77.2803], [50.0, 0.0, -82.7485], 2.8615],
    [[50.0, 2.8361, -74.02], [50.0, 0.0, -82.7485], 3.4412],
    [[50.0, -1.3802, -84.2814], [50.0, 0.0, -82.7485], 1.0],
    [[50.0, -1.1848, -84.8006], [50.0, 0.0, -82.7485], 1.0],
    [[50.0, -0.9009, -85.5211], [50.0, 0.0, -82.7485], 1.0],
    [[50.0, 0.0, 0.0], [50.0, -1.0, 2.0], 2.3669],
    [[50.0, -1.0, 2.0], [50.0, 0.0, 0.0], 2.3669],
    [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0009], 7.1792],
    [[50.0, 2.49, -0.001], [50.0, -2.49, 0.001], 7.1792],
    [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0011], 7.2195],
    [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0012], 7.2195],
    [[50.0, -0.001, 2.49], [50.0, 0.0009, -2.49], 4.8045],
    [[50.0, 2.5, 0.0], [50.0, 0.0, -2.5], 4.3065],
    [[50.0, 2.5, 0.0], [73.0, 25.0, -18.0], 27.1492],
    [[50.0, 2.5, 0.0], [61.0, -5.0, 29.0], 22.8977],
    [[50.0, 2.5, 0.0], [56.0, -27.0, -3.0], 31.903],
    [[50.0, 2.5, 0.0], [58.0, 24.0, 15.0], 19.4535],
    [[50.0, 2.5, 0.0], [50.0, 3.1736, 0.5854], 1.0],
    [[50.0, 2.5, 0.0], [50.0, 3.2972, 0.0], 1.0],
    [[50.0, 2.5, 0.0], [50.0, 1.8634, 0.5757], 1.0],
    [[50.0, 2.5, 0.0], [50.0, 3.2592, 0.335], 1.0],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.263],
    [[61.2901, 3.7196, -5.3901], [61.4292, 2.248, -4.962], 1.8731],
    [[35.0831, -44.1164, 3.7933], [35.0232, -40.0716, 1.5901], 1.8645],
    [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
    [[36.4612, 47.858, 18.3852], [36.2715, 50.5065, 21.2231], 1.4146],
    [[90.8027, -2.0831, 1.441], [91.1528, -1.6435, 0.0447], 1.4441],
    [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
    [[6.7747, -0.2908, -2.4247], [5.8714, -0.0985, -2.2286], 0.6377],
    [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
  ];

  it.each(sharmaVectors)('matches the reference value for %j vs %j', (l1, l2, expected) => {
    const lab1 = { L: l1[0], a: l1[1], b: l1[2] };
    const lab2 = { L: l2[0], a: l2[1], b: l2[2] };
    expect(deltaE2000(lab1, lab2)).toBeCloseTo(expected, 4);
  });
});

describe('isNeutral', () => {
  it('treats black, white and grey as neutral', () => {
    for (const hex of ['#000000', '#ffffff', '#808080', '#3a3a3a', '#e8e6e1']) {
      expect(isNeutral(hexToLab(hex)), hex).toBe(true);
    }
  });

  it('does not treat saturated colours as neutral', () => {
    for (const hex of ['#c1440e', '#1f6feb', '#0b6b3a', '#e6c229']) {
      expect(isNeutral(hexToLab(hex)), hex).toBe(false);
    }
  });

  it('uses the configured chroma ceiling as the boundary', () => {
    // Constructed either side of the threshold on the a* axis.
    expect(isNeutral({ L: 50, a: COLOUR_THRESHOLDS.neutralChromaMax - 1, b: 0 })).toBe(true);
    expect(isNeutral({ L: 50, a: COLOUR_THRESHOLDS.neutralChromaMax + 1, b: 0 })).toBe(false);
  });
});

describe('hue helpers', () => {
  it('returns a hue angle in 0–360', () => {
    expect(hueAngle({ L: 50, a: 10, b: 0 })).toBeCloseTo(0, 6);
    expect(hueAngle({ L: 50, a: 0, b: 10 })).toBeCloseTo(90, 6);
    expect(hueAngle({ L: 50, a: -10, b: 0 })).toBeCloseTo(180, 6);
    expect(hueAngle({ L: 50, a: 0, b: -10 })).toBeCloseTo(270, 6);
  });

  it('measures the short way round the wheel', () => {
    expect(hueDifference(10, 350)).toBeCloseTo(20, 6);
    expect(hueDifference(350, 10)).toBeCloseTo(20, 6);
    expect(hueDifference(0, 180)).toBeCloseTo(180, 6);
    expect(hueDifference(90, 90)).toBe(0);
  });
});

describe('classifyColourRelation', () => {
  it('short-circuits to neutral when either side is a neutral', () => {
    const navy = hexToLab('#1b2430');
    const orange = hexToLab('#d2691e');
    expect(classifyColourRelation(navy, orange)).toBe('neutral');
    expect(classifyColourRelation(orange, navy)).toBe('neutral');
  });

  it('calls two close browns a near-miss, not monochrome', () => {
    // This is the case spec §4.2 singles out: the same hue family, a few ΔE
    // apart. Users read it as a mistake, so it must not score as monochrome.
    const saddle = hexToLab('#8b4513');
    const sienna = hexToLab('#a0522d');
    const dE = deltaE2000(saddle, sienna);

    expect(dE).toBeGreaterThan(COLOUR_THRESHOLDS.nearMissDeltaEMin);
    expect(dE).toBeLessThan(COLOUR_THRESHOLDS.nearMissDeltaEMax);
    expect(classifyColourRelation(saddle, sienna)).toBe('near-miss');
  });

  it('calls a genuinely monochrome pair monochrome', () => {
    // Same hue, far enough apart in lightness to read as deliberate.
    const light = hexToLab('#f0a860');
    const dark = hexToLab('#5c3000');
    expect(classifyColourRelation(light, dark)).toBe('monochrome');
  });

  it('recognises opposing hues as complementary', () => {
    const red = { L: 50, a: 70, b: 40 };
    const teal = { L: 50, a: -60, b: -20 };
    expect(classifyColourRelation(red, teal)).toBe('complementary');
  });

  it('is symmetric for every relation', () => {
    const pairs: Array<[string, string]> = [
      ['#8b4513', '#a0522d'],
      ['#1f6feb', '#e6c229'],
      ['#0b6b3a', '#111111'],
      ['#f0a860', '#5c3000'],
    ];
    for (const [x, y] of pairs) {
      const lx = hexToLab(x);
      const ly = hexToLab(y);
      expect(classifyColourRelation(lx, ly), `${x}/${y}`).toBe(classifyColourRelation(ly, lx));
    }
  });
});

describe('Lab column serialisation', () => {
  it('round-trips', () => {
    const lab = hexToLab('#3c6e47');
    expect(labFromArray(labToArray(lab))).toEqual(lab);
  });

  it('returns null for absent or malformed values', () => {
    expect(labFromArray(null)).toBeNull();
    expect(labFromArray([])).toBeNull();
    expect(labFromArray([1, 2])).toBeNull();
    expect(labFromArray([1, 2, Number.NaN])).toBeNull();
  });
});
