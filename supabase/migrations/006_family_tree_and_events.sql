-- MAI Legacy: Family Tree, Events, and RSVPs
-- Adds family tree nodes (with placeholder support), events, and RSVP tracking

-- ============================================================================
-- 1. FAMILY TREE MEMBERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.family_tree_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  relationship_label TEXT,
  parent_id UUID REFERENCES public.family_tree_members(id) ON DELETE SET NULL,
  spouse_id UUID REFERENCES public.family_tree_members(id) ON DELETE SET NULL,
  linked_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  birth_year INTEGER,
  is_deceased BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.family_tree_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER family_tree_members_updated_at
  BEFORE UPDATE ON public.family_tree_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_family_tree_members_family ON public.family_tree_members(family_id);
CREATE INDEX idx_family_tree_members_parent ON public.family_tree_members(parent_id);

-- RLS policies
CREATE POLICY "Family members can view tree members"
  ON public.family_tree_members FOR SELECT
  USING (family_id IN (SELECT public.get_user_family_ids()));

CREATE POLICY "Family members can add tree members"
  ON public.family_tree_members FOR INSERT
  WITH CHECK (
    added_by = auth.uid() AND
    family_id IN (SELECT public.get_user_family_ids())
  );

CREATE POLICY "Family members can update tree members"
  ON public.family_tree_members FOR UPDATE
  USING (family_id IN (SELECT public.get_user_family_ids()));

CREATE POLICY "Family members can delete tree members"
  ON public.family_tree_members FOR DELETE
  USING (family_id IN (SELECT public.get_user_family_ids()));

-- ============================================================================
-- 2. FAMILY EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.family_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.family_events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER family_events_updated_at
  BEFORE UPDATE ON public.family_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_family_events_family_date ON public.family_events(family_id, event_date);

-- RLS policies
CREATE POLICY "Family members can view events"
  ON public.family_events FOR SELECT
  USING (family_id IN (SELECT public.get_user_family_ids()));

CREATE POLICY "Family members can create events"
  ON public.family_events FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    family_id IN (SELECT public.get_user_family_ids())
  );

CREATE POLICY "Event creators can update"
  ON public.family_events FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Event creators can delete"
  ON public.family_events FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- 3. EVENT RSVPs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.family_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Family members can view RSVPs"
  ON public.event_rsvps FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.family_events
      WHERE family_id IN (SELECT public.get_user_family_ids())
    )
  );

CREATE POLICY "Users can create their own RSVP"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RSVP"
  ON public.event_rsvps FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own RSVP"
  ON public.event_rsvps FOR DELETE
  USING (user_id = auth.uid());
