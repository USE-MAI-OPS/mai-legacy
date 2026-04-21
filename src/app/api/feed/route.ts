import { NextRequest, NextResponse } from "next/server";
import { getFamilyContext } from "@/lib/get-family-context";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { EntryType } from "@/types/database";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Escape user-provided text before interpolating into a PostgREST .or() ilike
// filter. Strips the filter-string separators (`,` `(` `)`) that would break
// out of the filter grammar, and backslash-escapes the LIKE wildcards `%` and
// `_` so they don't match unintended rows.
// ---------------------------------------------------------------------------
const sanitizeIlike = (s: string) =>
  s.replace(/[%_\\]/g, "\\$&").replace(/[,()]/g, "");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FeedEntry {
  kind: "entry";
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
  reaction_count: number;
  comment_count: number;
  is_bookmarked: boolean;
}

export interface FeedPrompt {
  kind: "prompt";
  id: string;
  title: string;
  body: string;
  action_url: string;
  icon: string;
  created_at: string;
}

export interface FeedEvent {
  kind: "event";
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string | null;
  created_at: string;
}

export interface FeedDiscovery {
  kind: "discovery";
  id: string;
  discovery_type: string;
  title: string;
  body: string;
  related_entries: string[];
  related_members: string[];
  created_at: string;
}

export interface FeedGoal {
  kind: "goal";
  id: string;
  title: string;
  description: string;
  target_count: number;
  current_count: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface FeedGriotInsight {
  kind: "griot_insight";
  id: string;
  title: string;
  body: string;
  related_members: string[];
  created_at: string;
}

export type FeedItem = FeedEntry | FeedPrompt | FeedEvent | FeedDiscovery | FeedGoal | FeedGriotInsight;

// ---------------------------------------------------------------------------
// Valid entry types for the ?type= filter
// ---------------------------------------------------------------------------
const VALID_ENTRY_TYPES = new Set(["story", "recipe", "skill", "lesson", "connection", "general"]);

// ---------------------------------------------------------------------------
// GET /api/feed?cursor=<iso>&limit=<n>&type=<csv>&q=<search>
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const ctx = await getFamilyContext();
  if (!ctx) {
    return NextResponse.json({ items: [], nextCursor: null });
  }
  const { userId, familyIds, supabase, connectedUserIdsAll } = ctx;

  // Rate limit
  const rl = rateLimit(`feed:${userId}`, 30);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  // Parse query params
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // ISO timestamp
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
  const typeFilter = searchParams.get("type"); // comma-separated entry types, e.g. "story,recipe"
  const searchQuery = searchParams.get("q")?.trim() || null; // free-text search

  // Parse & validate type filter
  const filterTypes: string[] = [];
  if (typeFilter) {
    for (const t of typeFilter.split(",")) {
      const trimmed = t.trim().toLowerCase();
      if (VALID_ENTRY_TYPES.has(trimmed)) filterTypes.push(trimmed);
    }
  }

  const sb = supabase;

  // Fetch entries across every hub the viewer belongs to, from connected authors.
  // Aggregation replaces the previous hub/cross split — everything the viewer
  // has access to shows up regardless of which hub is "active".
  let entryQuery = sb
    .from("entries")
    .select(
      "id, title, content, type, tags, structured_data, is_mature, created_at, author_id, family_id"
    )
    .in("family_id", familyIds)
    .in("author_id", connectedUserIdsAll)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) entryQuery = entryQuery.lt("created_at", cursor);
  if (filterTypes.length > 0) entryQuery = entryQuery.in("type", filterTypes as EntryType[]);
  if (searchQuery) {
    const qStr = sanitizeIlike(searchQuery);
    entryQuery = entryQuery.or(`title.ilike.%${qStr}%,content.ilike.%${qStr}%`);
  }

  const { data: entries, error: entriesError } = await entryQuery;
  if (entriesError) {
    console.error("Feed entries error:", entriesError);
    return NextResponse.json(
      { error: "Failed to load feed" },
      { status: 500 }
    );
  }

  // Batch-resolve author names across every hub
  const authorIds = [
    ...new Set(
      (entries ?? []).map((e: { author_id: string }) => e.author_id).filter(Boolean)
    ),
  ];
  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: members } = await sb
      .from("family_members")
      .select("user_id, display_name")
      .in("family_id", familyIds)
      .in("user_id", authorIds);
    for (const m of members ?? []) {
      if (m.user_id && m.display_name) authorMap[m.user_id] = m.display_name;
    }
  }

  // Batch-fetch reaction and comment counts for these entries
  const entryIds = (entries ?? []).map((e: { id: string }) => e.id);
  const reactionCountMap: Record<string, number> = {};
  const commentCountMap: Record<string, number> = {};

  const bookmarkedSet = new Set<string>();
  if (entryIds.length > 0) {
    // Reaction counts per entry
    try {
      const { data: reactionData } = await sb
        .from("entry_reactions")
        .select("entry_id")
        .in("entry_id", entryIds);
      for (const r of reactionData ?? []) {
        reactionCountMap[r.entry_id] = (reactionCountMap[r.entry_id] ?? 0) + 1;
      }
    } catch { /* table may not exist yet */ }

    // Comment counts per entry
    try {
      const { data: commentData } = await sb
        .from("entry_comments")
        .select("entry_id")
        .in("entry_id", entryIds);
      for (const c of commentData ?? []) {
        commentCountMap[c.entry_id] = (commentCountMap[c.entry_id] ?? 0) + 1;
      }
    } catch { /* table may not exist yet */ }

    // Which of these entries has the viewer bookmarked? RLS restricts rows to
    // the viewer's own bookmarks so we don't need to filter by user_id here.
    try {
      const { data: bookmarkData } = await sb
        .from("entry_bookmarks")
        .select("entry_id")
        .in("entry_id", entryIds);
      for (const b of bookmarkData ?? []) {
        bookmarkedSet.add(b.entry_id);
      }
    } catch { /* table may not exist yet */ }
  }

  // Map to FeedEntry items
  const feedEntries: FeedEntry[] = (entries ?? []).map(
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
      kind: "entry" as const,
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
      reaction_count: reactionCountMap[e.id] ?? 0,
      comment_count: commentCountMap[e.id] ?? 0,
      is_bookmarked: bookmarkedSet.has(e.id),
    })
  );

  // --- Interleave upcoming events (only on first page, or when searching) ---
  const eventItems: FeedEvent[] = [];
  if (!cursor && filterTypes.length === 0) {
    let eventQuery = sb
      .from("family_events")
      .select("id, title, description, event_date, location, created_at")
      .in("family_id", familyIds)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(3);

    if (searchQuery) {
      const q = sanitizeIlike(searchQuery);
      eventQuery = eventQuery.or(
        `title.ilike.%${q}%,description.ilike.%${q}%`
      );
    }

    const { data: events } = await eventQuery;

    for (const ev of events ?? []) {
      eventItems.push({
        kind: "event",
        id: ev.id,
        title: ev.title,
        description: ev.description ?? "",
        event_date: ev.event_date,
        location: ev.location,
        created_at: ev.created_at,
      });
    }
  }

  // --- Generate content prompts (only on first page, skip when filtering/searching) ---
  const promptItems: FeedPrompt[] = [];
  if (!cursor && filterTypes.length === 0 && !searchQuery) {
    // Prompts surface when NO hub the user belongs to has covered the type yet.
    const types = ["recipe", "skill", "story", "lesson"];
    for (const t of types) {
      const { count } = await sb
        .from("entries")
        .select("id", { count: "exact", head: true })
        .in("family_id", familyIds)
        .eq("type", t as EntryType);

      if ((count ?? 0) === 0) {
        const labels: Record<string, { title: string; body: string; icon: string }> = {
          recipe: {
            title: "Share a family recipe",
            body: "Your family hasn't added any recipes yet. Preserve those special dishes before they're forgotten.",
            icon: "utensils",
          },
          skill: {
            title: "Teach a family skill",
            body: "Pass down the skills your family is known for — from fixing cars to quilting.",
            icon: "wrench",
          },
          story: {
            title: "Tell a family story",
            body: "Every family has stories worth preserving. Share one that shaped who you are.",
            icon: "book-open",
          },
          lesson: {
            title: "Share a life lesson",
            body: "What wisdom has been passed down in your family? Document it for future generations.",
            icon: "graduation-cap",
          },
        };
        const label = labels[t];
        promptItems.push({
          kind: "prompt",
          id: `prompt-${t}`,
          title: label.title,
          body: label.body,
          action_url: `/entries/new?type=${t}`,
          icon: label.icon,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  // --- Fetch Griot discoveries (recent, up to 5) ---
  // griot_discoveries has no owner column; privacy-filter client-side by
  // related_members overlap with the connection chain. Rows with no related
  // members are family-scope and remain visible. Overfetch (10) to avoid
  // starvation after filtering.
  const discoveryItems: FeedDiscovery[] = [];
  if (!cursor && filterTypes.length === 0 && !searchQuery) {
    try {
      const { data: discoveries } = await sb
        .from("griot_discoveries")
        .select("id, discovery_type, title, body, related_entries, related_members, created_at")
        .in("family_id", familyIds)
        .order("created_at", { ascending: false })
        .limit(10);

      const visibleUserIds = new Set(connectedUserIdsAll);
      const filtered = (discoveries ?? []).filter((d: { related_members: string[] | null }) => {
        const refs = d.related_members ?? [];
        if (refs.length === 0) return true;
        return refs.some((m) => visibleUserIds.has(m));
      }).slice(0, 5);

      for (const d of filtered) {
        discoveryItems.push({
          kind: "discovery",
          id: d.id,
          discovery_type: d.discovery_type,
          title: d.title,
          body: d.body,
          related_entries: d.related_entries ?? [],
          related_members: d.related_members ?? [],
          created_at: d.created_at,
        });
      }
    } catch { /* table may not exist yet */ }
  }

  // --- Fetch active family goals (only on first page) ---
  const goalItems: FeedGoal[] = [];
  if (!cursor && filterTypes.length === 0) {
    try {
      let goalQuery = sb
        .from("family_goals")
        .select("id, title, description, target_count, current_count, status, due_date, created_at")
        .in("family_id", familyIds)
        .eq("status", "active")
        .in("created_by", connectedUserIdsAll)
        .order("created_at", { ascending: false })
        .limit(3);

      if (searchQuery) {
        const q = sanitizeIlike(searchQuery);
        goalQuery = goalQuery.or(
          `title.ilike.%${q}%,description.ilike.%${q}%`
        );
      }

      const { data: goals } = await goalQuery;

      for (const g of goals ?? []) {
        goalItems.push({
          kind: "goal",
          id: g.id,
          title: g.title,
          description: g.description ?? "",
          target_count: g.target_count,
          current_count: g.current_count,
          status: g.status,
          due_date: g.due_date,
          created_at: g.created_at,
        });
      }
    } catch { /* table may not exist yet */ }
  }

  // --- Fetch Griot gap suggestions as insight cards (only on first page) ---
  // Same privacy filter as discoveries above.
  const insightItems: FeedGriotInsight[] = [];
  if (!cursor && filterTypes.length === 0 && !searchQuery) {
    try {
      const { data: gaps } = await sb
        .from("griot_discoveries")
        .select("id, title, body, related_members, created_at")
        .in("family_id", familyIds)
        .eq("discovery_type", "missing_piece")
        .order("created_at", { ascending: false })
        .limit(6);

      const visibleUserIds = new Set(connectedUserIdsAll);
      const filteredGaps = (gaps ?? []).filter((g: { related_members: string[] | null }) => {
        const refs = g.related_members ?? [];
        if (refs.length === 0) return true;
        return refs.some((m) => visibleUserIds.has(m));
      }).slice(0, 2);

      for (const g of filteredGaps) {
        insightItems.push({
          kind: "griot_insight",
          id: `insight-${g.id}`,
          title: g.title,
          body: g.body,
          related_members: g.related_members ?? [],
          created_at: g.created_at,
        });
      }
    } catch { /* table may not exist yet */ }
  }

  // --- Merge & interleave ---
  // Entries are the backbone; discoveries, events, prompts, goals, insights interleaved
  const items: FeedItem[] = [];
  let eventIdx = 0;
  let promptIdx = 0;
  let discoveryIdx = 0;
  let goalIdx = 0;
  let insightIdx = 0;

  for (let i = 0; i < feedEntries.length; i++) {
    items.push(feedEntries[i]);

    // After every 3rd entry, insert a discovery card
    if ((i + 1) % 3 === 0 && discoveryIdx < discoveryItems.length) {
      items.push(discoveryItems[discoveryIdx++]);
    }

    // After every 4th entry, insert a goal card
    if ((i + 1) % 4 === 0 && goalIdx < goalItems.length) {
      items.push(goalItems[goalIdx++]);
    }

    // After every 5th entry, interleave an event or prompt
    if ((i + 1) % 5 === 0) {
      if (eventIdx < eventItems.length) {
        items.push(eventItems[eventIdx++]);
      } else if (promptIdx < promptItems.length) {
        items.push(promptItems[promptIdx++]);
      }
    }

    // After every 7th entry, insert a griot insight
    if ((i + 1) % 7 === 0 && insightIdx < insightItems.length) {
      items.push(insightItems[insightIdx++]);
    }
  }

  // Append remaining items at the end
  while (discoveryIdx < discoveryItems.length) items.push(discoveryItems[discoveryIdx++]);
  while (goalIdx < goalItems.length) items.push(goalItems[goalIdx++]);
  while (eventIdx < eventItems.length) items.push(eventItems[eventIdx++]);
  while (promptIdx < promptItems.length) items.push(promptItems[promptIdx++]);
  while (insightIdx < insightItems.length) items.push(insightItems[insightIdx++]);

  // Next cursor
  const lastEntry = feedEntries[feedEntries.length - 1];
  const nextCursor =
    feedEntries.length >= limit ? lastEntry?.created_at ?? null : null;

  return NextResponse.json({ items, nextCursor });
}
