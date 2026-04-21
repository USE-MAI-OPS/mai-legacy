-- Migration 033 — Profile fields on family_tree_members needed by the new
-- MAI Tree handoff design. Adds:
--   side      : mom|dad|null  (which side of the family — drives "Mom's side" / "Dad's side" views)
--   tags      : text[]        (free-form tags used by custom views: "tech", "Morehouse", "healthcare", ...)
--   occupation: text
--   location  : text          (city, state)
--   bio       : text          (quote shown in profile modal)
-- age is still derived from birth_year, no column needed.

ALTER TABLE public.family_tree_members
  ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('mom','dad')),
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE INDEX IF NOT EXISTS idx_family_tree_members_side
  ON public.family_tree_members(family_id, side);

CREATE INDEX IF NOT EXISTS idx_family_tree_members_tags
  ON public.family_tree_members USING GIN (tags);

COMMENT ON COLUMN public.family_tree_members.side IS
  'Which side of the family this person is on. Only meaningful for group_type=family. Powers the Mom''s side / Dad''s side views.';
COMMENT ON COLUMN public.family_tree_members.tags IS
  'Free-form tags used by custom views and Griot queries (e.g. "tech", "Morehouse", "healthcare"). Empty array = untagged.';
