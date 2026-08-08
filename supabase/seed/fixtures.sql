-- Fixture wardrobe and catalogue (spec §11).
--
-- 66 garments across every layer slot and all four seasons, plus a small fixture
-- catalogue so shop-side UI can be built before feed access is approved
-- (§10 decision 1 — nothing is applied for yet).
--
-- Run against a local stack only: `npm run db:seed`. The fixture user is created
-- with a known uuid so tests can act as them without a signup round-trip.
--
-- Lab values are populated by the trigger below rather than written by hand —
-- hand-computed Lab triples in a seed file drift from the conversion code, and
-- then the scorer's fixtures stop matching production behaviour.

begin;

-- ── Fixture user ─────────────────────────────────────────────────────────────

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'fixture@rail.test',
  crypt('fixture-password', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Fixture User"}'::jsonb
)
on conflict (id) do nothing;

-- handle_new_user() created the profile and prefs; fill in the rest.
update public.profiles
   set home_country = 'IE', currency = 'EUR', timezone = 'Europe/Dublin',
       locale = 'en-IE', wake_time = '07:15', onboarded_at = now()
 where id = '00000000-0000-4000-8000-000000000001';

insert into public.user_sizes (user_id, category_group, size_label, region) values
  ('00000000-0000-4000-8000-000000000001', 'tops',   'M',  'EU'),
  ('00000000-0000-4000-8000-000000000001', 'shirts', '40', 'EU'),
  ('00000000-0000-4000-8000-000000000001', 'waist',  '32', 'EU'),
  ('00000000-0000-4000-8000-000000000001', 'shoes',  '44', 'EU')
on conflict do nothing;

-- The fixture user is on the free tier by default, but the fixture wardrobe is
-- 66 garments — well past the 20-garment cap. Grant full access so the seed
-- does not trip its own entitlement trigger.
update public.entitlements
   set entitlement = 'rail_full'
 where user_id = '00000000-0000-4000-8000-000000000001';

-- ── Brands ───────────────────────────────────────────────────────────────────

insert into public.brands (name, slug, aliases) values
  ('Uniqlo',          'uniqlo',          '{"UNIQLO"}'),
  ('Arket',           'arket',           '{}'),
  ('Carhartt WIP',    'carhartt-wip',    '{"Carhartt","Carhartt Work In Progress"}'),
  ('Sunspel',         'sunspel',         '{}'),
  ('Levi''s',         'levis',           '{"Levis","Levi Strauss"}'),
  ('Rains',           'rains',           '{}'),
  ('Veja',            'veja',            '{}'),
  ('New Balance',     'new-balance',     '{"NB"}'),
  ('Grenson',         'grenson',         '{}'),
  ('Patagonia',       'patagonia',       '{}'),
  ('Norse Projects',  'norse-projects',  '{"Norse"}'),
  ('COS',             'cos',             '{}'),
  ('Barbour',         'barbour',         '{}'),
  ('Dr. Martens',     'dr-martens',      '{"Doc Martens","DM''s"}')
on conflict (slug) do nothing;

-- ── Helper: insert a garment by slug rather than uuid ─────────────────────────
-- A seed file that hard-codes category uuids breaks the moment the taxonomy is
-- reseeded. Look them up by slug instead.

create or replace function pg_temp.add_garment(
  p_title       text,
  p_brand       text,
  p_category    text,
  p_hex         text,
  p_hex2        text,
  p_pattern     text,
  p_scale       text,
  p_material    text,
  -- integer, not smallint: an integer literal does not implicitly match a
  -- smallint parameter during function resolution, so every call below would
  -- fail to resolve. Cast on the way into the table instead.
  p_warmth      integer,
  p_waterproof  boolean,
  p_formality   integer,
  p_size        text,
  p_price_cents integer,
  p_purchased   date,
  p_condition   text default 'good'
) returns uuid
language plpgsql
as $$
declare
  new_id uuid;
begin
  insert into public.garments (
    user_id, title, brand_id, category_id,
    colour_primary_hex, colour_secondary_hex,
    pattern, pattern_scale, material_main,
    warmth_rating, waterproof, formality,
    size_label, purchase_price_cents, currency, purchased_at,
    source, condition
  )
  values (
    '00000000-0000-4000-8000-000000000001',
    p_title,
    (select id from public.brands where slug = p_brand),
    (select id from public.categories where slug = p_category),
    p_hex, p_hex2,
    p_pattern, p_scale, p_material,
    p_warmth::smallint, p_waterproof, p_formality::smallint,
    p_size, p_price_cents, 'EUR', p_purchased,
    'photo', p_condition::public.garment_condition
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- ── The wardrobe: 66 garments ────────────────────────────────────────────────
-- Deliberately includes the awkward cases the scorer must handle:
--   * two mid-brown items a few ΔE apart (the "two browns fighting" pair)
--   * three patterned items, so pattern-load penalties are exercised
--   * a formality spread from 1 (joggers) to 5 (dress shirt / suit)
--   * a needs_repair item and an in-wash item, which suggestions must exclude
--   * an archived item, which must not appear in counts or the palette

select pg_temp.add_garment('Heattech crew base layer','uniqlo','base-layer','#2b2b2b',null,'solid',null,'synthetic',3,false,1,'M',1490,'2024-11-02');
select pg_temp.add_garment('Merino thermal long sleeve','uniqlo','thermal','#3d4550',null,'solid',null,'merino wool',3,false,1,'M',3990,'2023-12-10');
select pg_temp.add_garment('Cotton undershirt (white)','uniqlo','undershirt','#f5f4f0',null,'solid',null,'cotton',1,false,1,'M',990,'2025-01-15');

select pg_temp.add_garment('Riviera T-shirt, white','sunspel','t-shirt','#f7f6f2',null,'solid',null,'cotton',1,false,2,'M',7500,'2024-05-20');
select pg_temp.add_garment('Riviera T-shirt, navy','sunspel','t-shirt','#1b2540',null,'solid',null,'cotton',1,false,2,'M',7500,'2024-05-20');
select pg_temp.add_garment('Heavyweight tee, ecru','arket','t-shirt','#ded7c8',null,'solid',null,'cotton',1,false,2,'M',3500,'2025-03-11');
select pg_temp.add_garment('Pocket tee, faded black','carhartt-wip','t-shirt','#33322f',null,'solid',null,'cotton',1,false,1,'M',3200,'2023-07-04');
select pg_temp.add_garment('Striped long-sleeve tee','norse-projects','long-sleeve-tee','#20304a','#e8e4da','stripe','small','cotton',2,false,2,'M',6500,'2024-09-30');
select pg_temp.add_garment('Piqué polo, olive','uniqlo','polo','#4a5033',null,'solid',null,'cotton',1,false,2,'M',2490,'2025-06-02');
select pg_temp.add_garment('Piqué polo, white','uniqlo','polo','#f4f3ef',null,'solid',null,'cotton',1,false,3,'M',2490,'2025-06-02');
select pg_temp.add_garment('Oxford shirt, white','arket','oxford-shirt','#f6f5f1',null,'solid',null,'cotton',2,false,4,'40',6900,'2024-02-18');
select pg_temp.add_garment('Oxford shirt, blue','arket','oxford-shirt','#a8bdd4',null,'solid',null,'cotton',2,false,4,'40',6900,'2024-02-18');
select pg_temp.add_garment('Poplin dress shirt, white','cos','dress-shirt','#fafaf7',null,'solid',null,'cotton',2,false,5,'40',7900,'2023-10-05');
select pg_temp.add_garment('Chambray casual shirt','norse-projects','casual-shirt','#6d87a6',null,'solid',null,'cotton',2,false,3,'40',9500,'2024-04-22');
select pg_temp.add_garment('Check flannel shirt','carhartt-wip','flannel-shirt','#7a3b32','#3c4a55','check','medium','cotton flannel',3,false,2,'M',8900,'2023-11-19');
select pg_temp.add_garment('Waffle henley, oatmeal','arket','henley','#d8cbb4',null,'solid',null,'cotton',2,false,2,'M',4500,'2024-10-08');

select pg_temp.add_garment('Lambswool crew, navy','uniqlo','crew-knit','#1e2740',null,'solid',null,'lambswool',3,false,3,'M',3990,'2023-10-30');
select pg_temp.add_garment('Lambswool crew, oatmeal','uniqlo','crew-knit','#cfc2a8',null,'solid',null,'lambswool',3,false,3,'M',3990,'2023-10-30');
select pg_temp.add_garment('Merino roll neck, charcoal','cos','roll-neck','#3a3a3c',null,'solid',null,'merino wool',3,false,4,'M',7900,'2024-11-12');
select pg_temp.add_garment('Cable cardigan, brown','arket','cardigan','#8a5a34',null,'cable','medium','wool',3,false,3,'M',11900,'2024-12-01');
select pg_temp.add_garment('Loopback sweatshirt, grey','norse-projects','sweatshirt','#8c8d8a',null,'solid',null,'cotton',2,false,2,'M',9500,'2024-03-28');
select pg_temp.add_garment('Heavyweight hoodie, black','carhartt-wip','hoodie','#242423',null,'solid',null,'cotton',3,false,1,'M',9900,'2023-09-14');
select pg_temp.add_garment('Overshirt, tobacco','carhartt-wip','overshirt','#9a6136',null,'solid',null,'cotton twill',3,false,2,'M',12900,'2025-02-20');
select pg_temp.add_garment('Wool waistcoat, charcoal','cos','waistcoat','#38393c',null,'solid',null,'wool',2,false,5,'M',8900,'2023-06-11');
select pg_temp.add_garment('Better Sweater fleece','patagonia','fleece','#4c5a5f',null,'solid',null,'recycled polyester',4,false,1,'M',12000,'2022-12-18');

select pg_temp.add_garment('Rain jacket, navy','rains','rain-shell','#232b3a',null,'solid',null,'polyurethane',2,true,2,'M',10500,'2023-04-02');
select pg_temp.add_garment('Torrentshell shell, black','patagonia','rain-shell','#1f1f21',null,'solid',null,'nylon',2,true,1,'M',15000,'2024-08-15');
select pg_temp.add_garment('Down puffer, black','uniqlo','puffer','#1c1c1e',null,'solid',null,'down',5,false,2,'M',7990,'2022-11-25');
select pg_temp.add_garment('Field jacket, olive','carhartt-wip','field-jacket','#4b5236',null,'solid',null,'cotton canvas',3,false,2,'M',18900,'2023-10-01');
select pg_temp.add_garment('Waxed Bedale jacket','barbour','field-jacket','#3b3129',null,'solid',null,'waxed cotton',3,true,3,'M',34900,'2021-11-06');
select pg_temp.add_garment('Bomber jacket, black','cos','bomber','#212123',null,'solid',null,'nylon',3,false,3,'M',14900,'2024-01-20');
select pg_temp.add_garment('Trucker jacket, mid blue','levis','denim-jacket','#4a6a90',null,'solid',null,'denim',3,false,2,'M',11000,'2023-05-13');
select pg_temp.add_garment('Wool overcoat, camel','cos','overcoat','#a8814f',null,'solid',null,'wool',4,false,4,'M',24900,'2022-10-29');
select pg_temp.add_garment('Trench coat, stone','cos','trench','#c4b393',null,'solid',null,'cotton gabardine',3,true,4,'M',19900,'2023-03-04');
select pg_temp.add_garment('Unstructured blazer, navy','arket','blazer','#222c46',null,'solid',null,'wool blend',3,false,4,'M',17900,'2024-02-10');
select pg_temp.add_garment('Down gilet, olive','uniqlo','gilet','#454b34',null,'solid',null,'down',3,false,2,'M',5990,'2023-11-11');

select pg_temp.add_garment('501 jeans, rinse indigo','levis','jeans','#2c3a52',null,'solid',null,'denim',2,false,2,'32',11000,'2024-06-08');
select pg_temp.add_garment('501 jeans, mid wash','levis','jeans','#5a7595',null,'solid',null,'denim',2,false,2,'32',11000,'2023-06-08');
select pg_temp.add_garment('501 jeans, black','levis','jeans','#2a2a2c',null,'solid',null,'denim',2,false,2,'32',11000,'2025-01-30');
select pg_temp.add_garment('Chinos, stone','uniqlo','chinos','#cdbfa4',null,'solid',null,'cotton twill',2,false,3,'32',3990,'2024-04-17');
select pg_temp.add_garment('Chinos, navy','uniqlo','chinos','#232f47',null,'solid',null,'cotton twill',2,false,3,'32',3990,'2024-04-17');
select pg_temp.add_garment('Pleated trousers, brown','arket','trousers','#7d5433',null,'solid',null,'wool blend',3,false,4,'32',9900,'2024-09-05');
select pg_temp.add_garment('Wide trousers, charcoal','cos','trousers','#3c3d40',null,'solid',null,'wool',3,false,4,'32',11900,'2024-10-21');
select pg_temp.add_garment('Suit trousers, navy','cos','suit-trousers','#212a44',null,'solid',null,'wool',2,false,5,'32',12900,'2023-08-12');
select pg_temp.add_garment('Joggers, heather grey','uniqlo','joggers','#9a9a97',null,'solid',null,'cotton',2,false,1,'M',2990,'2024-07-19');
select pg_temp.add_garment('Double-knee pants, hamilton brown','carhartt-wip','trousers','#8b5a2f',null,'solid',null,'cotton duck',3,false,2,'32',10900,'2025-04-03');
select pg_temp.add_garment('Chino shorts, olive','uniqlo','shorts','#4d5335',null,'solid',null,'cotton',1,false,2,'32',2990,'2025-05-28');
select pg_temp.add_garment('Linen shorts, ecru','arket','shorts','#e0d8c6',null,'solid',null,'linen',1,false,2,'32',4500,'2024-06-25');
select pg_temp.add_garment('Hiking trousers, slate','patagonia','technical-trouser','#4a5157',null,'solid',null,'nylon',2,true,1,'32',9000,'2023-07-30');

select pg_temp.add_garment('Two-piece suit, navy','cos','suit','#1f2842',null,'solid',null,'wool',3,false,5,'M',39900,'2023-08-12');

select pg_temp.add_garment('Esplar trainers, white','veja','trainers','#f2f1ec',null,'solid',null,'leather',1,false,3,'44',12000,'2024-03-15');
select pg_temp.add_garment('Campo trainers, black','veja','trainers','#232324',null,'solid',null,'leather',1,false,3,'44',13500,'2025-02-08');
select pg_temp.add_garment('574 trainers, grey','new-balance','trainers','#9b9c99',null,'solid',null,'suede',1,false,2,'44',10000,'2023-04-09');
select pg_temp.add_garment('1080v13 runners','new-balance','runners','#2e3a4d','#c8d24a','solid',null,'mesh',1,false,1,'44',17000,'2025-03-22');
select pg_temp.add_garment('Suede derbies, snuff','grenson','derby','#96633c',null,'solid',null,'suede',2,false,4,'44',22000,'2023-09-26');
select pg_temp.add_garment('Oxfords, black','grenson','oxford-shoe','#1d1c1b',null,'solid',null,'leather',2,false,5,'44',29500,'2022-09-17');
select pg_temp.add_garment('Penny loafers, brown','grenson','loafer','#6b4527',null,'solid',null,'leather',1,false,4,'44',24000,'2024-05-04');
select pg_temp.add_garment('Chelsea boots, black','dr-martens','chelsea-boot','#1f1e1d',null,'solid',null,'leather',3,true,3,'44',18000,'2022-10-14');
select pg_temp.add_garment('1460 boots, cherry red','dr-martens','work-boot','#6d2a26',null,'solid',null,'leather',3,true,2,'44',19000,'2021-10-02');

select pg_temp.add_garment('Leather belt, brown','grenson','belt','#6f4a2b',null,'solid',null,'leather',0,false,4,'32',6500,'2023-02-11');
select pg_temp.add_garment('Leather belt, black','grenson','belt','#211f1e',null,'solid',null,'leather',0,false,4,'32',6500,'2023-02-11');
select pg_temp.add_garment('Lambswool scarf, grey check','arket','scarf','#8d8f8c','#4a4c4f','check','large','lambswool',2,false,3,null,4500,'2023-12-03');
select pg_temp.add_garment('Ribbed beanie, charcoal','norse-projects','beanie','#3b3c3f',null,'solid',null,'wool',2,false,2,null,4000,'2022-12-09');
select pg_temp.add_garment('Six-panel cap, navy','norse-projects','cap','#1f2740',null,'solid',null,'cotton',1,false,1,null,4500,'2024-05-16');
select pg_temp.add_garment('Wool gloves, black','uniqlo','gloves','#232324',null,'solid',null,'wool',2,false,2,null,1990,'2023-01-07');
select pg_temp.add_garment('Canvas backpack, olive','carhartt-wip','backpack','#484f36',null,'solid',null,'canvas',0,true,1,null,9900,'2024-08-02');

-- Cases the suggestion filter and wardrobe views must handle correctly.
select pg_temp.add_garment('Linen shirt, sky (needs repair)','arket','casual-shirt','#b5c9dc',null,'solid',null,'linen',1,false,3,'40',7500,'2022-06-14','needs_repair');
select pg_temp.add_garment('Cargo trousers, sand (worn out)','carhartt-wip','trousers','#c2ac86',null,'solid',null,'cotton',2,false,1,'32',10900,'2021-05-21','worn');

update public.garments set in_wash = true
 where user_id = '00000000-0000-4000-8000-000000000001'
   and title = 'Loopback sweatshirt, grey';

update public.garments set archived_at = now()
 where user_id = '00000000-0000-4000-8000-000000000001'
   and title = 'Cargo trousers, sand (worn out)';

-- ── Wear history ─────────────────────────────────────────────────────────────
-- Spread over the last 120 days so cost-per-wear, "not worn in 30+ days" and the
-- 2-day exclusion window all have something real to work against. Deterministic
-- (hashtext, not random) so tests that assert on wear counts stay stable.

insert into public.garment_wears (garment_id, worn_on, source)
select g.id,
       (current_date - (offset_days || ' days')::interval)::date,
       'manual'
  from public.garments g
  cross join lateral (
    select generate_series(1, 1 + (abs(hashtext(g.title)) % 9)) as n
  ) counts
  cross join lateral (
    -- Spread each garment's wears across the window, seeded by its title.
    select ((abs(hashtext(g.title || counts.n::text)) % 118) + 1) as offset_days
  ) spread
 where g.user_id = '00000000-0000-4000-8000-000000000001'
   and g.deleted_at is null
   -- Leave a handful never worn, so the "not seen in a while" row is non-empty.
   and abs(hashtext(g.title)) % 11 <> 0
on conflict do nothing;

-- ── Fixture catalogue ────────────────────────────────────────────────────────
-- Enough to build the shop-side screens against. No affiliate feed is approved
-- (§10 decision 1), so these are the only products that exist until M4.

insert into public.retailers (name, domain, affiliate_network, commission_pct, ships_to, delivery_rules, trust_score) values
  ('End Clothing',  'endclothing.com',  'Awin',    7.00, '{"IE","GB","EU"}', '{"flat_cents":695,"free_over_cents":20000}'::jsonb, 82),
  ('Mr Porter',     'mrporter.com',     'Rakuten', 6.00, '{"IE","GB","EU"}', '{"flat_cents":1000,"free_over_cents":25000}'::jsonb, 88),
  ('Arket',         'arket.com',        null,      null, '{"IE","EU"}',      '{"flat_cents":395,"free_over_cents":6000}'::jsonb,  85),
  ('Uniqlo IE',     'uniqlo.com',       null,      null, '{"IE","EU"}',      '{"flat_cents":390,"free_over_cents":5000}'::jsonb,  80),
  -- Non-EU, so the duty line is what makes its ranking honest for an IE user.
  ('Huckberry',     'huckberry.com',    'Impact',  8.00, '{"IE","GB","EU","US"}', '{"flat_cents":1800,"duty_pct":12,"origin":"US"}'::jsonb, 74)
on conflict (domain) do nothing;

create or replace function pg_temp.add_product(
  p_title text, p_brand text, p_category text, p_colour text, p_material text
) returns uuid
language plpgsql
as $$
declare new_id uuid;
begin
  insert into public.products (brand_id, canonical_title, category_id, colour, material, gender)
  values ((select id from public.brands where slug = p_brand),
          p_title,
          (select id from public.categories where slug = p_category),
          p_colour, p_material, 'men')
  returning id into new_id;

  -- One variant per size the fixture user might take, so back-in-size alerts
  -- have something to fire against.
  insert into public.product_variants (product_id, size_label, size_region)
  select new_id, s, 'EU' from unnest(array['S','M','L','XL']) as s
  where (select size_group from public.categories where slug = p_category) in ('tops','shirts');

  insert into public.product_variants (product_id, size_label, size_region)
  select new_id, s, 'EU' from unnest(array['30','32','34','36']) as s
  where (select size_group from public.categories where slug = p_category) = 'waist';

  insert into public.product_variants (product_id, size_label, size_region)
  select new_id, s, 'EU' from unnest(array['42','43','44','45']) as s
  where (select size_group from public.categories where slug = p_category) = 'shoes';

  return new_id;
end;
$$;

select pg_temp.add_product('Harrington Jacket, Navy',        'barbour',        'bomber',      'navy',   'cotton');
select pg_temp.add_product('Shawl Cardigan, Oatmeal',        'arket',          'cardigan',    'oatmeal','wool');
select pg_temp.add_product('Nova Check Overshirt, Brown',    'carhartt-wip',   'overshirt',   'brown',  'cotton twill');
select pg_temp.add_product('Riviera Polo, Navy',             'sunspel',        'polo',        'navy',   'cotton');
select pg_temp.add_product('Aime Leon Derby, Dark Brown',    'grenson',        'derby',       'brown',  'leather');
select pg_temp.add_product('Wool Overcoat, Charcoal',        'cos',            'overcoat',    'charcoal','wool');
select pg_temp.add_product('Nano Puff Gilet, Black',         'patagonia',      'gilet',       'black',  'recycled polyester');
select pg_temp.add_product('Slim Chinos, Dark Olive',        'uniqlo',         'chinos',      'olive',  'cotton twill');
select pg_temp.add_product('Rain Trousers, Navy',            'rains',          'technical-trouser','navy','polyurethane');
select pg_temp.add_product('V-10 Trainers, Extra White',     'veja',           'trainers',    'white',  'leather');

-- Offers with 120 days of price history, so the all-time-low detector has both
-- the >=30 days it needs to make a claim and a genuine low to find.
insert into public.offers (variant_id, retailer_id, url, affiliate_url, price_cents, currency,
                           in_stock, delivery_cents, duty_estimate_cents, ships_to)
select v.id,
       r.id,
       format('https://%s/p/%s/%s', r.domain, p.id, v.size_label),
       format('https://track.example/%s?u=https://%s/p/%s', r.affiliate_network, r.domain, p.id),
       base.price_cents,
       'EUR',
       -- One size out of stock per offer, so size-level stock tags are visible.
       v.size_label <> 'M',
       coalesce((r.delivery_rules ->> 'flat_cents')::int, 0),
       case when r.delivery_rules ? 'duty_pct'
            then (base.price_cents * (r.delivery_rules ->> 'duty_pct')::int) / 100
            else 0 end,
       r.ships_to
  from public.products p
  join public.product_variants v on v.product_id = p.id
  cross join public.retailers r
  cross join lateral (
    select 4000 + (abs(hashtext(p.canonical_title || r.domain)) % 26000) as price_cents
  ) base
 where r.domain in ('endclothing.com', 'mrporter.com', 'huckberry.com')
on conflict (variant_id, retailer_id) do nothing;

-- Daily heartbeat plus movement (spec §5.3: one row per check where price or
-- stock changed, plus a daily heartbeat).
--
-- The history below spans 120 days, so the partitions for every month it touches
-- must exist first: an insert with no matching partition is a hard error, not a
-- silently dropped row. Five months back covers 120 days from any start date.
select public.ensure_price_point_partition(
         (date_trunc('month', current_date) - (n || ' months')::interval)::date)
  from generate_series(0, 5) as n;

insert into public.price_points (offer_id, price_cents, in_stock, observed_at)
select o.id,
       -- A slow drift with a genuine trough around day 40, so "all-time low"
       -- is a real event in the fixture data rather than always today.
       greatest(500, o.price_cents
                     + ((abs(hashtext(o.id::text || d.n::text)) % 1200) - 600)
                     - case when d.n between 38 and 42 then 2500 else 0 end),
       o.in_stock,
       (current_date - (d.n || ' days')::interval)::timestamptz + interval '9 hours'
  from public.offers o
  cross join generate_series(0, 119) as d(n);

commit;

-- The `sync_lab` trigger from migration 0012 already derived colour_primary_lab,
-- colour_secondary_lab and is_neutral on insert. This call is a no-op belt-and-
-- braces check: it returns the row count it touched, so a non-zero result here
-- with unchanged data confirms the trigger and the backfill agree.
select public.backfill_garment_lab('00000000-0000-4000-8000-000000000001')
       as garments_backfilled;
