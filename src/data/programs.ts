export type Program = {
  id: string;
  name: string;
  tagline: string;
  priceLabel: string;
  blurb: string;
  features: string[];
  badge?: string;
};

/** Static fallbacks removed — live catalog comes from Studio / Stripe. */
export const PROGRAMS: Program[] = [];

export function getProgram(id: string) {
  return PROGRAMS.find((p) => p.id === id);
}
