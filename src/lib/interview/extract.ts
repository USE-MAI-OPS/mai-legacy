/**
 * Core extraction logic for the interview transcript feature.
 *
 * Takes a raw transcript, cleans it, optionally chunks it, sends it to the AI,
 * and returns structured extraction results.
 */

import { queryAI } from "./ai-client";
import { cleanTranscript, chunkTranscript, mergeExtractionResults } from "./chunker";
import { buildPiiContext, sanitize, restore } from "@/lib/pii/sanitizer";
import type { ExtractionResult, ExtractedEntry, ExtractedProfileUpdates } from "./types";

/**
 * Build the extraction prompt for the AI.
 */
function buildExtractionPrompt(
  transcript: string,
  subjectName: string,
  existingProfile: Record<string, unknown> | null,
  chunkInfo?: { index: number; total: number }
): string {
  const chunkNote = chunkInfo
    ? `\n\nNote: This is section ${chunkInfo.index + 1} of ${chunkInfo.total} from a longer conversation. Extract what you find in this section — results will be merged.`
    : "";

  const existingProfileJson = existingProfile
    ? JSON.stringify(existingProfile, null, 2)
    : "No existing profile data.";

  return `You are an AI assistant for MAI Legacy, a family knowledge preservation platform. You are analyzing a transcript of a conversation with a family member named ${subjectName}.${chunkNote}

Extract ALL of the following from the transcript. Be thorough — capture everything mentioned, even briefly.

Return a JSON object with these keys:

{
  "entries": [
    {
      "type": "story" | "recipe" | "lesson" | "skill" | "connection" | "general",
      "title": "A descriptive title for this entry",
      "content": "The full narrative/description in the family member's voice. Write naturally, not like a database field.",
      "tags": ["relevant", "tags"],
      "structured_data": {
        // For stories: { "year": "1965", "location": "Memphis, TN", "people_involved": ["Uncle Ray", "Grandpa Joe"] }
        // For recipes: { "ingredients": [{"item": "flour", "amount": "2", "unit": "cups"}], "instructions": [{"step": 1, "text": "..."}], "prep_time": "20 min", "cook_time": "45 min", "servings": "6", "difficulty": "easy", "cuisine": "Southern", "story": "origin story..." }
        // For lessons: { "context": "...", "lesson_text": "...", "taught_by": "...", "when_learned": "...", "key_takeaways": ["..."] }
        // For skills: { "difficulty": "beginner|intermediate|advanced", "prerequisites": ["..."], "what_you_need": ["..."], "steps": [{"order": 1, "title": "...", "description": "..."}] }
        // For connections: { "name": "...", "relationship": "...", "phone": "", "email": "", "notes": "..." }
        // For general: {} (just use content field)
      }
    }
  ],
  "profile_updates": {
    "career": [{ "job_title": "...", "company": "...", "years": "..." }],
    "education": [{ "school": "...", "degree": "...", "year": "..." }],
    "places_lived": [{ "location": "...", "years": "..." }],
    "skills": ["skill1", "skill2"],
    "hobbies": ["hobby1", "hobby2"],
    "milestones": [{ "event": "...", "year": "..." }],
    "military": { "branch": "...", "rank": "...", "years": "..." }
  },
  "suggested_followups": [
    "Questions or topics that came up but weren't fully explored"
  ]
}

Rules:
- Only extract what is actually stated or clearly implied in the transcript.
- Write entry content in a warm, natural tone as if the family member is telling the story.
- For recipes, try to capture specific measurements and steps even if the speaker was vague — note approximations.
- For profile_updates, only include NEW information not already in their existing profile.
- Deduplicate: if the same story/topic comes up multiple times, merge into one entry.
- suggested_followups: note 2-5 topics that were mentioned but not explored in depth — these help plan the next interview session.
- If the type is unclear, use "general".
- If you find NO extractable content, return: {"entries": [], "profile_updates": {"career": [], "education": [], "places_lived": [], "skills": [], "hobbies": [], "milestones": [], "military": null}, "suggested_followups": []}

Existing profile data for ${subjectName} (only suggest updates for NEW information):
${existingProfileJson}

TRANSCRIPT:
${transcript}`;
}

/**
 * Parse the AI response into a typed ExtractionResult.
 * Handles malformed JSON gracefully.
 */
function parseExtractionResponse(raw: string): ExtractionResult {
  // Try to extract JSON from the response (model may include markdown fences)
  let jsonStr = raw.trim();

  // Remove markdown code fences if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate and normalize the parsed result
  const entries: ExtractedEntry[] = Array.isArray(parsed.entries)
    ? parsed.entries.map((e: Record<string, unknown>) => ({
        type: validateEntryType(e.type as string),
        title: String(e.title || "Untitled Entry"),
        content: String(e.content || ""),
        tags: Array.isArray(e.tags) ? e.tags.map(String) : [],
        structured_data:
          e.structured_data && typeof e.structured_data === "object"
            ? (e.structured_data as Record<string, unknown>)
            : {},
      }))
    : [];

  const profileUpdates = normalizeProfileUpdates(parsed.profile_updates);

  const followups: string[] = Array.isArray(parsed.suggested_followups)
    ? parsed.suggested_followups.map(String).slice(0, 5)
    : [];

  return {
    entries,
    profile_updates: profileUpdates,
    suggested_followups: followups,
  };
}

/**
 * Validate an entry type string against allowed values.
 */
function validateEntryType(type: string): ExtractedEntry["type"] {
  const allowed = ["story", "recipe", "lesson", "skill", "connection", "general"];
  return allowed.includes(type) ? (type as ExtractedEntry["type"]) : "general";
}

/**
 * Normalize profile updates from the AI response.
 */
function normalizeProfileUpdates(
  raw: Record<string, unknown> | undefined
): ExtractedProfileUpdates {
  if (!raw || typeof raw !== "object") {
    return {
      career: [],
      education: [],
      places_lived: [],
      skills: [],
      hobbies: [],
      milestones: [],
      military: null,
    };
  }

  return {
    career: Array.isArray(raw.career) ? raw.career : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    places_lived: Array.isArray(raw.places_lived) ? raw.places_lived : [],
    skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
    hobbies: Array.isArray(raw.hobbies) ? raw.hobbies.map(String) : [],
    milestones: Array.isArray(raw.milestones) ? raw.milestones : [],
    military:
      raw.military && typeof raw.military === "object"
        ? (raw.military as ExtractedProfileUpdates["military"])
        : null,
  };
}

/**
 * Extract structured entries and profile updates from an interview transcript.
 *
 * This is the main entry point for the extraction pipeline.
 */
export async function extractFromTranscript(
  rawTranscript: string,
  subjectName: string,
  existingProfile: Record<string, unknown> | null,
  onProgress?: (message: string) => void
): Promise<{ result: ExtractionResult; provider: string }> {
  // 1. Clean the transcript
  onProgress?.("Cleaning up the transcript...");
  const cleaned = cleanTranscript(rawTranscript);

  if (!cleaned || cleaned.length < 50) {
    throw new Error(
      "The transcript appears to be too short or empty. Please paste a longer conversation."
    );
  }

  // 1b. Build PII context for sanitization before sending to LLM
  const piiCtx = buildPiiContext([{ displayName: subjectName }]);

  // 2. Chunk if needed
  const chunks = chunkTranscript(cleaned);
  onProgress?.(
    chunks.length > 1
      ? `Processing ${chunks.length} sections...`
      : "Reading through the conversation..."
  );

  // 3. Process each chunk
  const chunkResults: ExtractionResult[] = [];
  let lastProvider = "ollama";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    if (chunks.length > 1) {
      onProgress?.(`Processing section ${i + 1} of ${chunks.length}...`);
    }

    const prompt = buildExtractionPrompt(
      chunk.text,
      subjectName,
      existingProfile,
      chunks.length > 1 ? { index: i, total: chunks.length } : undefined
    );

    // Sanitize the prompt before sending to external LLM
    const sanitizedPrompt = sanitize(prompt, piiCtx);

    // Call the AI with retry on parse failure
    let parsed: ExtractionResult | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { response, provider } = await queryAI(sanitizedPrompt);
        lastProvider = provider;
        // Restore PII tokens in the response before parsing
        const restoredResponse = restore(response, piiCtx);
        parsed = parseExtractionResponse(restoredResponse);
        break;
      } catch (error) {
        if (attempt === 0) {
          console.warn(
            `[interview] Parse attempt ${attempt + 1} failed, retrying:`,
            error
          );
          continue;
        }
        throw new Error(
          `Failed to parse AI response after 2 attempts: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    if (parsed) {
      chunkResults.push(parsed);
    }
  }

  // 4. Merge results if chunked
  if (chunkResults.length === 0) {
    return {
      result: {
        entries: [],
        profile_updates: {
          career: [],
          education: [],
          places_lived: [],
          skills: [],
          hobbies: [],
          milestones: [],
          military: null,
        },
        suggested_followups: [],
      },
      provider: lastProvider,
    };
  }

  if (chunkResults.length === 1) {
    return { result: chunkResults[0], provider: lastProvider };
  }

  onProgress?.("Merging results...");
  const merged = mergeExtractionResults(chunkResults);

  return {
    result: {
      entries: merged.entries as ExtractedEntry[],
      profile_updates: normalizeProfileUpdates(
        merged.profile_updates as Record<string, unknown>
      ),
      suggested_followups: merged.suggested_followups,
    },
    provider: lastProvider,
  };
}
