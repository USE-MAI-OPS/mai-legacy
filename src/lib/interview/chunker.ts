/**
 * Transcript chunker for the interview extraction feature.
 *
 * Splits long transcripts into overlapping chunks that fit within the LLM's
 * context window (targeting ~3,000 words per chunk for the 3B model).
 */

import type { TranscriptChunk } from "./types";

const MAX_CHUNK_WORDS = 3000;
const OVERLAP_WORDS = 500;
const CHUNK_THRESHOLD = 4000; // Only chunk if transcript exceeds this word count

/**
 * Count words in a string.
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Clean a raw transcript: strip timestamps, normalize speaker labels, and
 * remove common noise like "[inaudible]".
 */
export function cleanTranscript(raw: string): string {
  let cleaned = raw;

  // Remove timestamps in common formats:
  // "00:12:34", "[00:12:34]", "(00:12:34)", "0:12:34"
  cleaned = cleaned.replace(/[\[\(]?\d{0,2}:?\d{1,2}:\d{2}[\]\)]?\s*/g, "");

  // Remove "[inaudible]", "[crosstalk]", "[laughter]", etc.
  cleaned = cleaned.replace(/\[(?:inaudible|crosstalk|laughter|pause|silence|music|applause)\]/gi, "");

  // Normalize multiple spaces and blank lines
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Split a transcript into overlapping chunks if it exceeds the threshold.
 * If it's short enough, return as a single chunk.
 */
export function chunkTranscript(transcript: string): TranscriptChunk[] {
  const wordCount = countWords(transcript);

  // Short enough to process in one shot
  if (wordCount <= CHUNK_THRESHOLD) {
    return [{ text: transcript, index: 0, wordCount }];
  }

  const words = transcript.split(/\s+/).filter(Boolean);
  const chunks: TranscriptChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + MAX_CHUNK_WORDS, words.length);
    const chunkWords = words.slice(startIndex, endIndex);
    const chunkText = chunkWords.join(" ");

    chunks.push({
      text: chunkText,
      index: chunkIndex,
      wordCount: chunkWords.length,
    });

    // Move forward by (MAX - OVERLAP) words to create overlap
    const step = MAX_CHUNK_WORDS - OVERLAP_WORDS;
    startIndex += step;
    chunkIndex++;

    // If the remaining words are fewer than the overlap, just stop
    if (words.length - startIndex < OVERLAP_WORDS) {
      break;
    }
  }

  return chunks;
}

/**
 * Merge extraction results from multiple chunks, deduplicating entries by title
 * similarity and combining profile updates.
 */
export function mergeExtractionResults(
  results: { entries: unknown[]; profile_updates: Record<string, unknown> | object; suggested_followups: string[] }[]
): { entries: unknown[]; profile_updates: Record<string, unknown>; suggested_followups: string[] } {
  const allEntries: unknown[] = [];
  const seenTitles = new Set<string>();
  const mergedProfile: Record<string, unknown> = {};
  const allFollowups: string[] = [];

  for (const result of results) {
    // Deduplicate entries by title (case-insensitive, trimmed)
    for (const entry of result.entries) {
      const e = entry as { title?: string };
      const normalizedTitle = (e.title || "").toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        allEntries.push(entry);
      }
    }

    // Merge profile updates — combine arrays, keep non-null values
    for (const [key, value] of Object.entries(result.profile_updates || {})) {
      if (Array.isArray(value)) {
        const existing = (mergedProfile[key] as unknown[] | undefined) || [];
        // Deduplicate by JSON stringifying individual items
        const existingSet = new Set(existing.map((item) => JSON.stringify(item)));
        const newItems = value.filter((item) => !existingSet.has(JSON.stringify(item)));
        mergedProfile[key] = [...existing, ...newItems];
      } else if (value !== null && value !== undefined) {
        // For non-array values (like military), prefer the first non-null
        if (!mergedProfile[key]) {
          mergedProfile[key] = value;
        }
      }
    }

    // Collect follow-ups, deduplicate
    for (const followup of result.suggested_followups || []) {
      if (!allFollowups.includes(followup)) {
        allFollowups.push(followup);
      }
    }
  }

  return {
    entries: allEntries,
    profile_updates: mergedProfile,
    suggested_followups: allFollowups.slice(0, 5), // Cap at 5
  };
}
