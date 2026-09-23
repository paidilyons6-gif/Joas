import type { PlanId } from "../data/plans";

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

async function tryCheckout(payload: Record<string, unknown>) {
  try {
    await postCheckout(payload);
    return { demo: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Failed to fetch") || message.includes("404")) {
      return { demo: true as const };
    }
    throw error;
  }
}

/** One-time The Office unlock. */
export async function startOfficeCheckout(email?: string) {
  return tryCheckout({ kind: "office", productId: "office", email });
}

/** Recurring Office membership (monthly | annual). */
export async function startSubscriptionCheckout(
  plan: PlanId,
  email?: string,
) {
  return tryCheckout({
    kind: "subscription",
    productId: plan,
    plan,
    email,
  });
}

export async function startProgramCheckout(
  programId: string,
  email?: string,
) {
  return tryCheckout({
    kind: "program",
    productId: programId,
    programId,
    email,
  });
}

export async function startCheckout(plan: PlanId, email: string) {
  return startSubscriptionCheckout(plan, email);
}

export async function openBillingPortal(email: string) {
  void email;
  return { demo: true as const, appStore: true as const };
}
