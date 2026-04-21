-- Migration 032 — Add `group_type` to family_tree_members so the MAI Tree
-- sidebar presets (Family/Friends/Work/School) and Griot-driven view specs
-- can filter by the social group a person belongs to.
--
-- Separate from `connection_type` (dna/friend/spouse) which dictates line
-- styling. A cousin is connection_type=dna but may be group_type=work if
-- you work together — the two dimensions are independent.
--
-- Backfill: every existing row predates the tree-as-network rework and
-- was added as a family member, so seed 'family' for all existing rows.

ALTER TABLE public.family_tree_members
  ADD COLUMN IF NOT EXISTS group_type TEXT
  CHECK (group_type IN ('family','friend','work','school','mentor','community','other'));

UPDATE public.family_tree_members
  SET group_type = 'family'
  WHERE group_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_family_tree_members_group_type
  ON public.family_tree_members(family_id, group_type);

COMMENT ON COLUMN public.family_tree_members.group_type IS
  'Social group this person belongs to (family/friend/work/school/mentor/community/other). Drives sidebar preset filters and Griot view-specs. Independent of connection_type which controls line styling.';
