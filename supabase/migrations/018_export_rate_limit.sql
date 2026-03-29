-- Migration 018: Data Export Rate Limiting
-- Add last_export_at to families for 1-export-per-24h rate limiting

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS last_export_at timestamptz;
