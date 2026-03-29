import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getActiveFamilyIdFromCookie } from "@/lib/active-family-server";
import { buildPiiContext, sanitize, restore, type KnownMember } from "@/lib/pii/sanitizer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * POST /api/discoveries/generate
 *
 * Scans the family's entries, members, and events to generate AI-powered
 * discovery cards — connections, patterns, "on this day" moments, and
 * missing-piece prompts.
 *
 * These get inserted into `griot_discoveries` and surfaced in the feed.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`discoveries:${user.id}`, 3); // 3 per minute
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  const cookieFamilyId = await getActiveFamilyIdFromCookie();
  const sb = supabase;

  let familyId = cookieFamilyId;
  if (!familyId) {
    const { data: firstMember } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!firstMember) {
      return NextResponse.json({ error: "No family" }, { status: 400 });
    }
    familyId = firstMember.family_id;
  }

  // Don't generate if we already have recent discoveries (within 24h)
  const { data: recentDiscoveries } = await sb
    .from("griot_discoveries")
    .select("id")
    .eq("family_id", familyId)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (recentDiscoveries && recentDiscoveries.length > 0) {
    return NextResponse.json({
      success: true,
      message: "Discoveries already generated recently",
      generated: 0,
    });
  }

  // --- Gather family context ---

  // 1. All entries (titles + types + authors + dates)
  const { data: entries } = await sb
    .from("entries")
    .select("id, title, content, type, tags, author_id, created_at, structured_data")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!entries || entries.length < 2) {
    return NextResponse.json({
      success: true,
      message: "Not enough entries to generate discoveries",
      generated: 0,
    });
  }

  // 2. Family members
  const { data: members } = await sb
    .from("family_members")
    .select("user_id, display_name, role")
    .eq("family_id", familyId);

  const memberMap: Record<string, string> = {};
  for (const m of members ?? []) {
    if (m.user_id && m.display_name) memberMap[m.user_id] = m.display_name;
  }

  // 3. Family tree members (for relationship context)
  const { data: treeMembers } = await sb
    .from("family_tree_members")
    .select("id, display_name, relationship_label")
    .eq("family_id", familyId)
    .limit(50);

  // --- Build PII context for sanitization ---
  const piiMembers: KnownMember[] = [];
  for (const m of members ?? []) {
    if (m.display_name) piiMembers.push({ displayName: m.display_name });
  }
  for (const tm of treeMembers ?? []) {
    if (tm.display_name && !piiMembers.some((p) => p.displayName === tm.display_name)) {
      piiMembers.push({ displayName: tm.display_name });
    }
  }
  const piiCtx = buildPiiContext(piiMembers);

  // --- Build context for LLM ---
  const entryDescriptions = (entries ?? [])
    .map((e: { id: string; title: string; type: string; content: string; author_id: string; tags: string[]; created_at: string }) => {
      const author = memberMap[e.author_id] ?? "Unknown";
      const date = new Date(e.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const snippet = e.content?.slice(0, 200) ?? "";
      const tags = (e.tags ?? []).join(", ");
      return `- [${e.type}] "${e.title}" by ${author} (${date})${tags ? ` [${tags}]` : ""}\n  ${snippet}`;
    })
    .join("\n");

  const treeMemberList = (treeMembers ?? [])
    .map((m) =>
      `${m.display_name}${m.relationship_label ? ` (${m.relationship_label})` : ""}`
    )
    .join(", ");

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const rawPrompt = `You are Griot, the AI family historian for this family. Analyze the family's entries and generate 2-4 discovery cards — insightful connections, patterns, or interesting observations that the family might not have noticed.

FAMILY MEMBERS: ${treeMemberList || "Not provided"}

FAMILY ENTRIES:
${entryDescriptions}

TODAY'S DATE: ${todayStr}

Generate discovery cards as a JSON array. Each card must have:
- "discovery_type": one of "connection" | "pattern" | "on_this_day" | "missing_piece" | "milestone"
- "title": a short engaging title (max 60 chars)
- "body": 1-2 sentences explaining the discovery (max 200 chars)
- "related_entry_ids": array of entry IDs this discovery references (from the entries above)
- "related_members": array of member names involved

Rules:
- "connection" = two entries or members share something unexpected (same job, same place, similar themes)
- "pattern" = multiple entries share a theme (e.g., 3 recipes from the same region)
- "on_this_day" = an entry that happened around today's date in a past year
- "missing_piece" = a gap in the family knowledge (e.g., "No one has shared stories about your grandmother")
- "milestone" = a celebration (e.g., "Your family just hit 50 entries!")

Be warm, specific, and culturally aware. Reference entry titles and member names.

Return ONLY a valid JSON array. No markdown, no explanation.`;

  // Sanitize the prompt to strip PII before sending to external LLM
  const prompt = sanitize(rawPrompt, piiCtx);

  // --- Call LLM ---
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "LLM not configured" }, { status: 500 });
  }

  try {
    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "minimax/minimax-m1",
        messages: [
          { role: "system", content: "You are a JSON-only response bot. Return only valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error("[Discoveries] LLM error:", errText);
      return NextResponse.json({ error: "LLM request failed" }, { status: 502 });
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content ?? "[]";

    // Parse JSON from response (strip markdown fences if present)
    let discoveries: Array<{
      discovery_type: string;
      title: string;
      body: string;
      related_entry_ids?: string[];
      related_members?: string[];
    }>;

    try {
      const cleaned = rawContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      discoveries = JSON.parse(cleaned);
    } catch {
      console.error("[Discoveries] Failed to parse LLM response:", rawContent);
      return NextResponse.json({ error: "Failed to parse discoveries" }, { status: 500 });
    }

    if (!Array.isArray(discoveries) || discoveries.length === 0) {
      return NextResponse.json({ success: true, generated: 0 });
    }

    // Restore PII tokens in discovery text before persisting
    for (const d of discoveries) {
      if (d.title) d.title = restore(d.title, piiCtx);
      if (d.body) d.body = restore(d.body, piiCtx);
      if (Array.isArray(d.related_members)) {
        d.related_members = d.related_members.map((name: string) =>
          restore(name, piiCtx)
        );
      }
    }

    // --- Insert into griot_discoveries ---
    const validTypes = ["connection", "pattern", "on_this_day", "missing_piece", "milestone"];
    let inserted = 0;

    for (const d of discoveries.slice(0, 5)) {
      if (!validTypes.includes(d.discovery_type)) continue;
      if (!d.title || !d.body) continue;

      const { error: insertError } = await sb.from("griot_discoveries").insert({
        family_id: familyId,
        discovery_type: d.discovery_type,
        title: d.title,
        body: d.body,
        related_entries: d.related_entry_ids ?? [],
        related_members: d.related_members ?? [],
      });

      if (insertError) {
        console.error("[Discoveries] Insert error:", insertError);
      } else {
        inserted++;
      }
    }

    return NextResponse.json({ success: true, generated: inserted });
  } catch (err) {
    console.error("[Discoveries] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
