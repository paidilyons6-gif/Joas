import type { PlanId } from "../data/plans";

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

/** Buy a program (one-time or subscription — set in Studio). */
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

/** @deprecated Office membership removed */
export async function startOfficeCheckout(email?: string) {
  void email;
  return tryCheckout({ productId: "hotmess" });
}

/** @deprecated */
export async function startSubscriptionCheckout(plan: PlanId, email?: string) {
  void plan;
  return startProgramCheckout("hotmess", email);
}

export async function startCheckout(plan: PlanId, email: string) {
  void plan;
  return startProgramCheckout("hotmess", email);
}

export async function openBillingPortal(email: string) {
  void email;
  return { demo: true as const };
}
