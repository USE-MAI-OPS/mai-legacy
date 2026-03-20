-- Add position columns so users can manually place nodes on the Legacy Hub canvas
ALTER TABLE family_tree_members
  ADD COLUMN IF NOT EXISTS position_x real DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS position_y real DEFAULT NULL;

-- Add connection_type column (dna, friend, spouse) for explicit link styling
-- Previously inferred from relationship_label, now user-chosen
ALTER TABLE family_tree_members
  ADD COLUMN IF NOT EXISTS connection_type text DEFAULT 'dna'
  CHECK (connection_type IN ('dna', 'friend', 'spouse'));
