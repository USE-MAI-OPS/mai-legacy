-- Background jobs queue for async RAG operations
-- Supports: embed_entry, re_embed_family

CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('embed_entry', 're_embed_family')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  error TEXT,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for queue polling (only index active statuses)
CREATE INDEX idx_background_jobs_pending
  ON background_jobs (created_at ASC)
  WHERE status = 'pending';

CREATE INDEX idx_background_jobs_family
  ON background_jobs (family_id);

-- RLS: service role manages all jobs; family members can read their own
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages jobs"
  ON background_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Family members can view their jobs"
  ON background_jobs FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Atomic job claiming function: marks up to `batch_size` pending jobs as
-- 'processing' and increments attempts. Returns the claimed rows.
CREATE OR REPLACE FUNCTION claim_embedding_jobs(batch_size INT DEFAULT 10)
RETURNS SETOF background_jobs
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE background_jobs
  SET
    status = 'processing',
    attempts = attempts + 1,
    updated_at = NOW()
  WHERE id IN (
    SELECT id
    FROM background_jobs
    WHERE status = 'pending'
      AND attempts < max_attempts
    ORDER BY created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;
