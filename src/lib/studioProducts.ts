export type StudioProduct = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  badge: string;
  features: string[];
  amountCents: number;
  priceLabel: string;
  priceId: string;
  productId: string;
  lookupKey: string;
  active: boolean;
};

export async function fetchStudioProducts(opts?: {
  all?: boolean;
}): Promise<StudioProduct[]> {
  try {
    const qs = opts?.all ? "?all=1" : "";
    const res = await fetch(`/.netlify/functions/list-products${qs}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: StudioProduct[] };
    return data.products || [];
  } catch {
    return [];
  }
}

export async function upsertStudioProduct(input: {
  email: string;
  secret: string;
  productId?: string;
  slug?: string;
  name: string;
  blurb: string;
  badge: string;
  features: string[];
  amountDollars: number;
  active?: boolean;
}) {
  const res = await fetch("/.netlify/functions/upsert-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Could not save product");
  return JSON.parse(text) as {
    ok: boolean;
    created?: boolean;
    product: StudioProduct;
  };
}

export async function archiveStudioProduct(input: {
  email: string;
  secret: string;
  productId: string;
}) {
  const res = await fetch("/.netlify/functions/archive-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Could not archive product");
  return JSON.parse(text) as { ok: boolean };
}
