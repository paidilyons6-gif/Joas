import type { PlanId } from "../data/plans";
import { hasStripe } from "./demo";

/** Demo-only portal unlock — real membership is billed in App Store / Play Store. */
export async function activateMembershipDemo(
  plan: PlanId,
  activatePlan: (plan: PlanId) => Promise<void>,
) {
  await activatePlan(plan);
}

/** One-time program checkout (HOTMESS etc.) on the website via Stripe. */
export async function startProgramCheckout(
  programId: string,
  email?: string,
) {
  if (!hasStripe()) {
    return { demo: true as const };
  }

  const res = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "program", programId, email }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Checkout failed");
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("No checkout URL returned");
  window.location.assign(data.url);
  return { demo: false as const };
}

/** @deprecated Membership is App Store / Play Store — kept for older callers */
export async function startCheckout(plan: PlanId, email: string) {
  void plan;
  void email;
  return { demo: true as const };
}

export async function openBillingPortal(email: string) {
  void email;
  return { demo: true as const, appStore: true as const };
}
