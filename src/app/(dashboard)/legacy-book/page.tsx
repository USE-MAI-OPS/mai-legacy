import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getFamilyContext } from "@/lib/get-family-context";
import { LegacyBookClient, LegacyBookSkeleton } from "./legacy-book-client";
import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Types shared with client
// ---------------------------------------------------------------------------
export interface LegacyBookEntryItem {
  id: string;
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  authorName: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Entry fetcher — wrapped in its own component so Suspense can isolate the
// slow part. Switching hubs triggers router.refresh() on every page; keeping
// the fetch behind Suspense means the UI stays interactive instead of
// freezing while the refresh re-runs this query.
// ---------------------------------------------------------------------------
async function LegacyBookData() {
  const ctx = await getFamilyContext();
  if (!ctx) {
    redirect("/onboarding");
  }

  const { familyIds, supabase, connectedUserIdsAll } = ctx;

  // Entries aggregated across every hub the viewer belongs to, from any
  // author in their combined connection chain. Author names come from the
  // union of family_members rows so cross-hub authors resolve correctly.
  const [entriesResult, membersResult] = await Promise.all([
    supabase
      .from("entries")
      .select("id, title, content, type, tags, created_at, author_id, family_id")
      .in("family_id", familyIds)
      .in("author_id", connectedUserIdsAll)
      .order("created_at", { ascending: false }),
    supabase
      .from("family_members")
      .select("user_id, display_name")
      .in("family_id", familyIds)
      .in("user_id", connectedUserIdsAll),
  ]);

  const authorMap: Record<string, string> = {};
  for (const m of membersResult.data ?? []) {
    if (m.user_id && m.display_name && !authorMap[m.user_id]) {
      authorMap[m.user_id] = m.display_name;
    }
  }

  const entries: LegacyBookEntryItem[] = (entriesResult.data ?? []).map((e) => ({
    id: e.id,
    title: e.title ?? "Untitled",
    content: e.content ?? "",
    type: e.type ?? "general",
    tags: e.tags ?? [],
    authorName: authorMap[e.author_id] ?? "Family Member",
    date: e.created_at,
  }));

  return <LegacyBookClient entries={entries} />;
}

// ---------------------------------------------------------------------------
// Server component — Legacy Book is ungated; anyone with a hub can generate.
// ---------------------------------------------------------------------------
export default function LegacyBookPage() {
  return (
    <Suspense fallback={<LegacyBookSkeleton />}>
      <LegacyBookData />
    </Suspense>
  );
}
