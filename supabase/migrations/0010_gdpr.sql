-- 0010 — GDPR data export and account deletion.
--
-- Spec §7: "Data export and full account deletion must be implemented, not
-- stubbed." Export is a SQL function the client can call directly. Deletion
-- needs to remove auth.users and storage objects too, which requires the
-- service role, so the client records a request here and the
-- delete-account Edge Function carries it out.

-- Everything we hold about the caller, in one JSON document (Art. 15 / Art. 20).
-- Structured rather than flattened so it is genuinely portable, not just a dump.
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security invoker   -- runs as the caller, so RLS scopes it to their own rows
set search_path = public
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'format_version', 1,
    'profile',   (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'prefs',     (select to_jsonb(up) from public.user_prefs up where up.user_id = auth.uid()),
    'sizes',     coalesce((select jsonb_agg(to_jsonb(us)) from public.user_sizes us
                            where us.user_id = auth.uid()), '[]'::jsonb),
    'garments',  coalesce((select jsonb_agg(
                              to_jsonb(g) - 'image_embedding'   -- 512 floats, not portable information
                              || jsonb_build_object('image_path', g.image_path))
                            from public.garments g
                            where g.user_id = auth.uid() and g.deleted_at is null), '[]'::jsonb),
    'garment_wears', coalesce((select jsonb_agg(to_jsonb(gw)) from public.garment_wears gw
                            where gw.user_id = auth.uid()), '[]'::jsonb),
    'outfits',   coalesce((select jsonb_agg(
                              to_jsonb(o) || jsonb_build_object(
                                'items', (select jsonb_agg(to_jsonb(oi)) from public.outfit_items oi
                                           where oi.outfit_id = o.id)))
                            from public.outfits o
                            where o.user_id = auth.uid() and o.deleted_at is null), '[]'::jsonb),
    'outfit_wears', coalesce((select jsonb_agg(to_jsonb(ow)) from public.outfit_wears ow
                            where ow.user_id = auth.uid()), '[]'::jsonb),
    'watches',   coalesce((select jsonb_agg(to_jsonb(w)) from public.watches w
                            where w.user_id = auth.uid()), '[]'::jsonb),
    'alerts',    coalesce((select jsonb_agg(to_jsonb(a)) from public.alerts a
                            where a.user_id = auth.uid()), '[]'::jsonb),
    'entitlement', (select to_jsonb(e) - 'provider_state' from public.entitlements e
                     where e.user_id = auth.uid())
  );
$$;

grant execute on function public.export_my_data() to authenticated;

-- Deletion requests. Kept as a row so the deletion is auditable and so a failed
-- run can be retried rather than leaving a half-deleted account.
create table public.deletion_requests (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  error        text
);

alter table public.deletion_requests enable row level security;

create policy deletion_requests_own on public.deletion_requests
  for select to authenticated using (user_id = auth.uid());

create policy deletion_requests_insert_own on public.deletion_requests
  for insert to authenticated with check (user_id = auth.uid());

-- Deleting auth.users cascades through profiles to every user-owned table via
-- the FK chain. Storage objects do not cascade — the Edge Function removes the
-- user's `<uid>/` prefix explicitly before deleting the auth row.
