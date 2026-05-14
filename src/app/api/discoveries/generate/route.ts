import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getActiveFamilyIdFromCookie } from "@/lib/active-family-server";
import { buildPiiContext, sanitize, restore, type KnownMember } from "@/lib/pii/sanitizer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

export type GenerationResult =
  | { ok: true; generated: number; message?: string }
  | { ok: false; status: number; error: string };

/**
 * Core discovery generation — runs against one family with whichever
 * Supabase client is passed in (user-session OR admin). Extracted so both
 * the user-facing POST and the daily cron orchestrator can share the logic.
 */
export async function runDiscoveryGeneration(
  sb: SupabaseLike,
  familyId: string
): Promise<GenerationResult> {
  // Skip if we already generated within 24h for this family.
  const { data: recentDiscoveries } = await sb
    .from("griot_discoveries")
    .select("id")
    .eq("family_id", familyId)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (recentDiscoveries && recentDiscoveries.length > 0) {
    return {
      ok: true,
      generated: 0,
      message: "Discoveries already generated recently",
    };
  }

  // --- Gather family context ---

  const { data: entries } = await sb
    .from("entries")
    .select("id, title, content, type, tags, author_id, created_at, structured_data")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!entries || entries.length < 2) {
    return {
      ok: true,
      generated: 0,
      message: "Not enough entries to generate discoveries",
    };
  }

  const { data: members } = await sb
    .from("family_members")
    .select("user_id, display_name, role")
    .eq("family_id", familyId);

  const memberMap: Record<string, string> = {};
  for (const m of members ?? []) {
    if (m.user_id && m.display_name) memberMap[m.user_id] = m.display_name;
  }

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
    .map((m: { display_name: string; relationship_label: string | null }) =>
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

  const prompt = sanitize(rawPrompt, piiCtx);

  // --- Call LLM ---
  if (!OPENROUTER_API_KEY) {
    return { ok: false, status: 500, error: "LLM not configured" };
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
      return { ok: false, status: 502, error: "LLM request failed" };
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content ?? "[]";

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
      return { ok: false, status: 500, error: "Failed to parse discoveries" };
    }

    if (!Array.isArray(discoveries) || discoveries.length === 0) {
      return { ok: true, generated: 0 };
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

    return { ok: true, generated: inserted };
  } catch (err) {
    console.error("[Discoveries] Error:", err);
    return { ok: false, status: 500, error: "Internal error" };
  }
}

/**
 * POST /api/discoveries/generate
 *
 * Two auth paths:
 *   1. Cookie/session (user-initiated). Rate-limited. Resolves family from
 *      active-hub cookie (with DB fallback to the user's first family).
 *   2. Cron (server-initiated). Requires `x-cron-secret` header. Accepts a
 *      JSON body `{ familyId }` and uses the admin client.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const suppliedSecret = request.headers.get("x-cron-secret");
  const isCronCall = !!cronSecret && suppliedSecret === cronSecret;

  let familyId: string;
  let sb: SupabaseLike;

  if (isCronCall) {
    const body = (await request.json().catch(() => ({}))) as { familyId?: string };
    if (!body.familyId) {
      return NextResponse.json(
        { error: "familyId required for cron call" },
        { status: 400 }
      );
    }
    familyId = body.familyId;
    sb = createAdminClient();
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`discoveries:${user.id}`, 3);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const cookieFamilyId = await getActiveFamilyIdFromCookie();
    let resolvedFamilyId = cookieFamilyId;
    if (!resolvedFamilyId) {
      const { data: firstMember } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!firstMember) {
        return NextResponse.json({ error: "No family" }, { status: 400 });
      }
      resolvedFamilyId = firstMember.family_id;
    }
    familyId = resolvedFamilyId;
    sb = supabase;
  }

  const result = await runDiscoveryGeneration(sb, familyId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    generated: result.generated,
    ...(result.message ? { message: result.message } : {}),
  });
}
