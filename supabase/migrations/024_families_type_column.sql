-- Add type column to families table to distinguish families from circles
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'family';

-- Add check constraint
ALTER TABLE public.families
  ADD CONSTRAINT families_type_check CHECK (type IN ('family', 'circle'));

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_families_type ON public.families(type);
