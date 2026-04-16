import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embeddings";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

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

    // Rate limit: 10 requests per minute per user
    const rl = rateLimit(`embed:${user.id}`, 10);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    // -----------------------------------------------------------------------
    // 1. Resolve the caller's family and fetch the entry scoped to that
    //    family. Don't trust RLS alone — require the entry belong to the
    //    user's family. Return a generic 404 to avoid leaking entry existence
    //    across families.
    // -----------------------------------------------------------------------
    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "No family membership" },
        { status: 403 }
      );
    }
    const familyId = membership.family_id;

    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("id, family_id, title, content")
      .eq("id", entryId)
      .eq("family_id", familyId)
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
    // 4. Atomic-ish re-embed: snapshot old embedding IDs, insert new rows,
    //    THEN delete the snapshotted old rows. If the insert fails, the entry
    //    keeps its existing embeddings (no empty window / data loss).
    // -----------------------------------------------------------------------
    const { data: oldRows } = await supabase
      .from("entry_embeddings")
      .select("id")
      .eq("entry_id", entryId);
    const oldIds = (oldRows ?? []).map((r: { id: string }) => r.id);

    // 4a. Insert new rows FIRST.
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

    // 4b. Only after a successful insert, delete the old rows by id.
    if (oldIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("entry_embeddings")
        .delete()
        .in("id", oldIds);

      if (deleteError) {
        // Soft-fail: new embeddings are in place. Log and continue so we
        // don't surface a 500 when the payload was saved successfully.
        console.error("[embed] Failed to delete old embeddings:", deleteError);
      }
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
