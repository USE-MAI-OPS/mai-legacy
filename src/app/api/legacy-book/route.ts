import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/get-family-context";
import { generateLegacyBookPdf, type LegacyBookEntry } from "@/lib/legacy-book-pdf";

/**
 * POST /api/legacy-book
 *
 * Generate a Legacy Book PDF from the viewer's entries (aggregated across
 * every hub they belong to).
 *
 * Body:
 *   - familyId: string        — active hub; used only for the PDF title/filename
 *   - entryIds?: string[]     — subset to include; omit for all accessible entries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { familyId: activeFamilyId, entryIds } = body as { familyId?: string; entryIds?: string[] };

    const ctx = await getFamilyContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { familyIds, connectedUserIdsAll } = ctx;
    const headerFamilyId = activeFamilyId && familyIds.includes(activeFamilyId)
      ? activeFamilyId
      : ctx.familyId;

    const admin = createAdminClient();

    // Fetch family name from the hub the viewer is on — used only for the
    // book title and filename. Entries themselves span every hub.
    const { data: family } = await admin
      .from("families")
      .select("name")
      .eq("id", headerFamilyId)
      .single();

    const familyName = family?.name ?? "Our Family";

    // Fetch entries across every hub the viewer belongs to, scoped to authors
    // in their combined connection chain.
    let query = admin
      .from("entries")
      .select("id, title, content, type, tags, created_at, author_id")
      .in("family_id", familyIds)
      .in("author_id", connectedUserIdsAll)
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

    // Resolve author names across every hub that surfaced a row.
    const authorIds = [...new Set(entries.map((e) => e.author_id).filter(Boolean))];
    const authorMap: Record<string, string> = {};
    if (authorIds.length > 0) {
      const { data: members } = await admin
        .from("family_members")
        .select("user_id, display_name")
        .in("family_id", familyIds)
        .in("user_id", authorIds);
      for (const m of members ?? []) {
        if (m.user_id && m.display_name && !authorMap[m.user_id]) {
          authorMap[m.user_id] = m.display_name;
        }
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
