# Rail

A wardrobe app. Three things, in this order of importance: it holds your
wardrobe, it builds outfits from it, and it watches the shops for what's
missing.

The thesis that drives every trade-off: **outfits create the daily habit, price
alerts create the revenue.** Where a decision makes the wardrobe worse to make
shopping better, the wardrobe wins.

## Where this is

**Milestone 1 — a wardrobe that works.** Auth, schema, RLS, photo import with
automatic classification, wardrobe browse, manual wear logging.

Milestones 2–5 (outfits, suggestions, the shop side, monetisation) are not
started. `docs/MILESTONES.md` has the state of each.

## Layout

```
packages/core/       Domain logic, pure and testable. Colour maths, layer-slot
                     rules, wardrobe derivations, and the one config module that
                     holds every tunable weight and threshold.
apps/mobile/         Expo (React Native) app. Expo Router, TanStack Query for
                     server state, Zustand for UI state.
supabase/migrations/ Forward-only SQL. Never edit one that has shipped.
supabase/functions/  Edge Functions (Deno): embedding, account deletion.
supabase/seed/       Fixture wardrobe (68 garments) and fixture catalogue.
docs/                Decisions, milestone state, privacy.
```

## Running it

```bash
npm install

# Local Supabase, migrations, and the fixture wardrobe.
npx supabase start
npm run db:seed

cp .env.example .env      # fill in the anon key printed by `supabase start`
npm start --workspace @rail/mobile
```

The fixture user is `fixture@rail.test` / `fixture-password`, with 68 garments
across every layer slot.

## Tests

```bash
npm test          # unit tests
npm run typecheck # TypeScript strict, both workspaces
```

Two suites matter more than the rest, per the working agreement in the spec: the
outfit scorer and the price-low detector. A regression in either is invisible in
the UI and fatal to trust. The scorer arrives in Milestone 2; its foundations
(CIEDE2000, the near-miss band, layer-slot validity) are tested now.

`colour-parity.test.ts` needs a real Postgres and **skips without
`RAIL_TEST_DATABASE_URL`**. It is the only guard on the deliberately duplicated
colour maths in migration `0012`, so CI sets it and fails if the functions are
missing. If you are changing colour code, set it locally too:

```bash
RAIL_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm test
```

## Things worth knowing before you change something

**The wardrobe works offline, and that is not negotiable.** Reads fall back to a
SQLite mirror; writes queue in an outbox and replay on reconnect. Price data may
be stale offline and must be *labelled* stale, never silently served as current.

**Colour lives in CIELAB, not hex.** Garments store their Lab triple at import
so the scorer never converts inside its 50ms budget. ΔE is CIEDE2000 — CIE76
overstates distance among saturated warm tones, which is exactly the "two browns
fighting" case users notice most.

**Entitlement limits are enforced by database triggers**, not by the client. The
UI gate is presentation; the trigger in `0007` is the limit.

**Every tunable number belongs in `packages/core/src/config.ts`.** Scoring
weights are also stored in the `scoring_config` table so they can be tuned
without shipping a build; the baked-in values are the offline default.

**Before adding a dependency, say why it beats the platform primitive.** There
are two such notes already, in `src/lib/offline.ts` (expo-sqlite over
WatermelonDB) and `src/lib/database.types.ts` (why the generated types are
absent rather than approximated).

## Decisions already made

The five §10 decisions are settled and recorded in `docs/DECISIONS.md`:
server-side embeddings, menswear-first taxonomy, email import in scope for v1
but not for M1, no affiliate feeds applied for yet, free tier capped at 20
garments. Don't re-litigate them without reading that file.
