import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditEntryForm from "@/components/edit-entry-form";
import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Mock data for fallback
// ---------------------------------------------------------------------------
const MOCK_ENTRIES: Record<
  string,
  {
    id: string;
    title: string;
    content: string;
    type: EntryType;
    tags: string[];
  }
> = {
  "1": {
    id: "1",
    title: "Grandma Rosa's Sunday Gravy",
    content: `Every Sunday morning, the house would fill with the aroma of tomatoes simmering on the stove. Grandma Rosa would start her sauce at dawn, layering flavors with garlic, basil, and a secret pinch of cinnamon that made it unlike anything you'd find in a restaurant. She learned it from her mother in Naples, who learned it from hers.

The recipe calls for San Marzano tomatoes, fresh basil, a full head of garlic, extra virgin olive oil, and that pinch of cinnamon. She'd brown Italian sausage and meatballs separately before adding them to the pot, letting everything cook together low and slow for at least four hours.

"You can't rush good sauce," she'd say, stirring with a wooden spoon that was as old as she was. "The longer it cooks, the more love gets in." By the time the family gathered around the table, the sauce had become something transcendent -- rich, complex, and full of memories.

She never wrote the recipe down. It was always "a little of this, a little of that." We've done our best to capture it here so it's never lost again.`,
    type: "recipe",
    tags: ["Italian", "Sunday tradition", "family recipe"],
  },
  "2": {
    id: "2",
    title: "How Dad Fixed Anything with Duct Tape",
    content: `My father had a philosophy: if you can't fix it with duct tape, you're not using enough duct tape. From leaky pipes to broken chair legs, he had a creative solution for everything. He taught us that resourcefulness was more valuable than money, and that there's dignity in making do.`,
    type: "story",
    tags: ["humor", "dad", "resourcefulness"],
  },
  "3": {
    id: "3",
    title: "Building a Raised Garden Bed",
    content: `Step-by-step guide to building the cedar raised beds that Uncle Marcus designed for the family garden. Includes measurements, materials list, and the trick he discovered for keeping squirrels out without using chemicals.`,
    type: "skill",
    tags: ["gardening", "woodworking", "outdoor"],
  },
  "4": {
    id: "4",
    title: "Always Negotiate Your First Offer",
    content: `Grandpa William used to say: the first offer is just the starting point of a conversation. He negotiated everything from car prices to job salaries and passed down his approach to every grandchild.`,
    type: "lesson",
    tags: ["career", "negotiation", "grandpa wisdom"],
  },
  "5": {
    id: "5",
    title: "The Reunion That Changed Everything",
    content: `In 2018, we discovered a branch of the family we never knew existed. A DNA test connected Aunt Sarah to cousins in Georgia, leading to a reunion that brought together 47 family members across three states.`,
    type: "connection",
    tags: ["reunion", "DNA discovery", "extended family"],
  },
  "6": {
    id: "6",
    title: "Family Emergency Contact List",
    content: `Important phone numbers, addresses, and notes for all family members including doctors, schools, insurance information, and emergency contacts. Updated quarterly.`,
    type: "general",
    tags: ["emergency", "contacts", "reference"],
  },
  "7": {
    id: "7",
    title: "Mom's Cornbread Recipe",
    content: `The cornbread recipe that's been at every Thanksgiving table since 1982. Uses buttermilk, stone-ground cornmeal, and a cast-iron skillet heated in the oven.`,
    type: "recipe",
    tags: ["Thanksgiving", "baking", "Southern cooking"],
  },
  "8": {
    id: "8",
    title: "How Great-Grandpa Came to America",
    content: `The story of Emmanuel Powell arriving at Ellis Island in 1923 with nothing but a suitcase and the address of a cousin in Harlem.`,
    type: "story",
    tags: ["immigration", "history", "origin story"],
  },
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getEntryForEdit(id: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return MOCK_ENTRIES[id] ?? null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: entryError } = await (supabase as any)
      .from("entries")
      .select("id, title, content, type, tags, structured_data, family_id")
      .eq("id", id)
      .single();

    if (entryError || !entry) {
      return MOCK_ENTRIES[id] ?? null;
    }

    return {
      id: entry.id as string,
      title: entry.title as string,
      content: entry.content as string,
      type: entry.type as EntryType,
      tags: (entry.tags as string[] | null) ?? [],
      structured_data: (entry.structured_data as { type: string; data: Record<string, unknown> } | null) ?? null,
      familyId: (entry.family_id as string | null) ?? null,
    };
  } catch (err) {
    console.error("Failed to fetch entry for editing:", err);
    return MOCK_ENTRIES[id] ?? null;
  }
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------
export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getEntryForEdit(id);

  if (!entry) {
    notFound();
  }

  return <EditEntryForm entry={entry} />;
}
