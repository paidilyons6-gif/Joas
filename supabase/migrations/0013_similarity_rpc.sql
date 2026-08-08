-- 0013 — nearest-neighbour lookups over the embedding columns.
--
-- Exposed as RPCs rather than built in the client because pgvector's operators
-- are not expressible through the REST filter syntax, and because the ORDER BY
-- has to be written exactly this way for the HNSW index to be used at all.
--
-- `<=>` is cosine distance, in 0..2. The vectors are L2-normalised at write time
-- (see supabase/functions/embed-garment), so similarity is 1 - distance.

-- Intake classification (spec §3 step 3): what catalogue products does this
-- photo look like?
create or replace function public.match_products_by_embedding(
  query_embedding vector(512),
  match_count integer default 5
)
returns table (
  product_id    uuid,
  similarity    double precision,
  canonical_title text,
  category_slug text,
  colour        text,
  material      text,
  brand_id      uuid,
  brand_name    text
)
language sql
stable
security invoker   -- products is readable by any authenticated user; RLS still applies
set search_path = public
as $$
  select p.id,
         1 - (p.image_embedding <=> query_embedding) as similarity,
         p.canonical_title,
         c.slug,
         p.colour,
         p.material,
         b.id,
         b.name
    from public.products p
    left join public.categories c on c.id = p.category_id
    left join public.brands b on b.id = p.brand_id
   where p.image_embedding is not null
   order by p.image_embedding <=> query_embedding
   limit least(greatest(match_count, 1), 50);
$$;

grant execute on function public.match_products_by_embedding(vector, integer) to authenticated;

-- "Find it" (spec §6.7) and the redundancy warning (§4.4): what do I already own
-- that looks like this?
create or replace function public.match_my_garments_by_embedding(
  query_embedding vector(512),
  match_count integer default 10
)
returns table (
  garment_id uuid,
  similarity double precision,
  title      text,
  category_slug text,
  image_path text
)
language sql
stable
security invoker   -- garments RLS restricts this to the caller's own wardrobe
set search_path = public
as $$
  select g.id,
         1 - (g.image_embedding <=> query_embedding) as similarity,
         g.title,
         c.slug,
         g.image_path
    from public.garments g
    left join public.categories c on c.id = g.category_id
   where g.image_embedding is not null
     and g.deleted_at is null
   order by g.image_embedding <=> query_embedding
   limit least(greatest(match_count, 1), 50);
$$;

grant execute on function public.match_my_garments_by_embedding(vector, integer) to authenticated;
