-- Patch for schema drift caused by duplicate migration numbers 018 and 019.
-- Both skipped files (alphabetically second, which Supabase CLI doesn't run
-- when two files share a number) partially never made it to production:
--
--   018_export_rate_limit.sql  → families.last_export_at column (MISSING)
--   019_griot_discoveries.sql  → griot_discoveries table + 2 indexes
--                                (table was manually created, indexes MISSING)
--
-- Verified via diagnostic query on 2026-04-16 against production
-- (project wescstrjmwwyckoauhpp / MAIB3). Everything else from the skipped
-- 018/019 files (and from skipped 002, 020, 021) was already present.
--
-- Idempotent so it's safe to run against any environment.

-- --- From 018_export_rate_limit.sql ---
-- Used by src/app/api/export/route.ts to enforce 1-export-per-24h rate limit.
-- Without this column, the export API 500s on every request.
alter table public.families
  add column if not exists last_export_at timestamptz;

-- --- From 019_griot_discoveries.sql ---
-- Indexes only; the griot_discoveries table itself was created ad-hoc.
create index if not exists idx_griot_discoveries_family
  on public.griot_discoveries(family_id);

create index if not exists idx_griot_discoveries_created
  on public.griot_discoveries(created_at desc);
