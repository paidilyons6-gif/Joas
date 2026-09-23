export type ProgramId = "hotmess";

export type Program = {
  id: ProgramId;
  name: string;
  tagline: string;
  priceLabel: string;
  /** Stripe Price ID env key hint — set STRIPE_PRICE_HOTMESS on Netlify */
  stripePriceEnv: string;
  blurb: string;
  features: string[];
  badge?: string;
};

/** One-time (or challenge) programs sold on the website — not App Store membership. */
export const PROGRAMS: Program[] = [
  {
    id: "hotmess",
    name: "HOTMESS",
    tagline: "The program. Sold on the site.",
    priceLabel: "Buy on site",
    stripePriceEnv: "STRIPE_PRICE_HOTMESS",
    badge: "Program",
    blurb:
      "HOTMESS stays available on the website — a Bodies by Becca program you can sell directly, separate from BodiesByBecca membership in the app.",
    features: [
      "Sold on Business by Becca / the website",
      "Separate from BodiesByBecca app membership",
      "Checkout on the site (Stripe when connected)",
      "Add more programs anytime in Studio or here",
    ],
  },
];

export function getProgram(id: string) {
  return PROGRAMS.find((p) => p.id === id);
}
