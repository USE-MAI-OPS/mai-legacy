/**
 * OpenAI embedding generation for the RAG pipeline.
 *
 * Uses the text-embedding-3-small model (1536 dimensions) via direct fetch
 * calls -- no SDK dependency required.
 */

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

/**
 * Generate an embedding vector for a single text string.
 *
 * @param text - The input text to embed.
 * @returns A 1536-dimension float array.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: OPENAI_EMBEDDING_MODEL,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embeddings API error (${response.status}): ${error}`);
  }

  const json = (await response.json()) as OpenAIEmbeddingResponse;
  return json.data[0].embedding;
}

/**
 * Generate embedding vectors for multiple texts in a single API call.
 *
 * OpenAI's embeddings endpoint accepts an array of inputs natively, which is
 * far more efficient than calling one-by-one.
 *
 * @param texts - Array of input texts to embed.
 * @returns Array of 1536-dimension float arrays, one per input text (same order).
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  // OpenAI supports batches up to ~2048 inputs per call. For safety we batch
  // in groups of 512 to stay well within limits and avoid timeouts.
  const BATCH_SIZE = 512;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: batch,
        model: OPENAI_EMBEDDING_MODEL,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embeddings API error (${response.status}): ${error}`);
    }

    const json = (await response.json()) as OpenAIEmbeddingResponse;

    // The API may return embeddings out of order; sort by index to be safe.
    const sorted = json.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map((item) => item.embedding));
  }

  return allEmbeddings;
}

// ---------------------------------------------------------------------------
// Types for the OpenAI embeddings response
// ---------------------------------------------------------------------------

interface OpenAIEmbeddingResponse {
  object: "list";
  data: {
    object: "embedding";
    index: number;
    embedding: number[];
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}
