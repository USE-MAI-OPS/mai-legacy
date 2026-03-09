/**
 * TypeScript types for the interview transcript extraction feature.
 */

import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Extracted entry — a single entry pulled from the transcript
// ---------------------------------------------------------------------------

export interface ExtractedEntry {
  type: EntryType;
  title: string;
  content: string;
  tags: string[];
  structured_data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Profile updates — new information about the interviewed family member
// ---------------------------------------------------------------------------

export interface ExtractedProfileUpdates {
  career: { job_title: string; company: string; years: string }[];
  education: { school: string; degree: string; year: string }[];
  places_lived: { location: string; years: string }[];
  skills: string[];
  hobbies: string[];
  milestones: { event: string; year: string }[];
  military: { branch: string; rank: string; years: string } | null;
}

// ---------------------------------------------------------------------------
// Full extraction result returned by the AI
// ---------------------------------------------------------------------------

export interface ExtractionResult {
  entries: ExtractedEntry[];
  profile_updates: ExtractedProfileUpdates;
  suggested_followups: string[];
}

// ---------------------------------------------------------------------------
// Request/response types for the extraction API
// ---------------------------------------------------------------------------

export interface ExtractionRequest {
  transcript_id: string;
  transcript: string;
  subject_member_id: string;
  subject_member_name: string;
  existing_profile: Record<string, unknown> | null;
}

export interface ExtractionResponse {
  success: boolean;
  data?: ExtractionResult;
  error?: string;
  transcript_id: string;
}

// ---------------------------------------------------------------------------
// AI client types
// ---------------------------------------------------------------------------

export type AIProvider = "ollama" | "openrouter";

export interface AIClientConfig {
  provider: AIProvider;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
}

// ---------------------------------------------------------------------------
// Chunked transcript segment
// ---------------------------------------------------------------------------

export interface TranscriptChunk {
  text: string;
  index: number;
  wordCount: number;
}

// ---------------------------------------------------------------------------
// Review state — used by the frontend bulk review screen
// ---------------------------------------------------------------------------

export interface ReviewableEntry extends ExtractedEntry {
  id: string; // temporary client-side ID
  selected: boolean;
  expanded: boolean;
}

export interface ReviewableProfileUpdate {
  category: keyof ExtractedProfileUpdates;
  label: string;
  items: { value: unknown; selected: boolean; isNew: boolean }[];
}
