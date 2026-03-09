import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractFromTranscript } from "@/lib/interview/extract";
import type { ExtractionRequest } from "@/lib/interview/types";

/**
 * POST /api/interview/extract
 *
 * Extracts structured entries and profile updates from an interview transcript.
 *
 * Request body: ExtractionRequest
 * Response: { success: boolean; data?: ExtractionResult; error?: string; provider?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ExtractionRequest;

    if (!body.transcript || !body.subject_member_name) {
      return Response.json(
        { error: "Missing required fields: transcript, subject_member_name" },
        { status: 400 }
      );
    }

    // Update transcript status to processing
    if (body.transcript_id) {
      const sb = supabase as any;
      await sb
        .from("interview_transcripts")
        .update({ extraction_status: "processing" })
        .eq("id", body.transcript_id);
    }

    // Run extraction
    const { result, provider } = await extractFromTranscript(
      body.transcript,
      body.subject_member_name,
      body.existing_profile
    );

    // Update transcript with results
    if (body.transcript_id) {
      const sb = supabase as any;
      await sb
        .from("interview_transcripts")
        .update({
          extraction_status: "completed",
          extracted_data: result,
          processed_at: new Date().toISOString(),
        })
        .eq("id", body.transcript_id);
    }

    return Response.json({
      success: true,
      data: result,
      provider,
      transcript_id: body.transcript_id,
    });
  } catch (error) {
    console.error("[interview/extract] Error:", error);

    // Try to update transcript status to failed
    try {
      const body = await request.clone().json();
      if (body.transcript_id) {
        const supabase = await createClient();
        const sb = supabase as any;
        await sb
          .from("interview_transcripts")
          .update({
            extraction_status: "failed",
            error_message:
              error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", body.transcript_id);
      }
    } catch {
      // Ignore secondary errors
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to extract entries",
      },
      { status: 500 }
    );
  }
}
