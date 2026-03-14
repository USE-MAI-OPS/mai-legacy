/**
 * Vector similarity search over family knowledge.
 *
 * Embeds the user's query, then calls the Supabase `match_entry_embeddings`
 * RPC function to find the most relevant entry chunks via cosine similarity.
 */

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/rag/embeddings";

export interface SearchResult {
  id: string;
  entry_id: string;
  chunk_text: string;
  similarity: number;
}

/**
 * Search the family's knowledge base for chunks relevant to a given query.
 *
 * @param query        - The natural-language question or search string.
 * @param familyId     - The family whose knowledge to search.
 * @param matchCount   - Maximum number of results to return (default 8).
 * @returns Matching entry chunks ranked by cosine similarity (descending).
 */
export async function searchFamilyKnowledge(
  query: string,
  familyId: string,
  matchCount: number = 8,
  allowedAuthorIds?: string[]
): Promise<SearchResult[]> {
  // 1. Embed the query using the same model used for entry chunks.
  const queryEmbedding = await generateEmbedding(query);

  // 2. Call the Supabase RPC for vector similarity search.
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("match_entry_embeddings", {
    query_embedding: queryEmbedding,
    match_family_id: familyId,
    match_threshold: 0.3, // Only return reasonably relevant results.
    match_count: matchCount,
    allowed_author_ids: allowedAuthorIds ?? null,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return (data ?? []) as SearchResult[];
}
