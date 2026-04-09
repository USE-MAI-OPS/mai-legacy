-- Migration 020: Entry Visibility Column
-- Adds the visibility column to entries for public/link sharing.
-- This column is used in code but had no migration file.

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'family'
  CHECK (visibility IN ('family', 'link', 'public'));
