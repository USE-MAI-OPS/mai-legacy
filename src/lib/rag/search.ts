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
 * Search the viewer's knowledge base for chunks relevant to a given query.
 *
 * Accepts an array of family IDs so the Griot can search across every hub
 * the viewer belongs to — family + circles — in a single call. The RPC
 * `match_entry_embeddings` takes one family at a time, so we fan out in
 * parallel, then merge/dedupe/rank by similarity and cap at matchCount.
 *
 * @param query            - The natural-language question or search string.
 * @param familyIds        - Families whose knowledge to search (1 or more).
 * @param matchCount       - Maximum number of results to return (default 8).
 * @param allowedAuthorIds - Optional whitelist of author_ids (the viewer's
 *                           combined connection chain across all hubs).
 */
export async function searchFamilyKnowledge(
  query: string,
  familyIds: string[],
  matchCount: number = 8,
  allowedAuthorIds?: string[]
): Promise<SearchResult[]> {
  if (familyIds.length === 0) return [];

  // 1. Embed the query once and reuse it across every hub's RPC call.
  const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");

  // 2. Fan out the vector-similarity RPC across every hub the viewer belongs
  //    to. The RPC has a single `match_family_id` parameter so we parallelise
  //    rather than issuing N serial round-trips.
  const supabase = await createClient();

  const perHubResults = await Promise.all(
    familyIds.map(async (fid) => {
      const { data, error } = await supabase.rpc("match_entry_embeddings", {
        query_embedding: queryEmbedding,
        match_family_id: fid,
        match_threshold: 0.3,
        // Overfetch per-hub so the cross-hub ranking has enough candidates
        // to pick good results when one hub dominates the relevance signal.
        match_count: matchCount * 2,
        allowed_author_ids: allowedAuthorIds ?? null,
      });
      if (error) {
        console.error(`[rag] Vector search failed for family ${fid}:`, error);
        return [] as Omit<SearchResult, "title">[];
      }
      return (data ?? []) as Omit<SearchResult, "title">[];
    })
  );

  // 3. Merge, dedupe by chunk id, sort by similarity desc, cap.
  const seenChunkIds = new Set<string>();
  const merged: Omit<SearchResult, "title">[] = [];
  for (const hubRows of perHubResults) {
    for (const row of hubRows) {
      if (seenChunkIds.has(row.id)) continue;
      seenChunkIds.add(row.id);
      merged.push(row);
    }
  }
  merged.sort((a, b) => b.similarity - a.similarity);
  const top = merged.slice(0, matchCount);
  if (top.length === 0) return [];

  // 4. Resolve titles for all matched entries in a single batch query across
  //    every surfaced entry.
  const entryIds = Array.from(new Set(top.map((r) => r.entry_id)));
  const { data: entries } = await supabase
    .from("entries")
    .select("id, title")
    .in("id", entryIds);

  const titleMap = new Map<string, string>();
  for (const e of entries ?? []) {
    titleMap.set(e.id as string, (e.title as string) ?? "");
  }

  return top.map((r) => ({
    ...r,
    title: titleMap.get(r.entry_id) ?? "",
  }));
}
