/**
 * Generated database types.
 *
 * Regenerate after every migration, and commit the result:
 *   npx supabase gen types typescript --local > apps/mobile/src/lib/database.types.ts
 *
 * Until then this is deliberately untyped. Spec §1 forbids `any` in committed
 * code without an inline justification, so here it is:
 *
 * A hand-written approximation of 23 tables would drift from the schema within a
 * week, and a *wrong* row type is worse than an absent one — it type-checks
 * queries that fail at runtime, which is the failure mode the strictness is
 * meant to prevent. The alternative, structurally-loose `Record<string, …>`
 * table maps, makes supabase-js resolve every table name to `never` and every
 * query to an error, so it is not an option either.
 *
 * The loss is confined to the Supabase client's own generics. The domain types
 * the app reasons about are hand-written in @rail/core and mapped explicitly at
 * the query boundary (`rowToGarment` in src/data/garments.ts), so column names
 * are checked against a real interface exactly once, where the mapping happens.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
