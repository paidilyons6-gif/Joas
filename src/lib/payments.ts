import type { PlanId } from "../data/plans";
import { hasStripe } from "./demo";

export async function startCheckout(plan: PlanId, email: string) {
  if (!hasStripe()) {
    return { demo: true as const };
  }

  const res = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, email }),
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

export async function openBillingPortal(email: string) {
  if (!hasStripe()) {
    return { demo: true as const };
  }

  const res = await fetch("/.netlify/functions/create-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Could not open billing portal");
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("No portal URL returned");
  window.location.assign(data.url);
  return { demo: false as const };
}
