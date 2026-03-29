import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireTier } from "@/lib/tier-check";
import { generateLegacyBookPdf, type LegacyBookEntry } from "@/lib/legacy-book-pdf";

/**
 * POST /api/legacy-book
 *
 * Generate a Legacy Book PDF from a family's entries.
 *
 * Body:
 *   - familyId: string
 *   - entryIds?: string[]   — subset to include; omit for all entries
 *
 * Auth: authenticated family member on roots or legacy tier.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { familyId, entryIds } = body as { familyId?: string; entryIds?: string[] };

    if (!familyId) {
      return NextResponse.json({ error: "Missing required field: familyId" }, { status: 400 });
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
    const { data: membership, error: memberError } = await admin
      .from("family_members")
      .select("role, display_name")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Tier gate — requires at least "roots"
    const { allowed, currentTier } = await requireTier(familyId, "roots");
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Legacy Book export requires a paid plan",
          currentTier,
          requiredTier: "roots",
        },
        { status: 403 }
      );
    }

    // Fetch family name
    const { data: family } = await admin
      .from("families")
      .select("name")
      .eq("id", familyId)
      .single();

    const familyName = family?.name ?? "Our Family";

    // Fetch entries
    let query = admin
      .from("entries")
      .select("id, title, content, type, tags, created_at, author_id")
      .eq("family_id", familyId)
      .order("created_at", { ascending: true });

    if (entryIds && entryIds.length > 0) {
      query = query.in("id", entryIds);
    }

    const { data: entries, error: entriesError } = await query;

    if (entriesError) {
      console.error("[/api/legacy-book] entries error:", entriesError);
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "No entries found" }, { status: 404 });
    }

    // Resolve author names
    const authorIds = [...new Set(entries.map((e) => e.author_id).filter(Boolean))];
    const authorMap: Record<string, string> = {};
    if (authorIds.length > 0) {
      const { data: members } = await admin
        .from("family_members")
        .select("user_id, display_name")
        .eq("family_id", familyId)
        .in("user_id", authorIds);
      for (const m of members ?? []) {
        if (m.user_id && m.display_name) authorMap[m.user_id] = m.display_name;
      }
    }

    const bookEntries: LegacyBookEntry[] = entries.map((e) => ({
      id: e.id,
      title: e.title ?? "Untitled",
      content: e.content ?? "",
      type: e.type ?? "general",
      tags: (e.tags as string[]) ?? [],
      authorName: authorMap[e.author_id] ?? "Unknown",
      date: e.created_at,
    }));

    // Generate PDF
    const pdfBuffer = await generateLegacyBookPdf({
      familyName,
      entries: bookEntries,
      generatedAt: new Date().toISOString(),
    });

    const filename = `${familyName.replace(/[^a-z0-9]/gi, "_")}_Legacy_Book_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error("[/api/legacy-book] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
