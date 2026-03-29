import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getJobStatus } from "@/lib/jobs/queue";

/**
 * GET /api/jobs/:jobId
 *
 * Returns the current status of a background job.
 * The caller must be a member of the family the job belongs to.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await getJobStatus(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify the caller belongs to the job's family
    if (job.family_id) {
      const { data: membership } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("family_id", job.family_id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at,
      processed_at: job.processed_at,
    });
  } catch (error) {
    console.error("[jobs/:jobId] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
