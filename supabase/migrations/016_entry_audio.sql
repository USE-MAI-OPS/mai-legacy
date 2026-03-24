-- Migration 016: Entry Audio Layer
-- Add audio narration support to entries

ALTER TABLE entries ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS audio_duration INTEGER; -- seconds
