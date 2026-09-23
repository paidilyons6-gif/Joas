import type { PlanId } from "../data/plans";
import { hasStripe } from "./demo";

/** Demo-only portal unlock. */
export async function activateMembershipDemo(
  plan: PlanId,
  activatePlan: (plan: PlanId) => Promise<void>,
) {
  await activatePlan(plan);
}

async function postCheckout(payload: Record<string, unknown>) {
  const res = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Checkout failed");
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("No checkout URL returned");
  window.location.assign(data.url);
}

/** One-time The Office unlock via Stripe Checkout. */
export async function startOfficeCheckout(email?: string) {
  if (!hasStripe()) {
    return { demo: true as const };
  }
  await postCheckout({ kind: "office", productId: "office", email });
  return { demo: false as const };
}

/** One-time program checkout (HOTMESS etc.) on the website. */
export async function startProgramCheckout(
  programId: string,
  email?: string,
) {
  if (!hasStripe()) {
    return { demo: true as const };
  }
  await postCheckout({ kind: "program", productId: programId, programId, email });
  return { demo: false as const };
}

export async function startCheckout(plan: PlanId, email: string) {
  void plan;
  return startOfficeCheckout(email);
}

export async function openBillingPortal(email: string) {
  void email;
  return { demo: true as const, appStore: true as const };
}
