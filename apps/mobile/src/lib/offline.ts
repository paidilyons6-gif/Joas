/**
 * Local SQLite mirror of the wardrobe (spec §7: "Wardrobe, outfits, and the
 * builder MUST work with no network").
 *
 * Expo SQLite rather than WatermelonDB. WatermelonDB brings its own model layer
 * and sync protocol, which would mean two sources of truth about what a garment
 * is; the mirror here is a cache with an outbox, which is the smaller idea.
 * Justifying the dependency is a spec §11 requirement, so: expo-sqlite is the
 * platform primitive, WatermelonDB would need to earn the difference and does not.
 *
 * The mirror is read-through, not authoritative. Writes go to the outbox and are
 * replayed on reconnect; reads prefer the server when online and fall back to
 * the mirror when not.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'rail-mirror.db';

/** Bump when the mirror's shape changes. The mirror is disposable — a version
 *  mismatch drops and refetches rather than migrating, because there is nothing
 *  in here that does not also exist on the server. The outbox is the exception
 *  and is preserved across a reset. */
const MIRROR_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getMirror(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= openMirror();
  return dbPromise;
}

async function openMirror(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // WAL keeps reads from blocking during a sync write, which is what stops the
  // wardrobe list stuttering while a background refresh lands.
  await db.execAsync('pragma journal_mode = WAL;');
  await db.execAsync('pragma foreign_keys = ON;');

  await db.execAsync(`
    create table if not exists mirror_meta (
      key   text primary key,
      value text not null
    );

    create table if not exists garments (
      id                    text primary key,
      title                 text not null,
      brand_name            text,
      category_slug         text not null,
      layer_slot            text not null,
      colour_primary_hex    text,
      colour_primary_lab    text,          -- JSON [L,a,b]
      colour_secondary_hex  text,
      colour_label          text,
      is_neutral            integer not null default 0,
      pattern               text not null default 'solid',
      pattern_scale         text,
      material_main         text,
      warmth_rating         integer not null default 0,
      waterproof            integer not null default 0,
      formality             integer not null default 2,
      size_label            text,
      purchase_price_cents  integer,
      currency              text not null default 'EUR',
      purchased_at          text,
      image_path            text,
      condition             text not null default 'good',
      in_wash               integer not null default 0,
      archived_at           text,
      updated_at            text not null
    );

    create index if not exists garments_slot_idx on garments (layer_slot);
    create index if not exists garments_category_idx on garments (category_slug);

    create table if not exists garment_wears (
      id         text primary key,
      garment_id text not null references garments (id) on delete cascade,
      worn_on    text not null,
      source     text not null default 'manual'
    );

    create index if not exists garment_wears_garment_idx on garment_wears (garment_id, worn_on desc);

    /* Writes made while offline, replayed in insertion order on reconnect.
       Deliberately not cleared by a mirror reset. */
    create table if not exists outbox (
      seq        integer primary key autoincrement,
      kind       text not null,          -- 'log_wear' | 'unlog_wear' | 'update_garment'
      payload    text not null,          -- JSON
      created_at text not null,
      attempts   integer not null default 0,
      last_error text
    );
  `);

  const stored = await db.getFirstAsync<{ value: string }>(
    'select value from mirror_meta where key = ?',
    'version',
  );

  if (stored && Number(stored.value) !== MIRROR_VERSION) {
    // Drop the cache, keep the outbox: unsent writes are the only data here that
    // does not exist anywhere else.
    await db.execAsync('drop table if exists garment_wears; drop table if exists garments;');
    dbPromise = null;
    return openMirror();
  }

  await db.runAsync(
    'insert or replace into mirror_meta (key, value) values (?, ?)',
    'version',
    String(MIRROR_VERSION),
  );

  return db;
}

export interface MirroredGarment {
  id: string;
  title: string;
  brand_name: string | null;
  category_slug: string;
  layer_slot: string;
  colour_primary_hex: string | null;
  colour_primary_lab: string | null;
  colour_label: string | null;
  is_neutral: number;
  pattern: string;
  pattern_scale: string | null;
  material_main: string | null;
  warmth_rating: number;
  waterproof: number;
  formality: number;
  size_label: string | null;
  purchase_price_cents: number | null;
  currency: string;
  purchased_at: string | null;
  image_path: string | null;
  condition: string;
  in_wash: number;
  archived_at: string | null;
  updated_at: string;
}

/** Replace the mirrored wardrobe in one transaction, so a partial fetch never
 *  leaves the list half-populated. */
export async function replaceGarments(rows: readonly MirroredGarment[]): Promise<void> {
  const db = await getMirror();

  await db.withTransactionAsync(async () => {
    await db.runAsync('delete from garments');
    for (const g of rows) {
      await db.runAsync(
        `insert into garments (
           id, title, brand_name, category_slug, layer_slot,
           colour_primary_hex, colour_primary_lab, colour_secondary_hex, colour_label, is_neutral,
           pattern, pattern_scale, material_main, warmth_rating, waterproof, formality,
           size_label, purchase_price_cents, currency, purchased_at,
           image_path, condition, in_wash, archived_at, updated_at
         ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        g.id,
        g.title,
        g.brand_name,
        g.category_slug,
        g.layer_slot,
        g.colour_primary_hex,
        g.colour_primary_lab,
        null,
        g.colour_label,
        g.is_neutral,
        g.pattern,
        g.pattern_scale,
        g.material_main,
        g.warmth_rating,
        g.waterproof,
        g.formality,
        g.size_label,
        g.purchase_price_cents,
        g.currency,
        g.purchased_at,
        g.image_path,
        g.condition,
        g.in_wash,
        g.archived_at,
        g.updated_at,
      );
    }
  });
}

export async function readGarments(): Promise<MirroredGarment[]> {
  const db = await getMirror();
  return db.getAllAsync<MirroredGarment>(
    'select * from garments order by datetime(updated_at) desc',
  );
}

export async function replaceWears(
  rows: ReadonlyArray<{ id: string; garment_id: string; worn_on: string; source: string }>,
): Promise<void> {
  const db = await getMirror();
  await db.withTransactionAsync(async () => {
    await db.runAsync('delete from garment_wears');
    for (const w of rows) {
      await db.runAsync(
        'insert into garment_wears (id, garment_id, worn_on, source) values (?, ?, ?, ?)',
        w.id,
        w.garment_id,
        w.worn_on,
        w.source,
      );
    }
  });
}

export async function readWears(): Promise<
  Array<{ id: string; garment_id: string; worn_on: string; source: string }>
> {
  const db = await getMirror();
  return db.getAllAsync('select * from garment_wears order by worn_on desc');
}

// ── Outbox ───────────────────────────────────────────────────────────────────

export type OutboxKind = 'log_wear' | 'unlog_wear' | 'update_garment';

export interface OutboxEntry {
  seq: number;
  kind: OutboxKind;
  payload: string;
  created_at: string;
  attempts: number;
  last_error: string | null;
}

export async function enqueue(kind: OutboxKind, payload: unknown): Promise<void> {
  const db = await getMirror();
  await db.runAsync(
    'insert into outbox (kind, payload, created_at) values (?, ?, ?)',
    kind,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
}

export async function readOutbox(): Promise<OutboxEntry[]> {
  const db = await getMirror();
  return db.getAllAsync<OutboxEntry>('select * from outbox order by seq asc');
}

export async function dropOutboxEntry(seq: number): Promise<void> {
  const db = await getMirror();
  await db.runAsync('delete from outbox where seq = ?', seq);
}

export async function recordOutboxFailure(seq: number, error: string): Promise<void> {
  const db = await getMirror();
  await db.runAsync(
    'update outbox set attempts = attempts + 1, last_error = ? where seq = ?',
    error,
    seq,
  );
}

/** Drop the whole mirror, outbox included. Only for sign-out: leaving one
 *  user's wardrobe on the device for the next signed-in user to see would be a
 *  data leak, not a stale cache. */
export async function clearMirror(): Promise<void> {
  const db = await getMirror();
  await db.execAsync(
    'delete from garment_wears; delete from garments; delete from outbox; delete from mirror_meta;',
  );
  await db.closeAsync();
  dbPromise = null;
}
