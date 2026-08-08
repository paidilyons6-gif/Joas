-- 0005 — vector indexes on both image_embedding columns (spec §2).
--
-- HNSW rather than IVFFlat: IVFFlat's recall depends on the list count being
-- tuned to a row count we don't have yet, and it must be rebuilt as the
-- catalogue grows. HNSW needs no training pass and degrades gracefully on an
-- empty table, which matters because both tables start empty.
--
-- Cosine distance, because the embeddings are L2-normalised at write time in
-- the embed-garment function. If that ever stops being true, these indexes
-- answer the wrong question — see supabase/functions/embed-garment/index.ts.

create index garments_image_embedding_idx
  on public.garments
  using hnsw (image_embedding vector_cosine_ops);

create index products_image_embedding_idx
  on public.products
  using hnsw (image_embedding vector_cosine_ops);
