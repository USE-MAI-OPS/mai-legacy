-- Migration 019: Griot Discoveries
-- AI-generated insight cards surfaced in the family feed.
-- This table was created ad-hoc in Supabase without a migration file.

CREATE TABLE IF NOT EXISTS griot_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  discovery_type TEXT NOT NULL CHECK (discovery_type IN (
    'connection', 'pattern', 'on_this_day', 'missing_piece', 'milestone'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_entries UUID[] DEFAULT '{}',
  related_members TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_griot_discoveries_family ON griot_discoveries(family_id);
CREATE INDEX IF NOT EXISTS idx_griot_discoveries_created ON griot_discoveries(created_at DESC);

-- RLS
ALTER TABLE griot_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view discoveries in their family"
  ON griot_discoveries FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert discoveries"
  ON griot_discoveries FOR INSERT
  WITH CHECK (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Family members can delete discoveries"
  ON griot_discoveries FOR DELETE
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));
