-- Migration 014: Reactions & Comments
-- Adds social engagement layer to entries

-- Entry reactions (one per user per entry)
CREATE TABLE IF NOT EXISTS entry_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'pray', 'laugh', 'cry', 'fire')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

-- Entry comments (threaded)
CREATE TABLE IF NOT EXISTS entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id TEXT NOT NULL,
  parent_comment_id UUID REFERENCES entry_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_entry ON entry_reactions(entry_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON entry_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_entry ON entry_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON entry_comments(parent_comment_id);

-- RLS
ALTER TABLE entry_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_comments ENABLE ROW LEVEL SECURITY;

-- Reactions: users can see reactions in their family
CREATE POLICY "Users can view reactions in their family"
  ON entry_reactions FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own reactions"
  ON entry_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid() AND family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own reactions"
  ON entry_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Comments: users can see comments in their family
CREATE POLICY "Users can view comments in their family"
  ON entry_comments FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert comments in their family"
  ON entry_comments FOR INSERT
  WITH CHECK (user_id = auth.uid() AND family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own comments"
  ON entry_comments FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON entry_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
