-- Migration 019: Add missing indexes for query performance
-- Targets slow-query hot paths identified in feed, griot, social, and tree features.

-- ============================================================
-- entries: most queried table in the app
-- ============================================================

-- Feed pagination: WHERE family_id = X ORDER BY created_at DESC
-- Also covers cursor-based pagination (lt created_at)
CREATE INDEX IF NOT EXISTS idx_entries_family_created
  ON public.entries (family_id, created_at DESC);

-- Author filtering: WHERE author_id IN (...) or eq
CREATE INDEX IF NOT EXISTS idx_entries_author
  ON public.entries (author_id);

-- Type count checks in feed: WHERE family_id = X AND type = T
CREATE INDEX IF NOT EXISTS idx_entries_family_type
  ON public.entries (family_id, type);

-- ============================================================
-- entry_comments: threaded comment ordering
-- ============================================================

-- Comments ordered by created_at: WHERE entry_id = X ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_comments_entry_created
  ON public.entry_comments (entry_id, created_at ASC);

-- ============================================================
-- entry_embeddings: embed pipeline deletes by entry_id
-- ============================================================

-- Delete old chunks before re-embedding: WHERE entry_id = X
CREATE INDEX IF NOT EXISTS idx_entry_embeddings_entry
  ON public.entry_embeddings (entry_id);

-- ============================================================
-- family_members: most joined table across all routes
-- ============================================================

-- User lookup across families: WHERE user_id = X
CREATE INDEX IF NOT EXISTS idx_family_members_user
  ON public.family_members (user_id);

-- Family member listing: WHERE family_id = X
CREATE INDEX IF NOT EXISTS idx_family_members_family
  ON public.family_members (family_id);

-- ============================================================
-- family_tree_members: tree traversal and member mapping
-- ============================================================

-- Tree-to-member mapping used in connection-chain and griot:
-- WHERE family_id = X AND linked_member_id IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_family_tree_linked_member
  ON public.family_tree_members (family_id, linked_member_id)
  WHERE linked_member_id IS NOT NULL;

-- Spouse bidirectional sync: WHERE spouse_id = X
CREATE INDEX IF NOT EXISTS idx_family_tree_spouse
  ON public.family_tree_members (spouse_id)
  WHERE spouse_id IS NOT NULL;

-- ============================================================
-- griot_conversations: per-user conversation lookups
-- ============================================================

-- Griot context fetch: WHERE family_id = X AND user_id = X
CREATE INDEX IF NOT EXISTS idx_griot_family_user
  ON public.griot_conversations (family_id, user_id);

-- ============================================================
-- family_invites: invite lookup and link-based flows
-- ============================================================

-- List invites for a family: WHERE family_id = X
CREATE INDEX IF NOT EXISTS idx_family_invites_family
  ON public.family_invites (family_id);

-- Email-based invite lookup: WHERE email = X
CREATE INDEX IF NOT EXISTS idx_family_invites_email
  ON public.family_invites (email)
  WHERE email IS NOT NULL;

-- ============================================================
-- family_traditions: tradition listing per family
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_family_traditions_family
  ON public.family_traditions (family_id);

-- ============================================================
-- tradition_memories: memories by tradition or family
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tradition_memories_tradition
  ON public.tradition_memories (tradition_id);

CREATE INDEX IF NOT EXISTS idx_tradition_memories_family
  ON public.tradition_memories (family_id);

-- ============================================================
-- family_goals: goal listing per family
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_family_goals_family
  ON public.family_goals (family_id);

-- ============================================================
-- interview_transcripts: transcript listing per family
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_interview_transcripts_family
  ON public.interview_transcripts (family_id);

-- ============================================================
-- event_rsvps: RSVP lookup by user
-- ============================================================

-- Find a user's RSVPs across events: WHERE user_id = X
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user
  ON public.event_rsvps (user_id);
