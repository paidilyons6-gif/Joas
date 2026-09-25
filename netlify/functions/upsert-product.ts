import type { Handler } from "@netlify/functions";
import {
  ensureHotmessTagged,
  formatDollars,
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
    await ensureHotmessTagged(stripe);
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

    const dollars = Number(body.amountDollars);
    if (!Number.isFinite(dollars) || dollars < 1) {
      return { statusCode: 400, body: "Enter a dollar amount of at least 1." };
    }
    const amountCents = Math.round(dollars * 100);
    const interval = parseInterval(body.interval);

    const features = Array.isArray(body.features)
      ? body.features
      : String(body.features || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

    const blurb = (body.blurb || "").trim();
    const badge = (body.badge || "Program").trim() || "Program";
    const lookupKey = programLookupKey(slug);
    const metadata = {
      bbb: "true",
      bbb_role: "program",
      bbb_slug: slug,
      bbb_lookup: lookupKey,
      bbb_badge: badge,
      bbb_blurb: blurb.slice(0, 490),
      bbb_features: serializeFeatures(features),
      bbb_interval: interval,
    };

    let productId = body.productId;
    let created = false;

    if (productId) {
      await stripe.products.update(productId, {
        name,
        description: blurb || undefined,
        active: body.active !== false,
        metadata,
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
        });
      } else {
        const product = await stripe.products.create({
          name,
          description: blurb || undefined,
          metadata,
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
    let priceId = current?.id;

    const needsNew =
      !current ||
      !amountMatches ||
      (interval === "one_time" ? !!current.recurring : !current.recurring);

    if (needsNew) {
      // Archive other active prices so default is clear
      for (const p of currentPrices.data) {
        if (p.active) await stripe.prices.update(p.id, { active: false });
      }

      const createdPrice = await stripe.prices.create({
        product: productId!,
        unit_amount: amountCents,
        currency: "usd",
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
          priceLabel: `${formatDollars(amountCents)}${suffix}`,
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
