-- Migration 018: Direct Messages
-- Creates dm_conversations and direct_messages tables.
-- These were created ad-hoc in Supabase without migration files.

-- DM Conversations
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  participant_ids UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dm_conversations_family ON dm_conversations(family_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_updated ON dm_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(conversation_id, read) WHERE read = FALSE;

-- RLS
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can see conversations they participate in
CREATE POLICY "Users can view their conversations"
  ON dm_conversations FOR SELECT
  USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
    AND auth.uid() = ANY(participant_ids)
  );

CREATE POLICY "Users can create conversations in their family"
  ON dm_conversations FOR INSERT
  WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
    AND auth.uid() = ANY(participant_ids)
  );

CREATE POLICY "Participants can update conversation"
  ON dm_conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Messages: users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON direct_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM dm_conversations
      WHERE auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON direct_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM dm_conversations
      WHERE auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON direct_messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM dm_conversations
      WHERE auth.uid() = ANY(participant_ids)
    )
  );
