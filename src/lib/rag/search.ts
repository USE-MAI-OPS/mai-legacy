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
  /** Entry title — resolved by a follow-up join after the RPC. */
  title: string;
}

/**
 * Search the family's knowledge base for chunks relevant to a given query.
 *
 * @param query        - The natural-language question or search string.
 * @param familyId     - The family whose knowledge to search.
 * @param matchCount   - Maximum number of results to return (default 8).
 * @returns Matching entry chunks ranked by cosine similarity (descending),
 *          each annotated with the parent entry's title so the UI can
 *          render proper source labels instead of "Untitled Entry".
 */
export async function searchFamilyKnowledge(
  query: string,
  familyId: string,
  matchCount: number = 8,
  allowedAuthorIds?: string[]
): Promise<SearchResult[]> {
  // 1. Embed the query using RETRIEVAL_QUERY task type for search.
  const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");

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

  const rows = (data ?? []) as Omit<SearchResult, "title">[];
  if (rows.length === 0) return [];

  // 3. Resolve titles for all matched entries in a single batch query.
  const entryIds = Array.from(new Set(rows.map((r) => r.entry_id)));
  const { data: entries } = await supabase
    .from("entries")
    .select("id, title")
    .in("id", entryIds);

  const titleMap = new Map<string, string>();
  for (const e of entries ?? []) {
    titleMap.set(e.id as string, (e.title as string) ?? "");
  }

  return rows.map((r) => ({
    ...r,
    title: titleMap.get(r.entry_id) ?? "",
  }));
}
