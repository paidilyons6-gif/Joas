export type PlanId = "monthly" | "annual";

/** BodiesByBecca membership — billed in the Apple / Google app stores. */
export const PLANS: Record<
  PlanId,
  {
    name: string;
    priceLabel: string;
    cadence: string;
    highlight?: string;
    store: "apple" | "google" | "both";
    features: string[];
  }
> = {
  monthly: {
    name: "BodiesByBecca",
    priceLabel: "Monthly",
    cadence: " · App Store / Play Store",
    store: "both",
    features: [
      "BodiesByBecca membership access",
      "Full access to The Office portal",
      "All courses, calculators & toolkit",
      "Vault + community",
      "Managed in the Bodies by Becca app",
    ],
  },
  annual: {
    name: "BodiesByBecca Yearly",
    priceLabel: "Yearly",
    cadence: " · App Store / Play Store",
    highlight: "Best value in the app",
    store: "both",
    features: [
      "Everything in monthly membership",
      "Yearly billing through Apple or Google",
      "Full Office portal unlock",
      "Cancel in your device subscriptions",
      "Founding member perks when available",
    ],
  },
};

/** App store links — set in Netlify / .env when ready. */
export function appStoreUrl() {
  return (
    (import.meta.env.VITE_APP_STORE_URL as string | undefined)?.trim() ||
    "https://apps.apple.com/search?term=Bodies%20by%20Becca"
  );
}

export function playStoreUrl() {
  return (
    (import.meta.env.VITE_PLAY_STORE_URL as string | undefined)?.trim() ||
    "https://play.google.com/store/search?q=Bodies%20by%20Becca&c=apps"
  );
}
