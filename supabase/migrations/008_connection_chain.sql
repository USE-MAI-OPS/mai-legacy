-- ============================================================================
-- 008: Connection Chain — Family Visibility Through Blood + Marriage
-- ============================================================================
-- Adds parent2_id to support dual-parent linking, plus PostgreSQL functions
-- that compute connected family members via recursive CTE traversal.
-- ============================================================================

-- 1a. Add second parent column
ALTER TABLE public.family_tree_members
  ADD COLUMN IF NOT EXISTS parent2_id UUID REFERENCES public.family_tree_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_family_tree_members_parent2
  ON public.family_tree_members(parent2_id);

-- 1b. Recursive CTE: get all connected tree member IDs from a starting node
-- Traverses blood relationships (parent_id, parent2_id up; children down)
-- then collects spouses of all blood relatives (but does NOT traverse from spouses)
CREATE OR REPLACE FUNCTION public.get_connected_tree_member_ids(
  p_family_id UUID,
  p_tree_member_id UUID
)
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  blood_ids UUID[];
  spouse_ids UUID[];
BEGIN
  -- Recursive CTE: traverse all blood relationships
  WITH RECURSIVE blood AS (
    -- Seed: the user's own tree node
    SELECT id, parent_id, parent2_id, spouse_id
    FROM public.family_tree_members
    WHERE id = p_tree_member_id AND family_id = p_family_id

    UNION

    -- Go UP: find parents of anyone already in the set
    SELECT p.id, p.parent_id, p.parent2_id, p.spouse_id
    FROM public.family_tree_members p
    INNER JOIN blood b ON (p.id = b.parent_id OR p.id = b.parent2_id)
    WHERE p.family_id = p_family_id

    UNION

    -- Go DOWN: find children of anyone already in the set
    SELECT c.id, c.parent_id, c.parent2_id, c.spouse_id
    FROM public.family_tree_members c
    INNER JOIN blood b ON (c.parent_id = b.id OR c.parent2_id = b.id)
    WHERE c.family_id = p_family_id
  )
  SELECT ARRAY_AGG(DISTINCT id) INTO blood_ids FROM blood;

  -- Collect spouses of all blood relatives
  SELECT ARRAY_AGG(DISTINCT spouse_id) INTO spouse_ids
  FROM public.family_tree_members
  WHERE id = ANY(COALESCE(blood_ids, '{}'))
    AND spouse_id IS NOT NULL
    AND family_id = p_family_id;

  -- Return union of blood + spouse IDs
  RETURN ARRAY(
    SELECT DISTINCT unnest FROM (
      SELECT unnest(COALESCE(blood_ids, '{}'))
      UNION
      SELECT unnest(COALESCE(spouse_ids, '{}'))
    ) sub
  );
END;
$$;

-- 1c. Map connected tree members → auth user IDs (for filtering entries)
CREATE OR REPLACE FUNCTION public.get_connected_user_ids(
  p_family_id UUID,
  p_user_id UUID
)
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  my_tree_member_id UUID;
  connected_tree_ids UUID[];
  connected_user_ids UUID[];
BEGIN
  -- Find the user's tree member node
  SELECT ftm.id INTO my_tree_member_id
  FROM public.family_tree_members ftm
  INNER JOIN public.family_members fm ON ftm.linked_member_id = fm.id
  WHERE fm.user_id = p_user_id
    AND ftm.family_id = p_family_id
  LIMIT 1;

  -- If user has no tree node, return just their own user_id
  IF my_tree_member_id IS NULL THEN
    RETURN ARRAY[p_user_id];
  END IF;

  -- Get connected tree member IDs via blood + spouse traversal
  connected_tree_ids := public.get_connected_tree_member_ids(p_family_id, my_tree_member_id);

  -- Map tree members → family_members → user_ids
  SELECT ARRAY_AGG(DISTINCT fm.user_id) INTO connected_user_ids
  FROM public.family_tree_members ftm
  INNER JOIN public.family_members fm ON ftm.linked_member_id = fm.id
  WHERE ftm.id = ANY(connected_tree_ids)
    AND fm.user_id IS NOT NULL;

  -- Always include the requesting user themselves
  IF NOT (p_user_id = ANY(COALESCE(connected_user_ids, '{}'))) THEN
    connected_user_ids := ARRAY_APPEND(COALESCE(connected_user_ids, '{}'), p_user_id);
  END IF;

  RETURN connected_user_ids;
END;
$$;

-- 1d. Update match_entry_embeddings to support author filtering
CREATE OR REPLACE FUNCTION public.match_entry_embeddings(
  query_embedding vector(1536),
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
