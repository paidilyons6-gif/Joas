-- 0008 — tunable scorer weights (spec §4.2: "store the weights in a config
-- table so they can be tuned without shipping a build").
--
-- The app ships with the same defaults baked into packages/core/src/config.ts
-- so the scorer works offline and on first launch. This table overrides them
-- when reachable. Precedence: remote row > baked-in default.

create table public.scoring_config (
  key         text primary key,
  value       jsonb not null,
  description text not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
select public.apply_touch_trigger('public.scoring_config');

alter table public.scoring_config enable row level security;

-- Every client reads it; only the service role writes it.
create policy scoring_config_read on public.scoring_config
  for select to authenticated using (true);

insert into public.scoring_config (key, value, description) values
  ('coherence_weights',
   '{"colour_harmony": 30, "formality_spread": 25, "warmth_fit": 20, "pattern_load": 15, "proportion_material": 10}'::jsonb,
   'Component weights for the coherence score. Must sum to 100.'),

  ('colour_thresholds',
   '{"near_miss_delta_e_min": 2.0, "near_miss_delta_e_max": 18.0, "monochrome_hue_deg": 12, "analogous_hue_deg": 45, "complementary_hue_deg": 150, "neutral_chroma_max": 12}'::jsonb,
   'CIELAB thresholds. near_miss is the "two browns fighting" band: small but non-zero ΔE, penalised harder than an outright clash.'),

  ('warmth_targets',
   '{"freezing": 11, "cold": 9, "cool": 7, "mild": 5, "warm": 3, "hot": 2}'::jsonb,
   'Target sum of warmth_rating across an outfit, by temperature band.'),

  ('suggestion_params',
   '{"recent_wear_exclusion_days": 2, "novelty_days": 30, "novelty_boost": 6, "proven_boost": 8, "max_candidates": 3000, "results_returned": 3}'::jsonb,
   'Daily suggestion engine (spec §4.3).'),

  ('price_thresholds',
   '{"all_time_low_min_history_days": 30, "alert_dedupe_hours": 48, "default_daily_alert_cap": 3}'::jsonb,
   'Price-low detection and alert throttling (spec §5.3).');
