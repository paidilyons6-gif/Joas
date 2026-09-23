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
    name: "Monthly",
    priceLabel: "$49",
    cadence: "/month",
    features: [
      "Full access to The Office",
      "All 3 course tracks",
      "Financial calculators suite",
      "Startup toolkit + vault",
      "Cancel anytime",
    ],
  },
  annual: {
    name: "Yearly",
    priceLabel: "$397",
    cadence: "/year",
    highlight: "Best value · save ~2 months",
    features: [
      "Everything in Monthly",
      "Founders badge in portal",
      "Priority office-hours seats",
      "Annual strategy reset call",
      "Lock in founding pricing",
    ],
  },
};
