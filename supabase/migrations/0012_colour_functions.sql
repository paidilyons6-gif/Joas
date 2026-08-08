-- 0012 — sRGB → CIELAB in SQL.
--
-- This duplicates packages/core/src/colour.ts, which is not something to do
-- lightly. It exists because two things need Lab server-side where importing
-- TypeScript is not an option:
--
--   1. Seeding fixture garments from hex (supabase/seed/fixtures.sql).
--   2. The redundancy warning and gap analysis (spec §4.4), which compare a
--      candidate product's colour against every owned garment. Doing that in
--      the client would mean shipping the whole wardrobe to the device to
--      answer one question about one product.
--
-- The two implementations are held to agreement by
-- packages/core/test/colour-parity.test.ts, which runs both over the same
-- inputs. That test is the only reason this duplication is acceptable — if you
-- change one implementation and not the other, it fails.

-- sRGB channel (0–255) → linear light (0–1).
create or replace function public.srgb_to_linear(channel double precision)
returns double precision
language sql
immutable
strict
as $$
  select case
    when channel / 255.0 <= 0.04045 then (channel / 255.0) / 12.92
    else power(((channel / 255.0) + 0.055) / 1.055, 2.4)
  end;
$$;

-- CIELAB f(t), the cube-root with a linear segment near zero.
create or replace function public.lab_f(t double precision)
returns double precision
language sql
immutable
strict
as $$
  select case
    when t > 0.008856 then power(t, 1.0 / 3.0)
    else 7.787 * t + 16.0 / 116.0
  end;
$$;

-- '#rrggbb' → {L, a, b} as a 3-element double precision array, D65.
create or replace function public.hex_to_lab(hex text)
returns double precision[]
language plpgsql
immutable
as $$
declare
  clean text;
  r double precision;
  g double precision;
  b double precision;
  rl double precision;
  gl double precision;
  bl double precision;
  x  double precision;
  y  double precision;
  z  double precision;
  fx double precision;
  fy double precision;
  fz double precision;
begin
  if hex is null then
    return null;
  end if;

  clean := lower(ltrim(hex, '#'));
  if clean !~ '^[0-9a-f]{6}$' then
    raise exception 'not a 6-digit hex colour: %', hex;
  end if;

  r := ('x' || substr(clean, 1, 2))::bit(8)::int;
  g := ('x' || substr(clean, 3, 2))::bit(8)::int;
  b := ('x' || substr(clean, 5, 2))::bit(8)::int;

  rl := public.srgb_to_linear(r);
  gl := public.srgb_to_linear(g);
  bl := public.srgb_to_linear(b);

  -- Linear sRGB → XYZ (D65), scaled to 0–100. Same matrix as colour.ts.
  x := (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) * 100.0;
  y := (0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl) * 100.0;
  z := (0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl) * 100.0;

  fx := public.lab_f(x / 95.047);
  fy := public.lab_f(y / 100.0);
  fz := public.lab_f(z / 108.883);

  return array[
    116.0 * fy - 16.0,
    500.0 * (fx - fy),
    200.0 * (fy - fz)
  ];
end;
$$;

-- CIELAB chroma C*.
create or replace function public.lab_chroma(lab double precision[])
returns double precision
language sql
immutable
strict
as $$
  select sqrt(lab[2] * lab[2] + lab[3] * lab[3]);
$$;

-- Mirrors COLOUR_THRESHOLDS.neutralChromaMax in packages/core/src/config.ts.
create or replace function public.lab_is_neutral(lab double precision[])
returns boolean
language sql
immutable
strict
as $$
  select public.lab_chroma(lab) <= 12.0;
$$;

/**
 * Fill in colour_primary_lab, colour_secondary_lab and is_neutral from the hex
 * columns for one user's garments. Called by the seed, and by intake when a
 * colour is edited by hand (the confirmation card writes hex, not Lab).
 */
create or replace function public.backfill_garment_lab(target_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  touched integer;
begin
  update public.garments g
     set colour_primary_lab = case
           when g.colour_primary_hex is null then null
           else public.hex_to_lab(g.colour_primary_hex)::real[]
         end,
         colour_secondary_lab = case
           when g.colour_secondary_hex is null then null
           else public.hex_to_lab(g.colour_secondary_hex)::real[]
         end,
         is_neutral = case
           when g.colour_primary_hex is null then false
           else public.lab_is_neutral(public.hex_to_lab(g.colour_primary_hex))
         end
   where g.user_id = target_user;

  get diagnostics touched = row_count;
  return touched;
end;
$$;

-- Keep Lab in step with hex automatically, so no caller can write one without
-- the other. The seed still calls backfill_garment_lab explicitly for the rows
-- it inserted before this trigger's conditions were met.
create or replace function public.sync_garment_lab()
returns trigger
language plpgsql
as $$
begin
  if new.colour_primary_hex is null then
    new.colour_primary_lab := null;
    new.is_neutral := false;
  else
    new.colour_primary_lab := public.hex_to_lab(new.colour_primary_hex)::real[];
    new.is_neutral := public.lab_is_neutral(public.hex_to_lab(new.colour_primary_hex));
  end if;

  new.colour_secondary_lab := case
    when new.colour_secondary_hex is null then null
    else public.hex_to_lab(new.colour_secondary_hex)::real[]
  end;

  return new;
end;
$$;

create trigger sync_lab before insert or update of colour_primary_hex, colour_secondary_hex
  on public.garments
  for each row execute function public.sync_garment_lab();
