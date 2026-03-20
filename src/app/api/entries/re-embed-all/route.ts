import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embeddings";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/entries/re-embed-all
 *
 * Re-generates Gemini embeddings for ALL entries in the caller's family.
 * Intended as a one-time migration task after switching embedding models.
 *
 * This is an admin-level operation — only family admins can trigger it.
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Verify the caller is authenticated.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 2 requests per minute per user (expensive operation)
    const rl = rateLimit(`reembed:${user.id}`, 2);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    // Get the user's family
    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "No family membership found" },
        { status: 404 }
      );
    }

    if (membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only family admins can re-embed all entries" },
        { status: 403 }
      );
    }

    const familyId = membership.family_id;

    // Fetch all entries for this family
    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("id, title, content")
      .eq("family_id", familyId);

    if (entriesError || !entries) {
      return NextResponse.json(
        { error: "Failed to fetch entries" },
        { status: 500 }
      );
    }

    if (entries.length === 0) {
      return NextResponse.json({ success: true, entriesProcessed: 0 });
    }

    // Delete all existing embeddings for this family
    const { error: deleteError } = await supabase
      .from("entry_embeddings")
      .delete()
      .eq("family_id", familyId);

    if (deleteError) {
      throw new Error(
        `Failed to delete old embeddings: ${deleteError.message}`
      );
    }

    // Process each entry
    let totalChunks = 0;

    for (const entry of entries) {
      const fullText = `${entry.title}\n\n${entry.content}`;
      const chunks = chunkText(fullText);

      if (chunks.length === 0) continue;

      const chunkTexts = chunks.map((c) => c.text);
      // Use RETRIEVAL_DOCUMENT task type for stored content
      const embeddings = await generateEmbeddings(
        chunkTexts,
        "RETRIEVAL_DOCUMENT"
      );

      const rows = chunks.map((chunk, i) => ({
        entry_id: entry.id,
        family_id: familyId,
        chunk_text: chunk.text,
        chunk_index: chunk.index,
        embedding: embeddings[i],
      }));

      const { error: insertError } = await supabase
        .from("entry_embeddings")
        .insert(rows);

      if (insertError) {
        console.error(
          `[re-embed] Failed to insert embeddings for entry ${entry.id}:`,
          insertError
        );
        continue;
      }

      totalChunks += chunks.length;
    }

    return NextResponse.json({
      success: true,
      entriesProcessed: entries.length,
      totalChunks,
    });
  } catch (error) {
    console.error("[re-embed-all] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
