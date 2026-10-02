import type { Handler } from "@netlify/functions";
import {
  formatMoney,
  getStripe,
  programLookupKey,
  serializeFeatures,
  slugify,
} from "./_stripePrices";

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "r.lyons1@icloud.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

type BillingInterval = "one_time" | "month" | "year";

function requireAdmin(body: { email?: string; secret?: string }) {
  const secret = process.env.STUDIO_PRICE_SECRET;
  if (!secret) {
    return {
      ok: false as const,
      status: 503,
      body: "Set STUDIO_PRICE_SECRET on Netlify to enable Studio product edits.",
    };
  }
  if (body.secret !== secret) {
    return {
      ok: false as const,
      status: 401,
      body: "Wrong Studio pricing password.",
    };
  }
  const email = (body.email || "").toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(email)) {
    return {
      ok: false as const,
      status: 403,
      body: "Only the Studio admin can manage products.",
    };
  }
  return { ok: true as const };
}

function parseInterval(raw: unknown): BillingInterval {
  const v = String(raw || "one_time").toLowerCase();
  if (v === "month" || v === "monthly") return "month";
  if (v === "year" || v === "yearly" || v === "annual") return "year";
  return "one_time";
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { statusCode: 503, body: "Stripe is not configured" };
  }

  try {
    const body = JSON.parse(event.body || "{}") as {
      email?: string;
      secret?: string;
      productId?: string;
      slug?: string;
      name?: string;
      blurb?: string;
      badge?: string;
      features?: string[] | string;
      amountDollars?: number | string;
      /** Alias for amountDollars (currency-agnostic) */
      amount?: number | string;
      currency?: string;
      compareAtDollars?: number | string;
      compareAtAmount?: number | string;
      imageUrl?: string;
      interval?: string;
      active?: boolean;
    };

    const auth = requireAdmin(body);
    if (!auth.ok) {
      return { statusCode: auth.status, body: auth.body };
    }

    const name = (body.name || "").trim();
    if (!name) {
      return { statusCode: 400, body: "Product name is required." };
    }

    const slug = slugify(body.slug || name);
    if (!slug) {
      return { statusCode: 400, body: "Could not build a product id from the name." };
    }

    const amount = Number(body.amountDollars ?? body.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      return { statusCode: 400, body: "Enter a price of at least 1." };
    }
    const amountCents = Math.round(amount * 100);
    const interval = parseInterval(body.interval);
    const currency = String(body.currency || "eur")
      .trim()
      .toLowerCase()
      .slice(0, 3) || "eur";
    const compareAt = Number(body.compareAtDollars ?? body.compareAtAmount);
    const compareAtCents =
      Number.isFinite(compareAt) && compareAt > amount
        ? Math.round(compareAt * 100)
        : 0;
    const imageUrl = (body.imageUrl || "").trim();

    const features = Array.isArray(body.features)
      ? body.features
      : String(body.features || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

    const blurb = (body.blurb || "").trim();
    const badge = (body.badge || "Program").trim() || "Program";
    const lookupKey = programLookupKey(slug);
    const metadata: Record<string, string> = {
      bbb: "true",
      bbb_role: "program",
      bbb_slug: slug,
      bbb_lookup: lookupKey,
      bbb_badge: badge,
      bbb_blurb: blurb.slice(0, 490),
      bbb_features: serializeFeatures(features),
      bbb_interval: interval,
      bbb_currency: currency,
      bbb_compare_at_cents: compareAtCents ? String(compareAtCents) : "",
      bbb_image: imageUrl.slice(0, 490),
    };

    let productId = body.productId;
    let created = false;

    const productImages = imageUrl ? [imageUrl] : undefined;

    if (productId) {
      await stripe.products.update(productId, {
        name,
        description: blurb || undefined,
        active: body.active !== false,
        metadata,
        ...(productImages ? { images: productImages } : {}),
      });
    } else {
      const existingPrices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1,
      });
      if (existingPrices.data[0]) {
        productId = String(existingPrices.data[0].product);
        await stripe.products.update(productId, {
          name,
          description: blurb || undefined,
          active: true,
          metadata,
          ...(productImages ? { images: productImages } : {}),
        });
      } else {
        const product = await stripe.products.create({
          name,
          description: blurb || undefined,
          metadata,
          ...(productImages ? { images: productImages } : {}),
        });
        productId = product.id;
        created = true;
      }
    }

    const currentPrices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 20,
    });

    const matchesInterval = (p: (typeof currentPrices.data)[0]) => {
      if (interval === "one_time") return !p.recurring;
      return p.recurring?.interval === interval;
    };

    const current = currentPrices.data.find(matchesInterval);
    const amountMatches = current?.unit_amount === amountCents;
    const currencyMatches = (current?.currency || "").toLowerCase() === currency;
    let priceId = current?.id;

    const needsNew =
      !current ||
      !amountMatches ||
      !currencyMatches ||
      (interval === "one_time" ? !!current.recurring : !current.recurring);

    if (needsNew) {
      // Archive other active prices so default is clear
      for (const p of currentPrices.data) {
        if (p.active) await stripe.prices.update(p.id, { active: false });
      }

      const createdPrice = await stripe.prices.create({
        product: productId!,
        unit_amount: amountCents,
        currency,
        lookup_key: lookupKey,
        transfer_lookup_key: true,
        nickname:
          interval === "month"
            ? `${name} — monthly`
            : interval === "year"
              ? `${name} — yearly`
              : `${name} — one-time`,
        ...(interval === "one_time"
          ? {}
          : { recurring: { interval } }),
        metadata: {
          bbb: "true",
          lookup: lookupKey,
          role: "program",
          interval,
          currency,
        },
      });
      priceId = createdPrice.id;
    }

    await stripe.products.update(productId!, {
      default_price: priceId,
      active: body.active !== false,
    });

    const suffix =
      interval === "month" ? "/mo" : interval === "year" ? "/yr" : "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        created,
        product: {
          id: slug,
          slug,
          name,
          blurb,
          badge,
          features,
          amountCents,
          priceLabel: `${formatMoney(amountCents, currency)}${suffix}`,
          currency,
          compareAtCents: compareAtCents || undefined,
          compareAtLabel: compareAtCents
            ? formatMoney(compareAtCents, currency)
            : undefined,
          imageUrl: imageUrl || undefined,
          priceId,
          productId,
          lookupKey,
          active: body.active !== false,
          interval,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : "Could not save product",
    };
  }
};
