import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embeddings";
import type { BackgroundJob } from "@/lib/jobs/queue";

/**
 * GET /api/cron/process-embedding-jobs
 *
 * Processes pending background embedding jobs in batches.
 * Triggered by Vercel Cron every minute.
 *
 * Auth: CRON_SECRET header required.
 *
 * Job types handled:
 *   - embed_entry: chunk + embed a single entry
 *   - re_embed_family: re-embed all entries in a family (delete + re-insert)
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Atomically claim up to 10 pending jobs
  const { data: jobs, error: claimError } = await supabase.rpc(
    "claim_embedding_jobs",
    { batch_size: 10 }
  );

  if (claimError) {
    console.error("[cron/embedding] Failed to claim jobs:", claimError);
    return NextResponse.json({ error: "Failed to claim jobs" }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ processed: 0, skipped: 0 });
  }

  let processed = 0;
  let failed = 0;

  for (const job of jobs as unknown as BackgroundJob[]) {
    try {
      if (job.type === "embed_entry") {
        await processEmbedEntry(supabase, job);
      } else if (job.type === "re_embed_family") {
        await processReEmbedFamily(supabase, job);
      }

      await supabase
        .from("background_jobs")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          status: "done" as const,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", job.id);

      processed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[cron/embedding] Job ${job.id} (${job.type}) failed:`, errorMsg);

      // If out of retries, mark failed; otherwise reset to pending for retry
      const newStatus = job.attempts >= job.max_attempts ? "failed" : "pending";

      await supabase
        .from("background_jobs")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          status: newStatus,
          error: errorMsg,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", job.id);

      failed++;
    }
  }

  return NextResponse.json({ processed, failed });
}

// ---------------------------------------------------------------------------
// Job processors
// ---------------------------------------------------------------------------

async function processEmbedEntry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  job: BackgroundJob
): Promise<void> {
  const { entryId } = job.payload as { entryId: string };

  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .select("id, family_id, title, content")
    .eq("id", entryId)
    .single();

  if (entryError || !entry) {
    throw new Error(`Entry ${entryId} not found: ${entryError?.message}`);
  }

  const fullText = `${entry.title}\n\n${entry.content}`;
  const chunks = chunkText(fullText);

  if (chunks.length === 0) {
    // Nothing to embed; treat as success
    return;
  }

  const chunkTexts = chunks.map((c) => c.text);
  const embeddings = await generateEmbeddings(chunkTexts, "RETRIEVAL_DOCUMENT");

  // Delete old embeddings for this entry (idempotent)
  const { error: deleteError } = await supabase
    .from("entry_embeddings")
    .delete()
    .eq("entry_id", entryId);

  if (deleteError) {
    throw new Error(`Failed to delete old embeddings: ${deleteError.message}`);
  }

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
}

async function processReEmbedFamily(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  job: BackgroundJob
): Promise<void> {
  const { familyId } = job.payload as { familyId: string };

  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("id, title, content")
    .eq("family_id", familyId);

  if (entriesError) {
    throw new Error(`Failed to fetch entries: ${entriesError.message}`);
  }

  if (!entries || entries.length === 0) return;

  // Delete all existing embeddings for the family
  const { error: deleteError } = await supabase
    .from("entry_embeddings")
    .delete()
    .eq("family_id", familyId);

  if (deleteError) {
    throw new Error(`Failed to delete old embeddings: ${deleteError.message}`);
  }

  // Re-embed each entry
  for (const entry of entries) {
    const fullText = `${entry.title}\n\n${entry.content}`;
    const chunks = chunkText(fullText);

    if (chunks.length === 0) continue;

    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(chunkTexts, "RETRIEVAL_DOCUMENT");

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
        `[cron/embedding] Failed to insert embeddings for entry ${entry.id}:`,
        insertError
      );
      // Continue to next entry rather than aborting the whole job
    }
  }
}
