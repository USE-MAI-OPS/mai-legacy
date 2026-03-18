/**
 * Google Gemini embedding generation for the RAG pipeline.
 *
 * Uses the text-embedding-004 model (768 dimensions) via direct fetch
 * calls -- no SDK dependency required.
 *
 * Two task types are used:
 *   - RETRIEVAL_DOCUMENT: when embedding entry content (stored in DB)
 *   - RETRIEVAL_QUERY:    when embedding a user's search query
 */

const GEMINI_MODEL = "gemini-embedding-001";
const GEMINI_DIMENSIONS = 768;

function geminiUrl(model: string): string {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY environment variable");
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`;
}

/**
 * Generate an embedding vector for a single text string.
 *
 * @param text     - The input text to embed.
 * @param taskType - Gemini task type hint (default: RETRIEVAL_QUERY for search).
 * @returns A 768-dimension float array.
 */
export async function generateEmbedding(
  text: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY"
): Promise<number[]> {
  const result = await generateEmbeddings([text], taskType);
  return result[0];
}

/**
 * Generate embedding vectors for multiple texts in a single API call.
 *
 * Gemini's batchEmbedContents endpoint accepts up to 100 requests per call.
 *
 * @param texts    - Array of input texts to embed.
 * @param taskType - Gemini task type hint (default: RETRIEVAL_DOCUMENT for storage).
 * @returns Array of 768-dimension float arrays, one per input text (same order).
 */
export async function generateEmbeddings(
  texts: string[],
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const url = geminiUrl(GEMINI_MODEL);

  // Gemini batchEmbedContents supports up to 100 requests per call.
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: batch.map((text) => ({
          model: `models/${GEMINI_MODEL}`,
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: GEMINI_DIMENSIONS,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Gemini embeddings API error (${response.status}): ${error}`
      );
    }

    const json = (await response.json()) as GeminiBatchEmbeddingResponse;
    allEmbeddings.push(...json.embeddings.map((e) => e.values));
  }

  return allEmbeddings;
}

// ---------------------------------------------------------------------------
// Types for the Gemini embeddings response
// ---------------------------------------------------------------------------

interface GeminiBatchEmbeddingResponse {
  embeddings: {
    values: number[];
  }[];
}
