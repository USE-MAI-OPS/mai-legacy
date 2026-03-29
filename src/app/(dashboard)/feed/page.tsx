import { getFamilyContext } from "@/lib/get-family-context";
import { FeedList } from "./components/feed-list";
import { OnThisDayCard } from "@/components/on-this-day-card";
import { FeedPageClient } from "./components/feed-page-client";
import type { FeedItem, FeedEntry, FeedEvent, FeedPrompt, FeedDiscovery, FeedGoal, FeedGriotInsight } from "@/app/api/feed/route";
import type { EntryType } from "@/types/database";
import type { FamilyMember } from "./components/family-strip";
import type { FeedStats } from "./components/stats-strip";

// ---------------------------------------------------------------------------
// Data fetching — loads the initial page server-side
// ---------------------------------------------------------------------------
async function getInitialFeed(): Promise<{
  items: FeedItem[];
  nextCursor: string | null;
  members: FamilyMember[];
  stats: FeedStats;
  familyName: string;
}> {
  try {
    const ctx = await getFamilyContext();
    if (!ctx)
      return {
        items: [],
        nextCursor: null,
        members: [],
        stats: { entries: 0, members: 0, traditions: 0, goals: 0, events: 0 },
        familyName: "",
      };
    const { familyId, supabase, connectedUserIds } = ctx;

    const sb = supabase;

    // Fetch family name
    let familyName = "";
    try {
      const { data: family } = await sb
        .from("families")
        .select("name")
        .eq("id", familyId)
        .maybeSingle();
      familyName = family?.name ?? "";
    } catch { /* ignore */ }

    // Fetch family members for the strip
    const { data: memberData } = await sb
      .from("family_members")
      .select("id, user_id, display_name, avatar_url")
      .eq("family_id", familyId)
      .order("joined_at", { ascending: true });

    const members: FamilyMember[] = (memberData ?? []).map(
      (m: { id: string; user_id: string; display_name: string; avatar_url: string | null }) => ({
        id: m.id,
        user_id: m.user_id,
        display_name: m.display_name,
        avatar_url: m.avatar_url,
      })
    );

    // Fetch stats in parallel
    const safeCount = async (query: PromiseLike<{ count: number | null }>): Promise<number> => {
      try {
        const r = await query;
        return r.count ?? 0;
      } catch {
        return 0;
      }
    };

    const [entriesCount, traditionsCount, goalsCount, eventsCount] = await Promise.all([
      safeCount(
        sb.from("entries").select("id", { count: "exact", head: true }).eq("family_id", familyId)
      ),
      safeCount(
        sb.from("traditions").select("id", { count: "exact", head: true }).eq("family_id", familyId)
      ),
      safeCount(
        sb.from("family_goals").select("id", { count: "exact", head: true }).eq("family_id", familyId).eq("status", "active")
      ),
      safeCount(
        sb.from("family_events").select("id", { count: "exact", head: true }).eq("family_id", familyId)
      ),
    ]);

    const stats: FeedStats = {
      entries: entriesCount,
      members: members.length,
      traditions: traditionsCount,
      goals: goalsCount,
      events: eventsCount,
    };

    // Fetch recent entries
    const { data: entries } = await sb
      .from("entries")
      .select(
        "id, title, content, type, tags, structured_data, is_mature, created_at, author_id"
      )
      .eq("family_id", familyId)
      .in("author_id", connectedUserIds)
      .order("created_at", { ascending: false })
      .limit(20);

    // Resolve author names
    const authorIds = [
      ...new Set(
        (entries ?? []).map((e: { author_id: string }) => e.author_id).filter(Boolean)
      ),
    ];
    const authorMap: Record<string, string> = {};
    if (authorIds.length > 0) {
      const { data: authorMembers } = await sb
        .from("family_members")
        .select("user_id, display_name")
        .eq("family_id", familyId)
        .in("user_id", authorIds);
      for (const m of authorMembers ?? []) {
        if (m.user_id && m.display_name) authorMap[m.user_id] = m.display_name;
      }
    }

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
        reaction_count: 0,
        comment_count: 0,
      })
    );

    // Fetch reaction/comment counts
    const entryIds = feedEntries.map((e) => e.id);
    if (entryIds.length > 0) {
      try {
        const { data: reactionData } = await sb
          .from("entry_reactions")
          .select("entry_id")
          .in("entry_id", entryIds);
        for (const r of reactionData ?? []) {
          const fe = feedEntries.find((e) => e.id === r.entry_id);
          if (fe) fe.reaction_count++;
        }
      } catch { /* table may not exist yet */ }

      try {
        const { data: commentData } = await sb
          .from("entry_comments")
          .select("entry_id")
          .in("entry_id", entryIds);
        for (const c of commentData ?? []) {
          const fe = feedEntries.find((e) => e.id === c.entry_id);
          if (fe) fe.comment_count++;
        }
      } catch { /* table may not exist yet */ }
    }

    // Upcoming events
    const eventItems: FeedEvent[] = [];
    const { data: events } = await sb
      .from("family_events")
      .select("id, title, description, event_date, location, created_at")
      .eq("family_id", familyId)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(3);

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

    // Content prompts
    const promptItems: FeedPrompt[] = [];
    const types = ["recipe", "skill", "story", "lesson"];
    for (const t of types) {
      const { count } = await sb
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("family_id", familyId)
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

    // Fetch Griot discoveries
    const discoveryItems: FeedDiscovery[] = [];
    try {
      const { data: discoveries } = await sb
        .from("griot_discoveries")
        .select("id, discovery_type, title, body, related_entries, related_members, created_at")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(5);

      for (const d of discoveries ?? []) {
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

    // Fetch active goals
    const goalItems: FeedGoal[] = [];
    try {
      const { data: goals } = await sb
        .from("family_goals")
        .select("id, title, description, target_count, current_count, status, due_date, created_at")
        .eq("family_id", familyId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);

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

    // Fetch griot insight cards (missing_piece type)
    const insightItems: FeedGriotInsight[] = [];
    try {
      const { data: gaps } = await sb
        .from("griot_discoveries")
        .select("id, title, body, related_members, created_at")
        .eq("family_id", familyId)
        .eq("discovery_type", "missing_piece")
        .order("created_at", { ascending: false })
        .limit(2);

      for (const g of gaps ?? []) {
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

    // Interleave: entries + discoveries every 3rd + goals every 4th + events/prompts every 5th + insights every 7th
    const items: FeedItem[] = [];
    let eventIdx = 0;
    let promptIdx = 0;
    let discoveryIdx = 0;
    let goalIdx = 0;
    let insightIdx = 0;

    for (let i = 0; i < feedEntries.length; i++) {
      items.push(feedEntries[i]);
      if ((i + 1) % 3 === 0 && discoveryIdx < discoveryItems.length) {
        items.push(discoveryItems[discoveryIdx++]);
      }
      if ((i + 1) % 4 === 0 && goalIdx < goalItems.length) {
        items.push(goalItems[goalIdx++]);
      }
      if ((i + 1) % 5 === 0) {
        if (eventIdx < eventItems.length) {
          items.push(eventItems[eventIdx++]);
        } else if (promptIdx < promptItems.length) {
          items.push(promptItems[promptIdx++]);
        }
      }
      if ((i + 1) % 7 === 0 && insightIdx < insightItems.length) {
        items.push(insightItems[insightIdx++]);
      }
    }
    while (discoveryIdx < discoveryItems.length) items.push(discoveryItems[discoveryIdx++]);
    while (goalIdx < goalItems.length) items.push(goalItems[goalIdx++]);
    while (eventIdx < eventItems.length) items.push(eventItems[eventIdx++]);
    while (promptIdx < promptItems.length) items.push(promptItems[promptIdx++]);
    while (insightIdx < insightItems.length) items.push(insightItems[insightIdx++]);

    const lastEntry = feedEntries[feedEntries.length - 1];
    const nextCursor =
      feedEntries.length >= 20 ? lastEntry?.created_at ?? null : null;

    return { items, nextCursor, members, stats, familyName };
  } catch (err) {
    console.error("Feed fetch error:", err);
    return {
      items: [],
      nextCursor: null,
      members: [],
      stats: { entries: 0, members: 0, traditions: 0, goals: 0, events: 0 },
      familyName: "",
    };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function FeedPage() {
  const { items, nextCursor, members, stats, familyName } = await getInitialFeed();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <FeedPageClient
        initialItems={items}
        initialCursor={nextCursor}
        members={members}
        stats={stats}
        familyName={familyName}
      />
    </div>
  );
}
