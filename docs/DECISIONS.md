# Decisions

Answers to §10 of the build spec, plus decisions taken while implementing.
Recorded so nobody has to re-litigate them. Amend by appending, not rewriting.

## §10 — decided before build

### 1. Affiliate feed access — nothing applied for yet

Consequence: **Milestone 4 is not started.** The shop-side tables exist in the
schema (garments reference `products`, so they cannot be deferred) but nothing
writes to them except the fixture catalogue in `supabase/seed/`.

Action outstanding on the user: start applications to Awin, Rakuten
Advertising, Impact, Sovrn and Partnerize. Spec §5.1 is right that approval is
the long pole — it takes days to weeks and gates M4 entirely.

### 2. Email order-import (intake path C) — in scope for v1

Built, but **not in Milestone 1**. Spec §3 says ship paths A and B first, and
that ordering stands: path C needs Google restricted-scope verification, which
is a multi-week external dependency and shouldn't block a TestFlight build.

When it is built, these are hard requirements, not nice-to-haves:

- Narrowest possible scope. `gmail.readonly` is restricted; if a per-message
  scope can be made to work with the retailer allowlist, prefer it.
- Explicit in-app consent screen naming which retailers are searched and what
  is extracted. Consent is revocable, and revoking deletes stored tokens.
- Lawful basis under GDPR is **consent** (Art. 6(1)(a)), documented in
  `docs/PRIVACY.md` before the feature ships. Not legitimate interest — the
  user is in the EU and email content is not something to stretch a basis over.
- Only line items are persisted. Raw email bodies are never stored.

### 3. Image embeddings — server-side Edge Function

512-dim, one code path, in `supabase/functions/embed-garment`. Wardrobe photos
leave the device, which has two consequences the app must honour:

- The import consent copy says so plainly.
- Photos go to a **private** bucket, signed URLs only (spec §7 GDPR).

An on-device path can be added later without a schema change, but only if it
produces vectors from the same model — mixing embedding spaces silently breaks
similarity search, which is the worst kind of bug because it looks like it works.

### 4. Taxonomy — menswear-first

The seeded taxonomy in `0004_seed_taxonomy.sql` is menswear. Womenswear
categories are additive data, not a code change: `layer_slot` already has
`full` for dresses/jumpsuits and `bottom` covers skirts, so adding them later
is an INSERT, not a migration of existing rows.

### 5. Free tier — capped at 20 garments

Permanent and genuinely useful, per spec §6: 20 garments, 3 outfits, 5 watches,
next-day alerts. Not time-limited. Two reasons: App Store review pushes back on
gates that make the free app useless, and a wardrobe that becomes inaccessible
contradicts the product thesis that the app *holds your wardrobe*.

Limits live in `packages/core/src/config.ts` (`ENTITLEMENTS`) and MUST be
enforced server-side as well as in the UI (spec §6.8).

## Implementation decisions

### Soft delete counts against the free tier, archive does not

`deleted_at` rows are invisible to the user and excluded from the garment count.
`archived_at` rows are visible in an Archive view and **do** count — otherwise
"archive everything" is a trivial bypass of the 20-garment cap.

### The garment count check is a database trigger, not application code

A client-side check is a suggestion. The trigger in `0005_entitlements.sql`
raises on insert past the cap for a non-entitled user, so the limit holds even
if a request comes from a stale build or straight from the REST API.

### Full schema in Milestone 1, not just the wardrobe tables

Spec §8 puts the shop side in M4, but `garments.product_id` references
`products`, and `price_points` needs its partitioning set up before it has data
in it rather than after. Creating empty tables costs nothing; retrofitting a
partition scheme onto a large live table costs a maintenance window.
