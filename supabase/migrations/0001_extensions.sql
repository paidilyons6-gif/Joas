-- 0001 — extensions and shared helpers.
-- Forward-only. Never edit a shipped migration (spec §11).

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "vector";        -- pgvector, image embeddings
create extension if not exists "pg_trgm";       -- trigram similarity for product resolution

-- Every table gets created_at/updated_at. `moddatetime` would do this, but it
-- lives in Supabase's `extensions` schema, and depending on that makes the
-- migrations unrunnable against a plain Postgres — which is what CI uses to
-- check them. A four-line trigger is not worth the coupling.
-- Attached per-table by `apply_touch_trigger`.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.apply_touch_trigger(target regclass)
returns void
language plpgsql
as $$
begin
  execute format(
    'create trigger touch_updated_at before update on %s
       for each row execute function public.touch_updated_at()',
    target
  );
end;
$$;
