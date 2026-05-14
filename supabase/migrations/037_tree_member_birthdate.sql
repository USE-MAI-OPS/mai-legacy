-- 037: full birth date for tree members (birthday feed cards)
--
-- birth_year already exists (historical schema — year-only was enough for
-- the tree display). For the "today is Alice's birthday" feed generator we
-- need a real DATE so we can compare month+day against today. Adding
-- birth_date nullable + an index over (month, day) for the daily lookup.
--
-- No backfill: birth_year alone isn't enough to reconstruct a date, so we
-- leave the new column NULL and let users populate it via the tree editor.

ALTER TABLE family_tree_members
  ADD COLUMN IF NOT EXISTS birth_date DATE NULL;

-- Fast "who has a birthday on this month+day" lookup. Partial index skips
-- the large swath of rows with no birth_date set.
CREATE INDEX IF NOT EXISTS idx_tree_members_birth_date_md
  ON family_tree_members (
    (EXTRACT(MONTH FROM birth_date)),
    (EXTRACT(DAY FROM birth_date))
  )
  WHERE birth_date IS NOT NULL;

COMMENT ON COLUMN family_tree_members.birth_date IS
  'Full birth date (for birthday feed cards). birth_year kept for back-compat.';
