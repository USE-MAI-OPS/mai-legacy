import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enqueueReEmbedFamilyJob } from "@/lib/jobs/queue";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/entries/re-embed-all
 *
 * Enqueues a background job to re-generate Gemini embeddings for ALL entries
 * in the caller's family. Returns immediately with a job ID that can be polled
 * via GET /api/jobs/:jobId.
 *
 * Admin-only operation.
 */
export async function POST() {
  try {
    const supabase = await createClient();

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

    const jobId = await enqueueReEmbedFamilyJob(membership.family_id);

    if (!jobId) {
      return NextResponse.json(
        { error: "Failed to enqueue re-indexing job" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      message: "Re-indexing started in the background. Poll /api/jobs/:jobId for status.",
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
