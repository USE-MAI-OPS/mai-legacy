-- Migration 036 — Family group conversations ("Message Board")
--
-- Each hub gets exactly one group conversation. All current members are in
-- participant_ids. Joiners (invite acceptance, createFamily) and creators are
-- added by the corresponding server actions; this migration just backfills
-- rows for existing hubs so the feature works for current users out of the gate.
--
-- We reuse the existing dm_conversations / direct_messages tables rather than
-- introducing a parallel schema, so the messages UI and RLS keep working. A
-- new `type` column distinguishes group conversations from 1:1 DMs.

-- 1. Add the type column
ALTER TABLE public.dm_conversations
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'direct';

-- 2. Enforce allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dm_conversations_type_check'
  ) THEN
    ALTER TABLE public.dm_conversations
      ADD CONSTRAINT dm_conversations_type_check
      CHECK (type IN ('direct', 'family_group'));
  END IF;
END
$$;

-- 3. Ensure at most one group conversation per family
CREATE UNIQUE INDEX IF NOT EXISTS dm_conversations_one_group_per_family
  ON public.dm_conversations (family_id)
  WHERE type = 'family_group';

-- 4. Backfill: for every family that doesn't yet have a group conversation,
--    create one containing all current members as participants. participant_ids
--    is TEXT[] per migration 017-021 history, so cast user_id explicitly.
INSERT INTO public.dm_conversations (family_id, type, participant_ids, last_message_at)
SELECT
  f.id,
  'family_group',
  COALESCE(
    (
      SELECT array_agg(fm.user_id::text)
      FROM public.family_members fm
      WHERE fm.family_id = f.id
    ),
    ARRAY[]::text[]
  ),
  NULL
FROM public.families f
WHERE NOT EXISTS (
  SELECT 1
  FROM public.dm_conversations dc
  WHERE dc.family_id = f.id AND dc.type = 'family_group'
);

COMMENT ON COLUMN public.dm_conversations.type IS
  'direct = 1:1 DM, family_group = per-hub "Message Board" group chat';
