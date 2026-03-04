/**
 * Text chunking utility for the RAG pipeline.
 *
 * Splits entry content into ~500-token chunks with ~50-token overlap.
 * Prioritizes paragraph boundaries, then sentence boundaries, to keep
 * semantically coherent units together.
 *
 * Rough heuristic: 1 token ~= 4 characters (for English text).
 */

const CHARS_PER_TOKEN = 4;
const TARGET_CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN; // ~2000
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN; // ~200

/**
 * Split text into roughly equal, overlapping chunks that respect natural
 * paragraph and sentence boundaries.
 *
 * @param text - The full text content to chunk.
 * @returns An array of `{ text, index }` objects, one per chunk.
 */
export function chunkText(text: string): { text: string; index: number }[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // If the text is short enough, return a single chunk.
  if (trimmed.length <= TARGET_CHUNK_CHARS) {
    return [{ text: trimmed, index: 0 }];
  }

  const paragraphs = splitParagraphs(trimmed);
  const chunks: { text: string; index: number }[] = [];
  let currentParts: string[] = [];
  let currentLength = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    // If a single paragraph exceeds the target, split it by sentences.
    if (paragraph.length > TARGET_CHUNK_CHARS) {
      // Flush whatever we have accumulated so far.
      if (currentParts.length > 0) {
        chunks.push({ text: currentParts.join("\n\n"), index: chunkIndex++ });
        currentParts = getOverlapParts(currentParts);
        currentLength = currentParts.reduce((sum, p) => sum + p.length, 0);
      }

      // Split the oversized paragraph by sentences and chunk them.
      const sentenceChunks = chunkBySentences(paragraph);
      for (const sc of sentenceChunks) {
        chunks.push({ text: sc, index: chunkIndex++ });
      }

      // Seed the next chunk with overlap from the last sentence chunk.
      currentParts = [];
      currentLength = 0;
      continue;
    }

    // Would adding this paragraph exceed the target?
    const newLength = currentLength + (currentParts.length > 0 ? 2 : 0) + paragraph.length;

    if (newLength > TARGET_CHUNK_CHARS && currentParts.length > 0) {
      // Flush the current chunk.
      chunks.push({ text: currentParts.join("\n\n"), index: chunkIndex++ });

      // Seed the next chunk with trailing paragraphs for overlap.
      currentParts = getOverlapParts(currentParts);
      currentLength = currentParts.reduce(
        (sum, p, i) => sum + p.length + (i > 0 ? 2 : 0),
        0
      );
    }

    currentParts.push(paragraph);
    currentLength += (currentParts.length > 1 ? 2 : 0) + paragraph.length;
  }

  // Flush remaining content.
  if (currentParts.length > 0) {
    const remaining = currentParts.join("\n\n").trim();
    if (remaining) {
      chunks.push({ text: remaining, index: chunkIndex++ });
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Split text on double-newlines (paragraph breaks). Filters empty segments.
 */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Split a paragraph into sentences using common punctuation boundaries.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end.
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.map((s) => s.trim()).filter(Boolean);
}

/**
 * Given an oversized paragraph, chunk it into pieces by accumulating
 * sentences up to TARGET_CHUNK_CHARS, with OVERLAP_CHARS overlap.
 */
function chunkBySentences(paragraph: string): string[] {
  const sentences = splitSentences(paragraph);
  if (sentences.length === 0) return [paragraph];

  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const sentence of sentences) {
    const addition = currentLen > 0 ? sentence.length + 1 : sentence.length;

    if (currentLen + addition > TARGET_CHUNK_CHARS && current.length > 0) {
      chunks.push(current.join(" "));

      // Build overlap from trailing sentences.
      const overlap = getOverlapSentences(current);
      current = overlap;
      currentLen = current.join(" ").length;
    }

    current.push(sentence);
    currentLen += addition;
  }

  if (current.length > 0) {
    const text = current.join(" ").trim();
    if (text) chunks.push(text);
  }

  return chunks;
}

/**
 * Return trailing paragraphs that fit within the overlap window to seed the
 * next chunk.
 */
function getOverlapParts(parts: string[]): string[] {
  const overlap: string[] = [];
  let length = 0;

  for (let i = parts.length - 1; i >= 0; i--) {
    const added = parts[i].length + (overlap.length > 0 ? 2 : 0);
    if (length + added > OVERLAP_CHARS) break;
    overlap.unshift(parts[i]);
    length += added;
  }

  return overlap;
}

/**
 * Return trailing sentences that fit within the overlap window.
 */
function getOverlapSentences(sentences: string[]): string[] {
  const overlap: string[] = [];
  let length = 0;

  for (let i = sentences.length - 1; i >= 0; i--) {
    const added = sentences[i].length + (overlap.length > 0 ? 1 : 0);
    if (length + added > OVERLAP_CHARS) break;
    overlap.unshift(sentences[i]);
    length += added;
  }

  return overlap;
}
