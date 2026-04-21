-- Migration 035 — Per-user bookmarks on entries.
--
-- Each row represents one user marking one entry as "saved for later".
-- Bookmarks are personal to the viewer — other family members don't see them.
-- The (user_id, entry_id) primary key makes toggling idempotent and prevents
-- duplicate rows.

CREATE TABLE IF NOT EXISTS public.entry_bookmarks (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id  UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entry_id)
);

ALTER TABLE public.entry_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see their own bookmarks"
  ON public.entry_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users insert their own bookmarks"
  ON public.entry_bookmarks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete their own bookmarks"
  ON public.entry_bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- For listing a user's bookmarks newest-first.
CREATE INDEX IF NOT EXISTS idx_entry_bookmarks_user_created
  ON public.entry_bookmarks(user_id, created_at DESC);

COMMENT ON TABLE public.entry_bookmarks IS
  'Per-user saved entries. Toggling a bookmark upserts/deletes the row; listing bookmarks returns a user''s entries newest-first.';
