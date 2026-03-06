-- MAI Legacy: Schema Updates
-- Adds profile fields, traditions, structured entries, and goals

-- ============================================================================
-- 1. ADD PROFILE COLUMNS TO FAMILY_MEMBERS
-- ============================================================================
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS specialty text;

-- ============================================================================
-- 2. ADD STRUCTURED DATA COLUMN TO ENTRIES
-- ============================================================================
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS structured_data jsonb DEFAULT NULL;

-- ============================================================================
-- 3. FAMILY TRADITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.family_traditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT 'annual',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_traditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view traditions"
  ON public.family_traditions FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Family members can create traditions"
  ON public.family_traditions FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update traditions"
  ON public.family_traditions FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Authors can delete traditions"
  ON public.family_traditions FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- 4. FAMILY GOALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.family_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  target_count integer NOT NULL DEFAULT 1,
  current_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived')),
  assigned_to uuid[] DEFAULT '{}',
  due_date timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_goals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER family_goals_updated_at
  BEFORE UPDATE ON public.family_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Family members can view goals"
  ON public.family_goals FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Family members can create goals"
  ON public.family_goals FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can update goals"
  ON public.family_goals FOR UPDATE
  USING (family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Goal creators can delete"
  ON public.family_goals FOR DELETE
  USING (created_by = auth.uid());
