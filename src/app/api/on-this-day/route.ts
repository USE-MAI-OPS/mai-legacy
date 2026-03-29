import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConnectionChain } from "@/lib/connection-chain";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getActiveFamilyIdFromCookie } from "@/lib/active-family-server";

export const dynamic = "force-dynamic";

export interface OnThisDayEntry {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  structured_data: unknown;
  is_mature: boolean;
  author_id: string;
  author_name: string;
  created_at: string;
  years_ago: number;
}

// ---------------------------------------------------------------------------
// GET /api/on-this-day
// Returns up to 5 entries created on today's month+day in prior years,
// filtered by connection chain privacy.
// ---------------------------------------------------------------------------
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`on-this-day:${user.id}`, 30);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  const cookieFamilyId = await getActiveFamilyIdFromCookie();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  let familyId = cookieFamilyId;
  if (!familyId) {
    const { data: firstMember } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!firstMember) {
      return NextResponse.json({ items: [] });
    }
    familyId = firstMember.family_id;
  }

  const chain = await getConnectionChain(sb, familyId!, user.id);

  const today = new Date();
  const month = today.getMonth() + 1; // 1-12
  const day = today.getDate(); // 1-31
  const currentYear = today.getFullYear();

  // Build OR filter: one date range per prior year (up to 20 years back)
  const dateRanges: string[] = [];
  for (let y = currentYear - 1; y >= currentYear - 20; y--) {
    const dateStr = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dateRanges.push(
      `and(created_at.gte.${dateStr}T00:00:00,created_at.lte.${dateStr}T23:59:59.999)`
    );
  }

  const { data: entries, error } = await sb
    .from("entries")
    .select(
      "id, title, content, type, tags, structured_data, is_mature, created_at, author_id"
    )
    .eq("family_id", familyId)
    .in("author_id", chain.connectedUserIds)
    .or(dateRanges.join(","))
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("On This Day error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  // Batch-resolve author names
  const authorIds = [
    ...new Set(
      (entries ?? [])
        .map((e: { author_id: string }) => e.author_id)
        .filter(Boolean)
    ),
  ];
  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: members } = await sb
      .from("family_members")
      .select("user_id, display_name")
      .eq("family_id", familyId)
      .in("user_id", authorIds);
    for (const m of members ?? []) {
      if (m.user_id && m.display_name) authorMap[m.user_id] = m.display_name;
    }
  }

  const items: OnThisDayEntry[] = (entries ?? []).map(
    (e: {
      id: string;
      title: string;
      content: string;
      type: string;
      tags: string[];
      structured_data: unknown;
      is_mature: boolean;
      created_at: string;
      author_id: string;
    }) => ({
      id: e.id,
      title: e.title,
      content: e.content,
      type: e.type,
      tags: e.tags ?? [],
      structured_data: e.structured_data ?? null,
      is_mature: e.is_mature ?? false,
      author_id: e.author_id,
      author_name: authorMap[e.author_id] ?? "Unknown",
      created_at: e.created_at,
      years_ago: currentYear - new Date(e.created_at).getFullYear(),
    })
  );

  return NextResponse.json({ items });
}
