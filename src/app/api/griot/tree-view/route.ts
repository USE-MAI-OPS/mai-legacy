import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFamilyKnowledge } from "@/lib/rag/search";
import { getConnectionChain } from "@/lib/connection-chain";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  buildPiiContext,
  sanitize,
  type KnownMember,
} from "@/lib/pii/sanitizer";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "minimax/minimax-m2.5";

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

interface TreeViewCluster {
  label: string;
  memberIds: string[];
}

interface TreeViewSpecResponse {
  visibleIds: string[] | null;
  dimIds: string[];
  clusters: TreeViewCluster[] | null;
  pillLabel: string | null;
  source: "griot";
}

interface TreeViewApiResponse {
  viewSpec: TreeViewSpecResponse;
  narration: string;
}

// ---------------------------------------------------------------------------
// POST /api/griot/tree-view
//
// One-shot JSON endpoint that turns a natural-language query into a
// TreeViewSpec the MAI Tree canvas can render. Backed by the same RAG
// pipeline as /api/griot but returns structured JSON instead of prose.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, familyId } = body as {
      query?: string;
      familyId?: string;
    };

    if (!query || !familyId) {
      return json(
        { error: "Missing required fields: query, familyId" },
        400
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return json(
        { error: "Server misconfiguration: missing OPENROUTER_API_KEY" },
        500
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    // Rate limit: 15 / minute per user — a little tighter than /api/griot
    // since every call costs an LLM round-trip.
    const rl = rateLimit(`griot-tree-view:${user.id}`, 15);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const chain = await getConnectionChain(supabase, familyId, user.id);

    // ------------------------------------------------------------------
    // Fetch the roster scoped to connected members. Include group_type
    // so the model knows the existing sidebar-preset affiliations.
    // ------------------------------------------------------------------
    let treeQuery = supabase
      .from("family_tree_members")
      .select(
        "id, display_name, birth_year, relationship_label, group_type, is_deceased, linked_member_id"
      )
      .eq("family_id", familyId);

    if (chain.connectedTreeMemberIds.length > 0) {
      treeQuery = treeQuery.in("id", chain.connectedTreeMemberIds);
    }

    const { data: rosterRows, error: rosterError } = await treeQuery;
    if (rosterError) {
      console.error("[griot-tree-view] roster error:", rosterError);
      return json({ error: "Failed to load family roster" }, 500);
    }

    type RosterRow = {
      id: string;
      display_name: string;
      birth_year: number | null;
      relationship_label: string | null;
      group_type: string | null;
      is_deceased: boolean;
      linked_member_id: string | null;
    };

    const roster: RosterRow[] = rosterRows ?? [];

    if (roster.length === 0) {
      // Nothing to filter — return an empty spec with a gentle narration.
      return json<TreeViewApiResponse>({
        viewSpec: {
          visibleIds: null,
          dimIds: [],
          clusters: null,
          pillLabel: null,
          source: "griot",
        },
        narration:
          "Your tree is empty right now. Add a few people and I'll be able to rearrange the view however you'd like.",
      });
    }

    // Build nickname/first-name index for PII sanitization + chunk scanning.
    const { data: memberRows } = await supabase
      .from("family_members")
      .select("display_name, email, phone, nickname")
      .eq("family_id", familyId)
      .in("user_id", chain.connectedUserIds);

    const piiMembers: KnownMember[] = (memberRows ?? []).map((r) => ({
      displayName: r.display_name,
      email: r.email,
      phone: r.phone,
      nickname: r.nickname,
    }));
    // Also include tree-member names so we can scan chunks for them.
    for (const t of roster) {
      if (!piiMembers.some((m) => m.displayName === t.display_name)) {
        piiMembers.push({ displayName: t.display_name });
      }
    }
    const piiCtx = buildPiiContext(piiMembers);

    // ------------------------------------------------------------------
    // RAG: pull top chunks relevant to the query and scan each for
    // roster-member mentions. This is the "entity linking" grounding
    // that lets queries like "who did I go to school with" find people
    // named in education-context entries.
    // ------------------------------------------------------------------
    let searchResults: Awaited<ReturnType<typeof searchFamilyKnowledge>> = [];
    try {
      searchResults = await searchFamilyKnowledge(
        query,
        familyId,
        8,
        chain.connectedUserIds
      );
    } catch (err) {
      console.error("[griot-tree-view] RAG search failed:", err);
      // Continue without RAG context — model will fall back to group_type.
    }

    // Build a lookup of roster-member names (plus first-name tokens >= 3 chars)
    // so chunk mentions can be tied back to specific IDs.
    const nameToIds = new Map<string, string[]>();
    const addName = (name: string, id: string) => {
      const key = name.toLowerCase().trim();
      if (!key) return;
      const list = nameToIds.get(key) ?? [];
      if (!list.includes(id)) list.push(id);
      nameToIds.set(key, list);
    };
    for (const r of roster) {
      addName(r.display_name, r.id);
      const first = r.display_name.split(/\s+/)[0];
      if (first && first.length >= 3) addName(first, r.id);
    }

    const annotatedChunks = searchResults.map((chunk, i) => {
      const lower = chunk.chunk_text.toLowerCase();
      const mentioned = new Set<string>();
      for (const [name, ids] of nameToIds) {
        // word-boundary check — avoid "Rose" matching "Roseanne"
        const re = new RegExp(`\\b${escapeRegex(name)}\\b`, "i");
        if (re.test(lower)) {
          for (const id of ids) mentioned.add(id);
        }
      }
      return {
        idx: i + 1,
        title: chunk.title || "Untitled entry",
        text: chunk.chunk_text,
        mentioned_member_ids: Array.from(mentioned),
      };
    });

    // ------------------------------------------------------------------
    // Build prompt.
    // ------------------------------------------------------------------
    const rosterBlock = roster
      .map((r) => {
        const bits = [`id=${r.id}`, `name="${r.display_name}"`];
        if (r.group_type) bits.push(`group=${r.group_type}`);
        if (r.relationship_label) bits.push(`rel="${r.relationship_label}"`);
        if (r.birth_year) bits.push(`born=${r.birth_year}`);
        if (r.is_deceased) bits.push("deceased");
        return `- { ${bits.join(", ")} }`;
      })
      .join("\n");

    const chunkBlock =
      annotatedChunks.length > 0
        ? annotatedChunks
            .map(
              (c) =>
                `[#${c.idx}] "${c.title}"\nmentioned_member_ids: ${JSON.stringify(c.mentioned_member_ids)}\n${c.text}`
            )
            .join("\n\n---\n\n")
        : "(no relevant entries found)";

    const allowedIds = roster.map((r) => r.id);

    const systemPrompt = buildSystemPrompt({
      rosterBlock,
      chunkBlock,
      allowedIds,
    });

    const userMessage = sanitize(query, piiCtx);

    // ------------------------------------------------------------------
    // Call OpenRouter with JSON-object mode.
    // ------------------------------------------------------------------
    const llmResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "MAI Legacy - Griot Tree View",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: sanitize(systemPrompt, piiCtx) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 768,
        response_format: { type: "json_object" },
      }),
    });

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error("[griot-tree-view] OpenRouter error:", llmResponse.status, errorBody);
      return json({ error: "Failed to get a response from the Griot" }, 502);
    }

    const llmJson = (await llmResponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = llmJson.choices?.[0]?.message?.content ?? "";

    const parsed = parseModelJson(raw);
    if (!parsed) {
      console.error("[griot-tree-view] Failed to parse model JSON:", raw);
      return json({ error: "The Griot's reply wasn't valid JSON" }, 502);
    }

    // ------------------------------------------------------------------
    // Validate + clamp the spec against the allowed roster.
    // ------------------------------------------------------------------
    const allowedSet = new Set(allowedIds);
    const filterIds = (ids: unknown): string[] =>
      Array.isArray(ids)
        ? ids.filter((v): v is string => typeof v === "string" && allowedSet.has(v))
        : [];

    const rawSpec = (parsed.viewSpec ?? {}) as Record<string, unknown>;
    const visibleIds =
      rawSpec.visibleIds === null
        ? null
        : filterIds(rawSpec.visibleIds);
    const dimIds = filterIds(rawSpec.dimIds);

    const rawClusters = Array.isArray(rawSpec.clusters)
      ? (rawSpec.clusters as unknown[])
      : null;
    const clusters: TreeViewCluster[] | null = rawClusters
      ? rawClusters
          .map((c): TreeViewCluster | null => {
            if (!c || typeof c !== "object") return null;
            const rec = c as Record<string, unknown>;
            const label = typeof rec.label === "string" ? rec.label : null;
            const ids = filterIds(rec.memberIds);
            if (!label || ids.length === 0) return null;
            return { label, memberIds: ids };
          })
          .filter((c): c is TreeViewCluster => c !== null)
      : null;

    const pillLabel =
      typeof rawSpec.pillLabel === "string" && rawSpec.pillLabel.trim()
        ? rawSpec.pillLabel.trim()
        : null;

    const narration =
      typeof parsed.narration === "string"
        ? parsed.narration
        : "Here's the view you asked for.";

    // If the model returned no usable selection AND no clusters, treat it
    // as a "no matches" outcome — clear spec + keep its narration (which
    // typically explains why).
    const hasSelection =
      (visibleIds && visibleIds.length > 0) ||
      (clusters && clusters.length > 0);

    const viewSpec: TreeViewSpecResponse = hasSelection
      ? {
          visibleIds,
          dimIds,
          clusters: clusters && clusters.length > 0 ? clusters : null,
          pillLabel,
          source: "griot",
        }
      : {
          visibleIds: null,
          dimIds: [],
          clusters: null,
          pillLabel: null,
          source: "griot",
        };

    return json<TreeViewApiResponse>({ viewSpec, narration });
  } catch (error) {
    console.error("[griot-tree-view] Unexpected error:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(args: {
  rosterBlock: string;
  chunkBlock: string;
  allowedIds: string[];
}): string {
  return `You are the Griot's layout advisor for the MAI Tree (a visual people-network).
Your job: turn the user's question into a structured view of the tree.

You must respond with a single JSON object of the exact shape below. No prose outside JSON.

{
  "viewSpec": {
    "visibleIds": string[] | null,    // tree-member IDs to keep sharp. null = no filter.
    "dimIds":     string[],           // tree-member IDs to fade (optional, default []).
    "clusters":   null | [ { "label": string, "memberIds": string[] } ],
    "pillLabel":  string | null       // short phrase shown above the canvas (e.g. "People you went to school with"). null = no pill.
  },
  "narration": string                 // 1-2 warm sentences explaining the result.
}

Rules:
- You may ONLY use IDs from this allowed set:
${JSON.stringify(args.allowedIds)}
  Never invent IDs. Drop any name you can't tie to an ID.
- If the user is asking for a single group (e.g. "just my family", "show friends"), return visibleIds of matching members and put everyone else in dimIds. Do NOT return clusters.
- If the user asks to compare groups or see multiple buckets side by side (e.g. "family and coworkers", "school vs work"), return 2+ entries in "clusters". Leave visibleIds null when clusters is set.
- If the query references an entry-driven context ("people I went to school with", "who I worked with at Google"), use the FAMILY KNOWLEDGE chunks below to identify members. A member qualifies ONLY if they appear in a chunk that matches the context — either by being in mentioned_member_ids, or (for the user themselves) when the chunk's context otherwise implies the relationship. Do not guess based on vibes.
- If nothing matches, set visibleIds=null, dimIds=[], clusters=null, pillLabel=null, and say so warmly in narration.
- Never answer generic questions, tell stories, or add info beyond the spec + narration. You are strictly a layout planner.

--- FAMILY ROSTER ---
${args.rosterBlock}
--- END FAMILY ROSTER ---

--- FAMILY KNOWLEDGE (RAG chunks) ---
${args.chunkBlock}
--- END FAMILY KNOWLEDGE ---`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json<T>(payload: T, status: number = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse the model's JSON output. MiniMax with response_format=json_object
 * should return clean JSON, but fall back to a brace-extraction pass in
 * case the model wraps it in code fences or prose.
 */
function parseModelJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // Try to extract the first balanced JSON object.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
