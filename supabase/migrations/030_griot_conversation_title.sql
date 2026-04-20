-- Migration 030 — Add optional `title` column to griot_conversations so
-- users can rename their Griot chats in the sidebar.
-- Applied to prod 2026-04-19 via MCP.
--
-- Null/empty = fall back to the auto-derived preview (first user
-- message, truncated) so existing rows stay unchanged.

ALTER TABLE public.griot_conversations
  ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN public.griot_conversations.title IS
  'User-supplied conversation label. NULL or empty means fall back to the auto-generated preview.';
