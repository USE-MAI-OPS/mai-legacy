-- Migration 028 — Restore SELECT (LIST) on entry-images / entry-audio
-- for AUTHENTICATED users only. Applied to prod 2026-04-19 via MCP.
--
-- Migration 027 dropped the "Public read access" SELECT policies that
-- allowed anonymous LIST on storage.objects. That was correct for the
-- anonymous-enumeration concern, but the app itself legitimately needs
-- to LIST its own buckets:
--
--   - src/lib/supabase/storage.ts uploadFamilyCover() calls
--     storage.from('entry-images').list('covers/{familyId}') to find
--     and remove existing covers before uploading a new one.
--   - getFamilyCoverUrl() calls the same .list() to locate the uploaded
--     file and build its public URL.
--
-- Without SELECT, .list() silently returns []. Cover uploads succeed
-- on the storage side but the component never gets a URL back, so the
-- UI looks like it does nothing ("page semi refreshes then no image").
--
-- Restore SELECT scoped to authenticated. Anonymous enumeration stays
-- blocked. Anonymous GET-by-URL continues to work via the public-bucket
-- CDN path (bucket.public=true is independent of storage.objects RLS).

CREATE POLICY "Authenticated can list entry-images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'entry-images');

CREATE POLICY "Authenticated can list entry-audio"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'entry-audio');
