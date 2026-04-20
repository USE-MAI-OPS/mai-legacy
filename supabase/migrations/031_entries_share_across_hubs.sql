-- Migration 031 — Add `share_across_hubs` to entries so an author's
-- memories appear in every family/circle they belong to by default.
-- Applied to prod 2026-04-19 via MCP.
--
-- Product rule: when a user creates an entry, it should show up in
-- any hub where they're a member (so switching from "The Powells"
-- to "Twin Motion" still lets you see your own entries). They can
-- opt OUT per-entry at creation time by unticking "Share with all
-- my families & circles".
--
-- Default TRUE so every existing row immediately becomes cross-hub
-- visible to its author — this matches the behavior the product
-- would have had from day one if we'd modeled it right.

ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS share_across_hubs BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.entries.share_across_hubs IS
  'When true (default), the entry is visible to its author in every family/circle they belong to, not just the hub it was created in. When false, the entry is scoped only to the creating family_id.';
