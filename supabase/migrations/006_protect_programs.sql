-- Prevent clients from self-granting program entitlements.
-- Only service role (webhook) may change profiles.programs.

create or replace function public.protect_profile_entitlements()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' and auth.uid() = old.id then
    new.plan := old.plan;
    new.stripe_customer_id := old.stripe_customer_id;
    new.is_admin := old.is_admin;
    new.programs := old.programs;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
