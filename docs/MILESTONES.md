# Milestone state

Build order from spec §8. Updated as things land, so this file is the answer to
"what actually works?"

## Milestone 1 — a wardrobe that works · in progress

Target: auth, schema, RLS, photo import with auto-classification, wardrobe
browse, manual wear logging. No shopping, no outfits. Ship to TestFlight.

Done:

- [x] Schema, all 23 tables, forward-only migrations `0001`–`0013`
- [x] RLS on every table with no exceptions, including `price_points` partitions
      (a partition does not inherit its parent's row security — the partition
      helper enables it explicitly)
- [x] Auth, with profile / prefs / entitlement rows created by trigger on signup
- [x] Menswear taxonomy, 56 categories, each mapped to exactly one layer slot
- [x] Free-tier limits enforced by database trigger, verified to hold at 20
- [x] Colour maths: sRGB→CIELAB, CIEDE2000, the near-miss band, neutral
      detection. 54 tests including the 32 Sharma et al. reference vectors
- [x] Layer-slot validity rules and tests (§4.1)
- [x] Wardrobe derivations: cost-per-wear, days-since-wear, suggestion
      eligibility, palette, slot counts
- [x] Config module holding every tunable weight, threshold and cadence
- [x] Offline SQLite mirror with an outbox, replayed on reconnect
- [x] Photo import (path A): resize, upload to a private bucket, server-side
      embedding, classification against the catalogue, confirmation card
- [x] Wardrobe screen: auto-sorted slot sections with counts, palette bar with a
      text equivalent, cost-per-wear and least-worn sorting, search
- [x] Garment detail with one-tap wear logging and in-wash toggle
- [x] GDPR data export and real account deletion (images then auth row)
- [x] Fixture wardrobe: 68 garments, all 8 slots, all seasons, plus the awkward
      cases — a two-browns near-miss pair, three patterned items, formality 1–5,
      an in-wash item, a needs-repair item, an archived item
- [x] Fixture catalogue: 10 products, 120 offers, 14,400 price points with a
      genuine historic trough so all-time-low detection has a real event to find

Not done:

- [ ] **Retailer link import (path B)** — the client mutation and its validation
      exist in `src/data/import.ts`, but the `import-link` Edge Function it calls
      does not. This is the highest-value remaining M1 item: the spec says this
      path gives near-perfect metadata and should be encouraged, and the import
      screen already leads with it. Needs Open Graph + JSON-LD Product parsing,
      an honest user agent, and robots.txt respect.
- [ ] **Dominant-colour extraction from the cut-out.** `embed-garment` returns a
      null colour rather than guessing, so the confirmation card currently has no
      colour to pre-select. The Lab pipeline behind it is finished and tested —
      only the extraction step is missing.
- [ ] Confirmation-card UI. `useConfirmGarment` exists; nothing renders it yet,
      so imported garments keep the placeholder title until edited.
- [ ] Manual entry (path D) as an explicit fallback screen.
- [ ] Archive view. Archived garments are excluded from the list and counted
      against the tier, but there is no screen to see or unarchive them.
- [ ] Multi-select edit on the wardrobe screen (spec §6.4).
- [ ] Measured proof of the 200-garment / 60fps criterion. The list is
      virtualised with fixed row heights and lazily-loaded images, which is the
      right shape, but "scrolls at 60fps" is a measurement and has not been made.
- [ ] EAS build config and a TestFlight submission.

## Milestone 2 — outfits · not started

Layer slots, builder, coherence scoring, saved outfits, wear tracking. The point
at which the app is worth using daily.

The foundations are in place: `validateOutfit` and `fillableSlots` implement the
§4.1 rules with tests, `scoring_config` holds the weights, and the schema has
`outfits`, `outfit_items`, `outfit_wears` with the single-occupancy constraint on
non-accessory slots. What's missing is the scorer itself and its tests — and per
spec §11 the tests are not optional there.

## Milestone 3 — suggestions · not started

Weather (Open-Meteo), candidate generation by beam search, daily push, novelty
boosting, gap analysis. `SUGGESTION_PARAMS` and `WARMTH_TARGETS` are already
configured, and `eligibleForSuggestion` implements the §4.3 step-2 filter.

## Milestone 4 — the shop side · blocked

**Do not start before feed access is approved** (spec §8). Nothing is applied for
yet (docs/DECISIONS.md §10.1), so this is blocked on an external dependency that
takes days to weeks.

Unblocking action, on the user rather than on the code: start applications to
Awin, Rakuten Advertising, Impact, Sovrn Commerce and Partnerize.

The schema, the fixture catalogue and the price-history shape are all in place so
that UI work here is not blocked in the meantime.

## Milestone 5 — monetisation · not started

RevenueCat, paywall, entitlement gating, trial, analytics funnel. The
server-side half of the gate is already built and tested (`0007`); what remains
is the RevenueCat webhook that writes `entitlements`, and the paywall screen —
which must show price, terms and cancellation on the screen itself.

## Deferred by decision, not by oversight

- **Order-email import (path C).** In scope for v1, deliberately after M1.
  Needs Google restricted-scope verification, a consent screen, and a documented
  lawful basis. See docs/DECISIONS.md §10.2.
- **On-device embeddings.** Server-side was chosen. Adding an on-device path
  later needs the same model, or the two embedding spaces silently diverge and
  similarity search returns nonsense that still looks like results.
