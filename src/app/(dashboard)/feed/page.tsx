import { getFamilyContext } from "@/lib/get-family-context";
import { FeedList } from "./components/feed-list";
import type { FeedItem, FeedEntry, FeedEvent, FeedPrompt } from "@/app/api/feed/route";

// ---------------------------------------------------------------------------
// Data fetching — loads the initial page server-side
// ---------------------------------------------------------------------------
async function getInitialFeed(): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { items: [], nextCursor: null };
    const { familyId, supabase, connectedUserIds } = ctx;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

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
      const { data: members } = await sb
        .from("family_members")
        .select("user_id, display_name")
        .eq("family_id", familyId)
        .in("user_id", authorIds);
      for (const m of members ?? []) {
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
      })
    );

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
        .eq("type", t);

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

    // Interleave
    const items: FeedItem[] = [];
    let eventIdx = 0;
    let promptIdx = 0;
    for (let i = 0; i < feedEntries.length; i++) {
      items.push(feedEntries[i]);
      if ((i + 1) % 4 === 0) {
        if (eventIdx < eventItems.length) {
          items.push(eventItems[eventIdx++]);
        } else if (promptIdx < promptItems.length) {
          items.push(promptItems[promptIdx++]);
        }
      }
    }
    while (eventIdx < eventItems.length) items.push(eventItems[eventIdx++]);
    while (promptIdx < promptItems.length) items.push(promptItems[promptIdx++]);

    const lastEntry = feedEntries[feedEntries.length - 1];
    const nextCursor =
      feedEntries.length >= 20 ? lastEntry?.created_at ?? null : null;

    return { items, nextCursor };
  } catch (err) {
    console.error("Feed fetch error:", err);
    return { items: [], nextCursor: null };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function FeedPage() {
  const { items, nextCursor } = await getInitialFeed();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Family Feed</h1>
        <p className="text-muted-foreground mt-1">
          See what your family has been sharing and discover new stories.
        </p>
      </div>

      <FeedList initialItems={items} initialCursor={nextCursor} />
    </div>
  );
}
