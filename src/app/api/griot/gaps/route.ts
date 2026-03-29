import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { detectGaps, type FamilyEntryCounts } from "@/lib/gap-detection";

/**
 * GET /api/griot/gaps?familyId=xxx
 *
 * Returns gap suggestions for a family's entry collection.
 * Auth: authenticated family member.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("familyId");

    if (!familyId) {
      return NextResponse.json({ error: "Missing familyId" }, { status: 400 });
    }

    // Auth
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify membership
    const { data: membership } = await admin
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Count entries per type
    const { data: entryCounts, error: countError } = await admin
      .from("entries")
      .select("type")
      .eq("family_id", familyId);

    if (countError) {
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }

    const counts: FamilyEntryCounts = {};
    for (const row of entryCounts ?? []) {
      if (row.type) {
        counts[row.type] = (counts[row.type] ?? 0) + 1;
      }
    }

    const gaps = detectGaps(counts, 3);

    return NextResponse.json({ gaps, counts });
  } catch (err) {
    console.error("[/api/griot/gaps] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
