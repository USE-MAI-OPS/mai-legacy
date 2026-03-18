-- Migration: Switch from OpenAI text-embedding-3-small (1536 dims) to
-- Google Gemini text-embedding-004 (768 dims).
--
-- This migration:
--   1. Drops existing embeddings (they must be re-generated with the new model)
--   2. Alters the vector column from 1536 to 768 dimensions
--   3. Rebuilds the HNSW index
--   4. Updates the match_entry_embeddings RPC function

-- 1. Clear old embeddings (they are incompatible with the new model)
TRUNCATE public.entry_embeddings;

-- 2. Drop the old HNSW index before altering the column
DROP INDEX IF EXISTS entry_embeddings_embedding_idx;

-- 3. Alter the embedding column to 768 dimensions
ALTER TABLE public.entry_embeddings
  ALTER COLUMN embedding TYPE vector(768)
  USING embedding::vector(768);

-- 4. Recreate the HNSW index for 768-dim vectors
CREATE INDEX ON public.entry_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 5. Update the match function for the new vector size
CREATE OR REPLACE FUNCTION public.match_entry_embeddings(
  query_embedding vector(768),
  match_family_id UUID,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  allowed_author_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  entry_id UUID,
  chunk_text TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ee.id,
    ee.entry_id,
    ee.chunk_text,
    1 - (ee.embedding <=> query_embedding) AS similarity
  FROM public.entry_embeddings ee
  INNER JOIN public.entries e ON ee.entry_id = e.id
  WHERE ee.family_id = match_family_id
    AND 1 - (ee.embedding <=> query_embedding) > match_threshold
    AND (allowed_author_ids IS NULL OR e.author_id = ANY(allowed_author_ids))
  ORDER BY ee.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
