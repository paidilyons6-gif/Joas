/**
 * Parity between the TypeScript colour maths and the SQL implementation in
 * migration 0012.
 *
 * The duplication is deliberate and explained in that migration's header; this
 * test is the thing that makes it safe. It is the *only* check that the two
 * agree, so if it is skipped in CI the duplication is unguarded.
 *
 * Requires a reachable Postgres with the migrations applied:
 *   RAIL_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
 * With the variable unset the suite skips rather than fails, so `npm test` works
 * on a machine with no local stack. CI MUST set it — see .github/workflows/ci.yml.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { hexToLab, chroma, isNeutral } from '../src/colour';

const DB_URL = process.env.RAIL_TEST_DATABASE_URL;

function psql(sql: string): string {
  return execFileSync('psql', [DB_URL as string, '-At', '-c', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Colours chosen to cover the branches that differ between implementations:
 * the linear/gamma segment boundary of the sRGB transfer function, the
 * cube-root/linear boundary of f(t), pure black (which hits both), and the
 * browns whose near-miss classification the scorer depends on.
 */
const SAMPLES = [
  '#000000',
  '#ffffff',
  '#010101', // below the sRGB linear-segment threshold
  '#0a0a0a', // just above it
  '#080808', // near f(t)'s linear/cube-root boundary
  '#808080',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#8b4513', // saddle brown — the near-miss pair
  '#a0522d', // sienna
  '#1b2430', // navy that reads as a neutral
  '#c4b393',
  '#e6c229',
  '#1f6feb',
] as const;

describe.skipIf(!DB_URL)('SQL/TS colour parity', () => {
  it('hex_to_lab agrees with hexToLab to 4 decimal places', () => {
    // One round trip for all samples: per-sample queries make this test slow
    // enough that people stop running it.
    const values = SAMPLES.map((h) => `('${h}')`).join(',');
    const rows = psql(
      `select hex, (public.hex_to_lab(hex))[1], (public.hex_to_lab(hex))[2], (public.hex_to_lab(hex))[3]
         from (values ${values}) as t(hex)`,
    )
      .split('\n')
      .map((line) => line.split('|'));

    expect(rows).toHaveLength(SAMPLES.length);

    for (const [hex, L, a, b] of rows) {
      const expected = hexToLab(hex as string);
      expect(Number(L), `${hex} L*`).toBeCloseTo(expected.L, 4);
      expect(Number(a), `${hex} a*`).toBeCloseTo(expected.a, 4);
      expect(Number(b), `${hex} b*`).toBeCloseTo(expected.b, 4);
    }
  });

  it('lab_chroma agrees with chroma', () => {
    const values = SAMPLES.map((h) => `('${h}')`).join(',');
    const rows = psql(
      `select hex, public.lab_chroma(public.hex_to_lab(hex))
         from (values ${values}) as t(hex)`,
    )
      .split('\n')
      .map((line) => line.split('|'));

    for (const [hex, c] of rows) {
      expect(Number(c), `${hex} C*`).toBeCloseTo(chroma(hexToLab(hex as string)), 4);
    }
  });

  it('lab_is_neutral agrees with isNeutral — including the threshold cases', () => {
    const values = SAMPLES.map((h) => `('${h}')`).join(',');
    const rows = psql(
      `select hex, public.lab_is_neutral(public.hex_to_lab(hex))
         from (values ${values}) as t(hex)`,
    )
      .split('\n')
      .map((line) => line.split('|'));

    for (const [hex, neutral] of rows) {
      expect(neutral === 't', `${hex}`).toBe(isNeutral(hexToLab(hex as string)));
    }
  });

  it('rejects malformed hex on both sides', () => {
    expect(() => psql(`select public.hex_to_lab('#fff')`)).toThrow();
    expect(() => hexToLab('#fff')).toThrow();
  });
});
