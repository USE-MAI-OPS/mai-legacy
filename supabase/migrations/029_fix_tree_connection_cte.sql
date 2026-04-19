-- Migration 029 — Fix recursive CTE in get_connected_tree_member_ids
-- Applied to prod 2026-04-19 via MCP.
--
-- The previous function had THREE branches in a UNION (anchor | parents |
-- children). Postgres segregates recursive CTEs as `non_recursive UNION
-- recursive`, so when there are multiple UNIONs it treats the second
-- branch as part of the non-recursive term — which then illegally
-- references the CTE being defined. Every call threw SQLSTATE 42P19.
--
-- Effect of the bug: all consumers of connection chain (Griot, feed,
-- entries visibility) silently fell back to "just the current user"
-- via the try/catch in src/lib/connection-chain.ts. Griot couldn't see
-- other family members in its roster, connection-filtered feeds were
-- empty, etc.
--
-- Fix: collapse the parents + children branches into a SINGLE recursive
-- branch that unions them via OR inside the JOIN. Also add SET
-- search_path to address the corresponding advisor warning.

CREATE OR REPLACE FUNCTION public.get_connected_tree_member_ids(
  p_family_id uuid,
  p_tree_member_id uuid
)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog, public
AS $function$
DECLARE
  blood_ids UUID[];
  spouse_ids UUID[];
BEGIN
  WITH RECURSIVE blood AS (
    -- Anchor: the starting tree member
    SELECT id, parent_id, parent2_id, spouse_id
    FROM public.family_tree_members
    WHERE id = p_tree_member_id AND family_id = p_family_id

    UNION

    -- Recursive: walk UP to parents OR DOWN to children from any node
    -- already in `blood`. Single recursive branch so Postgres can plan it.
    SELECT tm.id, tm.parent_id, tm.parent2_id, tm.spouse_id
    FROM public.family_tree_members tm
    INNER JOIN blood b
      ON tm.id = b.parent_id
      OR tm.id = b.parent2_id
      OR tm.parent_id = b.id
      OR tm.parent2_id = b.id
    WHERE tm.family_id = p_family_id
  )
  SELECT ARRAY_AGG(DISTINCT id) INTO blood_ids FROM blood;

  SELECT ARRAY_AGG(DISTINCT spouse_id) INTO spouse_ids
  FROM public.family_tree_members
  WHERE id = ANY(COALESCE(blood_ids, '{}'))
    AND spouse_id IS NOT NULL
    AND family_id = p_family_id;

  RETURN ARRAY(
    SELECT DISTINCT unnest FROM (
      SELECT unnest(COALESCE(blood_ids, '{}'))
      UNION
      SELECT unnest(COALESCE(spouse_ids, '{}'))
    ) sub
  );
END;
$function$;
