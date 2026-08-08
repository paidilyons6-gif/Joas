# Privacy and data protection

The user is in Ireland, so EU users are assumed throughout (spec §7). This file
is the working record of what is held, where, and on what basis. It is not the
user-facing privacy policy, but the policy should be written from it.

## What is held

| Data | Where | Notes |
| --- | --- | --- |
| Email, password hash | `auth.users` (Supabase) | Managed by Supabase Auth |
| Display name, country, currency, timezone, locale, wake time | `profiles` | Wake time drives the daily suggestion push |
| Clothing sizes | `user_sizes` | Needed for size-level stock alerts |
| Alert preferences, quiet hours | `user_prefs` | |
| Garments: title, brand, category, colour, material, size, purchase price and date, condition | `garments` | |
| Garment photos | Storage bucket `garments` | **Private bucket, signed URLs only** |
| Image embeddings (512-dim) | `garments.image_embedding` | Derived from the photo |
| Wear history (which garment, which date) | `garment_wears` | |
| Outfits and outfit wear history | `outfits`, `outfit_wears` | |
| Watched products and alerts | `watches`, `alerts` | |
| Subscription state | `entitlements` | Includes the raw RevenueCat payload |

Wardrobe photos are personal data. They are stored in a private bucket whose
policies scope every object to a path prefix of the owner's uid, and they are
served only through short-lived signed URLs. There is no public URL for a
wardrobe photo, and no code path that creates one.

## Embeddings leave the device

Embeddings are computed server-side (docs/DECISIONS.md §10.3). The photo is
uploaded to the private bucket and then read by the `embed-garment` Edge
Function, which sends the bytes to the configured embedding endpoint.

This is disclosed in the import screen's own copy, not buried in a policy: *"Photos
are analysed on our servers and stored privately to your account."* If the
embedding provider changes, that sentence and this section change with it.

Background removal, when configured, sends the same bytes to a second endpoint.
It degrades to keeping the original image if unconfigured or failing, so it is
never a hard dependency.

## Lawful basis

| Processing | Basis |
| --- | --- |
| Account, wardrobe, outfits — the service itself | Contract, Art. 6(1)(b) |
| Photo analysis for classification | Contract, Art. 6(1)(b) — it is the feature the user asked for |
| Price alerts on watched items | Contract, Art. 6(1)(b) |
| Analytics (PostHog) | Legitimate interests, Art. 6(1)(f), with opt-out |
| Order-email import, when built | **Consent, Art. 6(1)(a)** — revocable, and revoking deletes stored tokens |

Email import is consent and not legitimate interest. Reading a person's inbox is
not something to stretch a basis over, and the spec is right that it carries real
privacy weight and app-review scrutiny.

## Rights, and how they are actually served

**Access and portability (Art. 15, 20).** `export_my_data()` returns everything
held about the caller as one JSON document. It runs as the caller, so RLS scopes
it — there is no way for it to return another user's data. The client writes it to
a file and hands it to the share sheet, so the user holds the copy. Embeddings
are excluded: 512 floats are not portable information about a person.

**Erasure (Art. 17).** `delete-account` removes the user's storage objects first,
then deletes the `auth.users` row, which cascades through `profiles` to every
user-owned table. Storage is first deliberately: it is the only thing that does
not cascade, so doing it second would orphan private images with no owner left to
authorise their removal. The request is recorded in `deletion_requests` before
anything is destroyed, so a partial failure leaves an audit trail and something
to retry rather than a half-deleted account.

Both are implemented and neither is stubbed, which spec §7 requires explicitly.

**Rectification (Art. 16).** Every derived field — colour, category, material,
season — is editable after import. This is also a product principle: nothing is
ever asked for in a form, but everything guessed can be corrected.

## Retention

Not yet decided, and it needs to be before launch. Open questions:

- How long `price_points` is kept. It is append-only and partitioned monthly, so
  dropping old partitions is cheap — but a 12-month price ledger is a product
  feature, so retention cannot be shorter than the claims the UI makes.
- Whether `alerts` rows are kept after conversion, and for how long.
- Whether a deleted account leaves anything in analytics. PostHog identifies by
  user id; deletion should propagate there too, and currently does not.

## Outstanding

- [ ] Retention policy, per the questions above
- [ ] Propagate account deletion to PostHog and Sentry
- [ ] Analytics opt-out in Settings (basis is legitimate interests, so opt-out is
      required, not optional)
- [ ] Data Processing Agreements on file for Supabase, the embedding provider,
      PostHog, Sentry and RevenueCat
- [ ] User-facing privacy policy written from this file
- [ ] If email import ships: consent screen, token deletion on revocation, and a
      record of what was extracted
