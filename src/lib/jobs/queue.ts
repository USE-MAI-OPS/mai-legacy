import { createAdminClient } from "@/lib/supabase/server";

export type JobType = "embed_entry" | "re_embed_family";
export type JobStatus = "pending" | "processing" | "done" | "failed";

export interface BackgroundJob {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error: string | null;
  family_id: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

/**
 * Enqueue a job to generate/refresh embeddings for a single entry.
 * Returns the created job ID.
 */
export async function enqueueEmbedJob(
  entryId: string,
  familyId: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const payload = { entryId } as Record<string, unknown>;

  const { data, error } = await supabase
    .from("background_jobs")
    .insert({
      type: "embed_entry" as const,
      payload,
      family_id: familyId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[jobs/queue] Failed to enqueue embed_entry job:", error);
    return null;
  }

  return data.id;
}

/**
 * Enqueue a job to re-embed ALL entries in a family.
 * Returns the created job ID.
 */
export async function enqueueReEmbedFamilyJob(
  familyId: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const payload = { familyId } as Record<string, unknown>;

  const { data, error } = await supabase
    .from("background_jobs")
    .insert({
      type: "re_embed_family" as const,
      payload,
      family_id: familyId,
    })
    .select("id")
    .single();

  if (error) {
    console.error(
      "[jobs/queue] Failed to enqueue re_embed_family job:",
      error
    );
    return null;
  }

  return data.id;
}

/**
 * Fetch the current status of a job by ID.
 * Uses admin client so no RLS; callers must verify access separately.
 */
export async function getJobStatus(
  jobId: string
): Promise<BackgroundJob | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("background_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !data) return null;
  return data as BackgroundJob;
}
