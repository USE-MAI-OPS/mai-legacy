-- Enhance family traditions with richer features
ALTER TABLE family_traditions
  ADD COLUMN IF NOT EXISTS next_occurrence date,
  ADD COLUMN IF NOT EXISTS last_celebrated date,
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS participants uuid[] DEFAULT '{}';

-- Tradition memories: photos/notes for each celebration
CREATE TABLE IF NOT EXISTS tradition_memories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tradition_id uuid REFERENCES family_traditions(id) ON DELETE CASCADE,
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  images text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  celebrated_on date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tradition_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can manage tradition memories"
  ON tradition_memories FOR ALL
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));
