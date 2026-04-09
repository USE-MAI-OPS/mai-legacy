/**
 * Direct entry embedding helper for the RAG pipeline.
 *
 * Call this from server actions after creating or updating an entry.
 * Uses the admin (service-role) Supabase client so it works without
 * browser cookies — which fixes the fire-and-forget auth bug where
 * server-side fetch() to /api/entries/embed had no credentials.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embeddings";

/**
 * Generate and store embeddings for a single entry (fire-and-forget safe).
 *
 * @param entryId - The UUID of the entry to embed.
 */
export async function embedEntry(entryId: string): Promise<void> {
  try {
    const supabase = createAdminClient();

    // 1. Fetch the entry
    const { data: entry, error: entryError } = await (supabase as any)
      .from("entries")
      .select("id, family_id, title, content")
      .eq("id", entryId)
      .single();

    if (entryError || !entry) {
      console.error("[embed-entry] Entry not found:", entryId, entryError);
      return;
    }

    // 2. Chunk the content
    const fullText = `${entry.title}\n\n${entry.content}`;
    const chunks = chunkText(fullText);

    if (chunks.length === 0) {
      console.warn("[embed-entry] No content to embed for entry:", entryId);
      return;
    }

    // 3. Generate embeddings
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(chunkTexts, "RETRIEVAL_DOCUMENT");

    // 4. Delete existing embeddings (idempotent re-embed)
    const { error: deleteError } = await (supabase as any)
      .from("entry_embeddings")
      .delete()
      .eq("entry_id", entryId);

    if (deleteError) {
      console.error("[embed-entry] Failed to delete old embeddings:", deleteError);
      return;
    }

    // 5. Insert new embeddings
    const rows = chunks.map((chunk, i) => ({
      entry_id: entryId,
      family_id: entry.family_id,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      embedding: embeddings[i],
    }));

    const { error: insertError } = await (supabase as any)
      .from("entry_embeddings")
      .insert(rows);

    if (insertError) {
      console.error("[embed-entry] Failed to insert embeddings:", insertError);
      return;
    }

    console.log(
      `[embed-entry] Embedded entry ${entryId}: ${chunks.length} chunks`
    );
  } catch (error) {
    console.error("[embed-entry] Error embedding entry:", entryId, error);
  }
}
