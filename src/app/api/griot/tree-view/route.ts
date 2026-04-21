import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
// FilterPlan response — matches the client-side FilterPlan type in
// mai-tree-types.ts. Mirrors what planFromQuery emits locally so the client
// can fall back to local parsing without changing its data contract.
// ---------------------------------------------------------------------------

type TreeGroup = "family" | "friend" | "work" | "school" | "mentor" | "community" | "other";
type TreeSide = "mom" | "dad";

interface FilterSpec {
  groups?: TreeGroup[];
  tags?: string[];
  side?: TreeSide;
  q?: string;
  minAge?: number;
  maxAge?: number;
  location?: string;
  __label?: string;
}

interface SplitSpec {
  left: FilterSpec & { label: string };
  right: FilterSpec & { label: string };
  label: string;
}

interface FilterPlan {
  type: "filter" | "split";
  filters?: FilterSpec[];
  split?: SplitSpec;
  summary: string;
}

// ---------------------------------------------------------------------------
// POST /api/griot/tree-view
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, familyId } = body as {
      query?: string;
      familyId?: string;
    };

    if (!query || !familyId) {
      return json({ error: "Missing required fields: query, familyId" }, 400);
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

    const rl = rateLimit(`griot-tree-view:${user.id}`, 15);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const chain = await getConnectionChain(supabase, familyId, user.id);

    // Roster — same visibility relaxation as the tree page.
    const idFilter =
      chain.connectedTreeMemberIds.length === 0
        ? `added_by.eq.${user.id}`
        : `id.in.(${chain.connectedTreeMemberIds.map((id) => `"${id}"`).join(",")}),added_by.eq.${user.id}`;

    const { data: rosterRows, error: rosterError } = await supabase
      .from("family_tree_members")
      .select("display_name, group_type, side, tags, occupation, location")
      .eq("family_id", familyId)
      .or(idFilter);

    if (rosterError) {
      console.error("[griot-tree-view] roster error:", rosterError);
      return json(emptyPlan("I couldn't load your network just now."), 200);
    }

    const roster = rosterRows ?? [];

    // Collect vocabulary from the roster so the prompt can hint at real
    // filter targets (tags that actually exist in the data).
    const tagSet = new Set<string>();
    const locSet = new Set<string>();
    for (const r of roster) {
      const row = r as { tags?: string[] | null; location?: string | null };
      for (const t of row.tags ?? []) if (t) tagSet.add(t);
      if (row.location) locSet.add(row.location);
    }

    // PII sanitizer (light-touch — we don't ship chunks through the LLM here).
    const piiMembers: KnownMember[] = [];
    const { data: memberRows } = await supabase
      .from("family_members")
      .select("display_name, email, phone, nickname")
      .eq("family_id", familyId)
      .in("user_id", chain.connectedUserIds);
    for (const m of memberRows ?? []) {
      piiMembers.push({
        displayName: m.display_name,
        email: m.email,
        phone: m.phone,
        nickname: m.nickname,
      });
    }
    for (const r of roster) {
      const row = r as { display_name: string };
      if (!piiMembers.some((m) => m.displayName === row.display_name)) {
        piiMembers.push({ displayName: row.display_name });
      }
    }
    const piiCtx = buildPiiContext(piiMembers);

    const systemPrompt = buildSystemPrompt({
      tagExamples: Array.from(tagSet).slice(0, 30),
      locationExamples: Array.from(locSet).slice(0, 12),
    });

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
          { role: "user", content: sanitize(query, piiCtx) },
        ],
        temperature: 0.2,
        max_tokens: 512,
      }),
    });

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error("[griot-tree-view] OpenRouter error:", llmResponse.status, errorBody);
      // 200 with null plan triggers client fallback cleanly.
      return json({ plan: null }, 200);
    }

    const llmJson = (await llmResponse.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (llmJson.error?.message) {
      console.error("[griot-tree-view] OpenRouter payload error:", llmJson.error);
      return json({ plan: null }, 200);
    }

    const raw = llmJson.choices?.[0]?.message?.content ?? "";
    const parsed = parseModelJson(raw);
    if (!parsed) {
      console.error("[griot-tree-view] Failed to parse model JSON. Raw:", raw.slice(0, 400));
      return json({ plan: null }, 200);
    }

    const clampedPlan = clampPlan(parsed);
    if (!clampedPlan) {
      return json({ plan: null }, 200);
    }

    return json({ plan: clampedPlan });
  } catch (error) {
    console.error("[griot-tree-view] Unexpected error:", error);
    return json({ plan: null }, 200);
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt(args: {
  tagExamples: string[];
  locationExamples: string[];
}): string {
  const tags = args.tagExamples.length ? JSON.stringify(args.tagExamples) : "[]";
  const locs = args.locationExamples.length ? JSON.stringify(args.locationExamples) : "[]";

  return `You translate the user's natural-language query into a FilterPlan for the MAI Tree canvas.

OUTPUT CONTRACT:
- Reply with ONE JSON object. No prose outside JSON. No markdown code fences. First character must be "{", last must be "}".
- Always include a "summary" string — one warm sentence explaining what you did.

Shape:
{
  "type": "filter" | "split",
  // For type="filter":
  "filters": [ { "groups"?: ["family"|"friend"|"work"|"school"|"mentor"|"community"|"other"],
                 "tags"?: string[],
                 "side"?: "mom"|"dad",
                 "q"?: string,
                 "minAge"?: number, "maxAge"?: number,
                 "location"?: string,
                 "__label"?: string } ],
  // For type="split":
  "split": {
    "left":  { ...FilterSpec fields..., "label": string },
    "right": { ...FilterSpec fields..., "label": string },
    "label": string
  },
  "summary": string
}

Rules:
- Use "split" when the user compares two groups ("mom vs dad", "family vs friends", "work vs school"). Otherwise use "filter".
- Multiple independent asks → multiple filter entries in the filters array (they AND together).
- Tag-based queries ("tech people", "Morehouse alumni") go under tags. Use only tags that actually exist.
- Age ranges: "elders" → minAge: 60. "young cousins" → maxAge: 30.
- Location matching is substring ("Jackson" matches "Jackson, MS").
- Always set __label on each filter to a short human label (e.g. "Mom's side", "Tech", "60+").
- If the ask is vague and nothing matches, still emit a valid filter that narrows to groups: [] with a summary explaining you weren't sure.

Available tag vocabulary (real values from this user's network):
${tags}

Example locations in this network:
${locs}

Examples of perfect output:

Query: "show me mom's side"
{"type":"filter","filters":[{"groups":["family"],"side":"mom","__label":"Mom's side"}],"summary":"Showing your mom's side of the family."}

Query: "family vs friends"
{"type":"split","split":{"left":{"groups":["family"],"label":"Family"},"right":{"groups":["friend"],"label":"Friends"},"label":"Family vs Friends"},"summary":"Family clustered on the left, friends on the right."}

Query: "who's in tech"
{"type":"filter","filters":[{"tags":["tech"],"__label":"Tech"}],"summary":"Everyone you know in tech."}

Query: "morehouse alumni who are doctors"
{"type":"filter","filters":[{"tags":["Morehouse"],"__label":"Morehouse"},{"q":"doctor","__label":"doctor"}],"summary":"Morehouse alumni whose profile mentions doctor."}`;
}

// ---------------------------------------------------------------------------
// Plan validation + clamping
// ---------------------------------------------------------------------------

const ALLOWED_GROUPS: TreeGroup[] = [
  "family",
  "friend",
  "work",
  "school",
  "mentor",
  "community",
  "other",
];

function clampFilter(raw: unknown): FilterSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: FilterSpec = {};

  if (Array.isArray(r.groups)) {
    const g = r.groups.filter(
      (v): v is TreeGroup => typeof v === "string" && ALLOWED_GROUPS.includes(v as TreeGroup)
    );
    out.groups = g;
  }
  if (Array.isArray(r.tags)) {
    out.tags = r.tags.filter((v): v is string => typeof v === "string");
  }
  if (r.side === "mom" || r.side === "dad") out.side = r.side;
  if (typeof r.q === "string") out.q = r.q;
  if (typeof r.minAge === "number") out.minAge = r.minAge;
  if (typeof r.maxAge === "number") out.maxAge = r.maxAge;
  if (typeof r.location === "string") out.location = r.location;
  if (typeof r.__label === "string") out.__label = r.__label;

  return out;
}

const GROUP_LABELS: Record<TreeGroup, string> = {
  family: "Family",
  friend: "Friends",
  work: "Work",
  school: "School",
  mentor: "Mentors",
  community: "Community",
  other: "Other",
};

function deriveSplitLabel(filter: FilterSpec): string {
  // Prefer a labeled group, else a tag, else a side hint, else generic.
  if (filter.groups && filter.groups.length === 1) {
    if (filter.side === "mom") return "Mom's side";
    if (filter.side === "dad") return "Dad's side";
    return GROUP_LABELS[filter.groups[0]];
  }
  if (filter.tags && filter.tags.length === 1) return filter.tags[0];
  if (filter.side === "mom") return "Mom's side";
  if (filter.side === "dad") return "Dad's side";
  return "Group";
}

function clampSplitSide(raw: unknown): (FilterSpec & { label: string }) | null {
  const base = clampFilter(raw);
  if (!base) return null;
  const rawLabel = (raw as { label?: unknown }).label;
  const label =
    typeof rawLabel === "string" && rawLabel.trim()
      ? rawLabel.trim()
      : deriveSplitLabel(base);
  return { ...base, label };
}

function clampPlan(raw: unknown): FilterPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const summary = typeof r.summary === "string" ? r.summary : "Here's the view you asked for.";

  if (r.type === "split" && r.split && typeof r.split === "object") {
    const s = r.split as Record<string, unknown>;
    const left = clampSplitSide(s.left);
    const right = clampSplitSide(s.right);
    const label = typeof s.label === "string" ? s.label : `${left?.label ?? ""} vs ${right?.label ?? ""}`;
    if (!left || !right) return null;
    return { type: "split", split: { left, right, label }, summary };
  }

  if (r.type === "filter") {
    const fs = Array.isArray(r.filters) ? r.filters : [];
    const filters = fs.map(clampFilter).filter((f): f is FilterSpec => f !== null);
    return { type: "filter", filters, summary };
  }

  return null;
}

function emptyPlan(summary: string): { plan: FilterPlan } {
  return {
    plan: {
      type: "filter",
      filters: [{ groups: [], __label: "Everyone" }],
      summary,
    },
  };
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

function parseModelJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
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
