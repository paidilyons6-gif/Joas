export type OfficeOfferId = "monthly" | "annual" | "lifetime";

/** Website billing for The Office — coherent price ladder. */
export const OFFICE_OFFERS: Record<
  OfficeOfferId,
  {
    name: string;
    badge: string;
    priceLabel: string;
    priceSuffix?: string;
    blurb: string;
    featured?: boolean;
    features: string[];
    cta: string;
  }
> = {
  monthly: {
    name: "Monthly",
    badge: "Flexible",
    priceLabel: "$49",
    priceSuffix: "/month",
    blurb: "Month to month. Cancel anytime.",
    features: [
      "Full Office portal access",
      "Courses, tools, vault, community",
      "Billed every month in Stripe",
      "Cancel anytime — access ends at period end",
    ],
    cta: "Subscribe monthly →",
  },
  annual: {
    name: "Yearly",
    badge: "Best value",
    priceLabel: "$397",
    priceSuffix: "/year",
    blurb: "Save $191 vs paying monthly ($588).",
    featured: true,
    features: [
      "Everything in monthly",
      "One payment covers the full year",
      "Best recurring rate",
      "Renews yearly — cancel before renewal",
    ],
    cta: "Subscribe yearly →",
  },
  lifetime: {
    name: "Lifetime",
    badge: "Pay once",
    priceLabel: "$597",
    blurb: "One payment. Keep The Office — no renewals.",
    features: [
      "Full Office unlock forever",
      "No monthly or yearly charges",
      "Same courses, tools & community",
      "Best if you know you’re staying",
    ],
    cta: "Buy lifetime →",
  },
};
