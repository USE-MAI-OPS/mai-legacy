-- Migration 017: Fix family_id type mismatch
-- entry_reactions, entry_comments, notifications use TEXT but should be UUID
-- to match families(id) type and enable FK constraints.

-- 1. Fix entry_reactions.family_id
ALTER TABLE entry_reactions
  ALTER COLUMN family_id TYPE UUID USING family_id::uuid;

ALTER TABLE entry_reactions
  ADD CONSTRAINT fk_entry_reactions_family
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

-- 2. Fix entry_comments.family_id
ALTER TABLE entry_comments
  ALTER COLUMN family_id TYPE UUID USING family_id::uuid;

ALTER TABLE entry_comments
  ADD CONSTRAINT fk_entry_comments_family
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

-- 3. Fix notifications.family_id
ALTER TABLE notifications
  ALTER COLUMN family_id TYPE UUID USING family_id::uuid;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_family
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
