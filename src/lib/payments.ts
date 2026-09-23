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

/**
 * One-time The Office unlock via Stripe Checkout.
 * Tries the Netlify function first (publishable key not required for redirect Checkout).
 * Falls back to demo unlock only when Stripe isn't configured (503).
 */
export async function startOfficeCheckout(email?: string) {
  try {
    await postCheckout({ kind: "office", productId: "office", email });
    return { demo: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      !hasStripe() &&
      (message.includes("not configured") || message.includes("503") || message.includes("Failed to fetch"))
    ) {
      return { demo: true as const };
    }
    // If function is up but misconfigured, surface the error
    if (message.includes("not configured") || message.includes("Missing Stripe price")) {
      throw error;
    }
    // Local static preview without functions → demo
    if (message.includes("Failed to fetch") || message.includes("404")) {
      return { demo: true as const };
    }
    throw error;
  }
}

/** One-time program checkout (HOTMESS etc.) on the website. */
export async function startProgramCheckout(
  programId: string,
  email?: string,
) {
  try {
    await postCheckout({
      kind: "program",
      productId: programId,
      programId,
      email,
    });
    return { demo: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Failed to fetch") || message.includes("404")) {
      return { demo: true as const };
    }
    throw error;
  }
}

export async function startCheckout(plan: PlanId, email: string) {
  void plan;
  return startOfficeCheckout(email);
}

export async function openBillingPortal(email: string) {
  void email;
  return { demo: true as const, appStore: true as const };
}
