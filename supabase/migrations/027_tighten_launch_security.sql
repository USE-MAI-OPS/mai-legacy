-- Migration 027 — Launch hardening
-- Applied to prod 2026-04-19 via Supabase SQL editor (during pre-launch audit).
--
-- 1. entry_embeddings "Service role can manage embeddings" previously applied
--    to PUBLIC (all roles) with USING(true)/WITH CHECK(true), silently
--    bypassing RLS for any authenticated user. Recreate it scoped to just
--    service_role. The "Family members can view embeddings" SELECT policy
--    stays — that's the legitimate path for family reads.
--
-- 2. Public storage buckets (entry-audio, entry-images) had a broad SELECT
--    policy on storage.objects that allowed any client to LIST all files
--    across every family. Both buckets are public=true so the CDN serves
--    URLs directly — the SELECT policy is not required for public URL
--    access, only for API list/metadata calls. Drop both.

-- 1. entry_embeddings fix
DROP POLICY IF EXISTS "Service role can manage embeddings" ON public.entry_embeddings;

CREATE POLICY "Service role can manage embeddings"
  ON public.entry_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Storage bucket list lockdown
DROP POLICY IF EXISTS "Public read access for entry images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for entry-audio" ON storage.objects;
