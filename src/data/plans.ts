export type PlanId = "monthly" | "annual";

export const PLANS: Record<
  PlanId,
  {
    name: string;
    priceLabel: string;
    cadence: string;
    highlight?: string;
    features: string[];
  }
> = {
  monthly: {
    name: "Membership",
    priceLabel: "$49",
    cadence: "/month",
    features: [
      "3 full course tracks",
      "Financial calculators suite",
      "Startup toolkit worksheets",
      "Resource vault + templates",
      "Cancel anytime",
    ],
  },
  annual: {
    name: "Founders Year",
    priceLabel: "$397",
    cadence: "/year",
    highlight: "Best value · 2 months free",
    features: [
      "Everything in Membership",
      "Founders badge in portal",
      "Priority office-hours seats",
      "Annual strategy reset call",
      "Lock in founding pricing",
    ],
  },
};
