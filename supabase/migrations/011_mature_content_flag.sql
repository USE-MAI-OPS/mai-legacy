-- Add mature content flag to entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_mature boolean NOT NULL DEFAULT false;
