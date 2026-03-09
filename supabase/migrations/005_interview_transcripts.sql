-- Interview Transcripts table
-- Stores raw transcripts and extraction results for the interview import feature

CREATE TABLE IF NOT EXISTS interview_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) NOT NULL,
  uploaded_by UUID NOT NULL,            -- auth.users id of who pasted the transcript
  subject_member_id UUID NOT NULL,      -- family_members id of who was interviewed
  raw_transcript TEXT NOT NULL,
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB,                 -- full AI extraction result before user review
  error_message TEXT,                   -- error details if extraction failed
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE interview_transcripts ENABLE ROW LEVEL SECURITY;

-- Family members can read their own family's transcripts
CREATE POLICY "Family members can view their family transcripts"
  ON interview_transcripts FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Family members can insert transcripts for their family
CREATE POLICY "Family members can create transcripts"
  ON interview_transcripts FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Family members can update their own family's transcripts
CREATE POLICY "Family members can update their family transcripts"
  ON interview_transcripts FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );
