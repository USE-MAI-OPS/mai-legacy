import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embeddings";

/**
 * POST /api/entries/embed
 *
 * Trigger embedding generation for a single entry. Designed to be called
 * after an entry is created or updated.
 *
 * Body: { entryId: string }
 *
 * Flow:
 *   1. Fetch the entry from Supabase.
 *   2. Chunk its content.
 *   3. Generate embeddings for all chunks in one batch.
 *   4. Delete any existing embeddings for this entry (supports re-embedding).
 *   5. Insert the new chunk + embedding rows.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId } = body as { entryId?: string };

    if (!entryId) {
      return NextResponse.json(
        { error: "Missing required field: entryId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the caller is authenticated.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -----------------------------------------------------------------------
    // 1. Fetch the entry (RLS ensures the caller has access).
    // -----------------------------------------------------------------------
    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("id, family_id, title, content")
      .eq("id", entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: "Entry not found or access denied" },
        { status: 404 }
      );
    }

    // -----------------------------------------------------------------------
    // 2. Chunk the content. Prepend the title so it gets embedded too.
    // -----------------------------------------------------------------------
    const fullText = `${entry.title}\n\n${entry.content}`;
    const chunks = chunkText(fullText);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Entry has no content to embed" },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // 3. Generate embeddings in a single batch call.
    // -----------------------------------------------------------------------
    const chunkTexts = chunks.map((c) => c.text);
    // Use RETRIEVAL_DOCUMENT task type for stored entry content
    const embeddings = await generateEmbeddings(chunkTexts, "RETRIEVAL_DOCUMENT");

    // -----------------------------------------------------------------------
    // 4. Delete existing embeddings for this entry (idempotent re-embed).
    // -----------------------------------------------------------------------
    const { error: deleteError } = await supabase
      .from("entry_embeddings")
      .delete()
      .eq("entry_id", entryId);

    if (deleteError) {
      throw new Error(`Failed to delete old embeddings: ${deleteError.message}`);
    }

    // -----------------------------------------------------------------------
    // 5. Insert new embeddings.
    // -----------------------------------------------------------------------
    const rows = chunks.map((chunk, i) => ({
      entry_id: entryId,
      family_id: entry.family_id,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      embedding: embeddings[i],
    }));

    const { error: insertError } = await supabase
      .from("entry_embeddings")
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to insert embeddings: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      entryId,
      chunksCreated: chunks.length,
    });
  } catch (error) {
    console.error("[embed] Error embedding entry:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
