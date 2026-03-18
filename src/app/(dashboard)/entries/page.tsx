import { Suspense } from "react";
import { getFamilyContext } from "@/lib/get-family-context";
import EntriesList, { EntriesPageSkeleton } from "@/components/entries-list";
import type { EntryListItem } from "@/components/entries-list";
import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Mock data -- used when Supabase is not configured or queries fail
// ---------------------------------------------------------------------------
const MOCK_ENTRIES: EntryListItem[] = [
  {
    id: "1",
    title: "Grandma Rosa's Sunday Gravy",
    content:
      "Every Sunday morning, the house would fill with the aroma of tomatoes simmering on the stove. Grandma Rosa would start her sauce at dawn, layering flavors with garlic, basil, and a secret pinch of cinnamon that made it unlike anything you'd find in a restaurant. She learned it from her mother in Naples, who learned it from hers.",
    type: "recipe",
    tags: ["Italian", "Sunday tradition", "family recipe"],
    authorName: "Maria Powell",
    date: "2025-12-15T10:30:00Z",
  },
  {
    id: "2",
    title: "How Dad Fixed Anything with Duct Tape",
    content:
      "My father had a philosophy: if you can't fix it with duct tape, you're not using enough duct tape. From leaky pipes to broken chair legs, he had a creative solution for everything. He taught us that resourcefulness was more valuable than money, and that there's dignity in making do.",
    type: "story",
    tags: ["humor", "dad", "resourcefulness"],
    authorName: "James Powell",
    date: "2025-11-28T14:00:00Z",
  },
  {
    id: "3",
    title: "Building a Raised Garden Bed",
    content:
      "Step-by-step guide to building the cedar raised beds that Uncle Marcus designed for the family garden. Includes measurements, materials list, and the trick he discovered for keeping squirrels out without using chemicals.",
    type: "skill",
    tags: ["gardening", "woodworking", "outdoor"],
    authorName: "Marcus Powell",
    date: "2025-11-20T09:15:00Z",
  },
  {
    id: "4",
    title: "Always Negotiate Your First Offer",
    content:
      "Grandpa William used to say: the first offer is just the starting point of a conversation. He negotiated everything from car prices to job salaries and passed down his approach to every grandchild. His key rule: know your worth, state it clearly, and be willing to walk away.",
    type: "lesson",
    tags: ["career", "negotiation", "grandpa wisdom"],
    authorName: "William Powell Sr.",
    date: "2025-10-05T16:45:00Z",
  },
  {
    id: "5",
    title: "The Reunion That Changed Everything",
    content:
      "In 2018, we discovered a branch of the family we never knew existed. A DNA test connected Aunt Sarah to cousins in Georgia, leading to a reunion that brought together 47 family members across three states. It reminded us that family is bigger than we think.",
    type: "connection",
    tags: ["reunion", "DNA discovery", "extended family"],
    authorName: "Sarah Mitchell",
    date: "2025-09-12T11:00:00Z",
  },
  {
    id: "6",
    title: "Family Emergency Contact List",
    content:
      "Important phone numbers, addresses, and notes for all family members including doctors, schools, insurance information, and emergency contacts. Updated quarterly.",
    type: "general",
    tags: ["emergency", "contacts", "reference"],
    authorName: "Maria Powell",
    date: "2025-08-30T08:00:00Z",
  },
  {
    id: "7",
    title: "Mom's Cornbread Recipe",
    content:
      "The cornbread recipe that's been at every Thanksgiving table since 1982. Uses buttermilk, stone-ground cornmeal, and a cast-iron skillet heated in the oven. The key is preheating the skillet with butter until it sizzles when the batter hits it.",
    type: "recipe",
    tags: ["Thanksgiving", "baking", "Southern cooking"],
    authorName: "Dorothy Powell",
    date: "2025-08-15T13:20:00Z",
  },
  {
    id: "8",
    title: "How Great-Grandpa Came to America",
    content:
      "The story of Emmanuel Powell arriving at Ellis Island in 1923 with nothing but a suitcase and the address of a cousin in Harlem. He worked three jobs to save enough to bring his wife and children over two years later. This is the foundation story of our family in America.",
    type: "story",
    tags: ["immigration", "history", "origin story"],
    authorName: "James Powell",
    date: "2025-07-04T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getEntries(): Promise<EntryListItem[]> {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return MOCK_ENTRIES;
    const { familyId, supabase, connectedUserIds } = ctx;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Fetch entries from connected family members only
    const { data: entries, error: entriesError } = await sb
      .from("entries")
      .select("id, title, content, type, tags, structured_data, is_mature, created_at, author_id")
      .eq("family_id", familyId)
      .in("author_id", connectedUserIds)
      .order("created_at", { ascending: false });

    if (entriesError || !entries) {
      return MOCK_ENTRIES;
    }

    // Batch-resolve author display names from family_members
    const authorIds = [...new Set(entries.map((e: any) => e.author_id).filter(Boolean))];
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

    return entries.map((entry: any) => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      type: entry.type,
      tags: entry.tags ?? [],
      authorName: authorMap[entry.author_id] ?? "Unknown",
      date: entry.created_at,
      structured_data: entry.structured_data ?? undefined,
      is_mature: entry.is_mature ?? false,
    }));
  } catch (err) {
    console.error("Failed to fetch entries:", err);
    return MOCK_ENTRIES;
  }
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------
export default async function EntriesPage() {
  const entries = await getEntries();

  return (
    <Suspense fallback={<EntriesPageSkeleton />}>
      <EntriesList entries={entries} />
    </Suspense>
  );
}
