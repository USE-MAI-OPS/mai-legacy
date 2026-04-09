import { redirect } from "next/navigation";
import { getFamilyContext } from "@/lib/get-family-context";
import { requireTier } from "@/lib/tier-check";
import { LegacyBookClient } from "./legacy-book-client";
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
// Server component — fetches data and passes to client
// ---------------------------------------------------------------------------
export default async function LegacyBookPage() {
  try {
    const ctx = await getFamilyContext();

    if (!ctx) {
      redirect("/onboarding");
    }

    const { familyId, supabase } = ctx;

    // Tier check
    const { allowed, currentTier } = await requireTier(familyId, "roots");

    if (!allowed) {
      return (
        <LegacyBookClient
          familyId={familyId}
          familyName="Your Family"
          entries={[]}
          isLocked
          currentTier={currentTier}
        />
      );
    }

    // Fetch family name
    const { data: family } = await supabase
      .from("families")
      .select("name")
      .eq("id", familyId)
      .single();

    const familyName = family?.name ?? "Our Family";

    // Fetch entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawEntries } = await (supabase as any)
      .from("entries")
      .select("id, title, content, type, tags, created_at, author_id")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });

    const entries: LegacyBookEntryItem[] = (rawEntries ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => ({
        id: e.id,
        title: e.title ?? "Untitled",
        content: e.content ?? "",
        type: e.type ?? "general",
        tags: e.tags ?? [],
        authorName: "Family Member",
        date: e.created_at,
      })
    );

    return (
      <LegacyBookClient
        familyId={familyId}
        familyName={familyName}
        entries={entries}
        isLocked={false}
        currentTier={currentTier}
      />
    );
  } catch (err) {
    console.error("[LegacyBookPage]", err);
    return (
      <LegacyBookClient
        familyId=""
        familyName="Your Family"
        entries={[]}
        isLocked
        currentTier="seedling"
      />
    );
  }
}
