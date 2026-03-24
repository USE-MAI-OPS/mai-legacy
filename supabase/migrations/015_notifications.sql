-- Migration 015: Notifications System
-- In-app notification system for social interactions

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'reaction', 'comment', 'reply', 'new_entry',
    'invite_accepted', 'event_reminder', 'goal_completed', 'griot'
  )),
  title TEXT NOT NULL,
  body TEXT,
  reference_type TEXT,        -- 'entry' | 'comment' | 'event' | 'goal'
  reference_id TEXT,          -- ID of the referenced item
  actor_id UUID,              -- who triggered this (null for system/griot)
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- System/server actions can insert notifications for any user in the family
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ) OR user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
