-- Migration 034 — Per-user persisted saved views for the MAI Tree sidebar.
--
-- Built-in views (Everyone / Family / Friends / Work / School) are NOT stored
-- here — they're hard-coded in the client. This table only stores views a user
-- explicitly created via "Save current as view" in the sidebar.
--
-- filters shape matches the design's FilterSpec:
--   { groups?: string[], tags?: string[], side?: 'mom'|'dad', q?: string,
--     minAge?: number, maxAge?: number, location?: string }
--
-- split is null unless the view is a two-cluster "split view":
--   { left: {...FilterSpec, label: string}, right: {...FilterSpec, label: string} }

CREATE TABLE IF NOT EXISTS public.tree_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'bookmark',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  split JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tree_views ENABLE ROW LEVEL SECURITY;

-- Users manage only their own views. The design requires per-user saved views
-- so Sandra's "Worked in tech" doesn't clutter Kobe's sidebar.
CREATE POLICY "users see their own tree views"
  ON public.tree_views FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users create their own tree views"
  ON public.tree_views FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update their own tree views"
  ON public.tree_views FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete their own tree views"
  ON public.tree_views FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_tree_views_user_family
  ON public.tree_views(user_id, family_id);

COMMENT ON TABLE public.tree_views IS
  'Per-user saved filter presets shown in the MAI Tree sidebar "SAVED VIEWS" section. Built-in views (Everyone / Family / Friends / Work / School) are NOT stored here.';
