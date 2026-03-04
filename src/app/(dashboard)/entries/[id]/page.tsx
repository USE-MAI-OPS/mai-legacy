import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { typeConfig } from "@/components/entry-card";
import { createClient } from "@/lib/supabase/server";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Mock data -- used when Supabase is not configured
// ---------------------------------------------------------------------------
const MOCK_ENTRIES: Record<
  string,
  {
    id: string;
    title: string;
    content: string;
    type: EntryType;
    tags: string[];
    authorName: string;
    date: string;
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
    authorName: "Maria Powell",
    date: "2025-12-15T10:30:00Z",
  },
  "2": {
    id: "2",
    title: "How Dad Fixed Anything with Duct Tape",
    content: `My father had a philosophy: if you can't fix it with duct tape, you're not using enough duct tape. From leaky pipes to broken chair legs, he had a creative solution for everything. He taught us that resourcefulness was more valuable than money, and that there's dignity in making do.

One summer, the screen door fell off its hinges and he fashioned a new set of hinges entirely out of duct tape. That door lasted another three years. When the lawnmower handle cracked, duct tape. When the rain gutter started leaking, duct tape and a prayer.

But it wasn't just about being cheap -- it was about being creative. Dad could look at any broken thing and see possibility where others saw trash. He'd sit on the porch, turn the broken object over in his hands, and you could see the gears turning. "Everything's fixable," he'd say. "You just have to want to fix it."

He passed that mindset down to all of us. To this day, none of his kids throw anything away without first asking: "Can this be fixed?"`,
    type: "story",
    tags: ["humor", "dad", "resourcefulness"],
    authorName: "James Powell",
    date: "2025-11-28T14:00:00Z",
  },
  "3": {
    id: "3",
    title: "Building a Raised Garden Bed",
    content: `Step-by-step guide to building the cedar raised beds that Uncle Marcus designed for the family garden. Includes measurements, materials list, and the trick he discovered for keeping squirrels out without using chemicals.

Materials: 8 cedar boards (2x6x8), 4 corner brackets, 3-inch deck screws, landscape fabric, and hardware cloth for the bottom.

Step 1: Cut the boards to your desired dimensions. Marcus recommends 4x4 feet for easy reach from all sides.
Step 2: Assemble the frame using corner brackets and deck screws. Pre-drill to prevent splitting.
Step 3: Line the bottom with hardware cloth to keep burrowing animals out.
Step 4: Add landscape fabric on the sides to prevent soil from washing through gaps.
Step 5: Fill with a mix of topsoil, compost, and peat moss in a 1:1:1 ratio.

Marcus's squirrel trick: Plant marigolds around the perimeter. Squirrels hate the smell and will leave your vegetables alone.`,
    type: "skill",
    tags: ["gardening", "woodworking", "outdoor"],
    authorName: "Marcus Powell",
    date: "2025-11-20T09:15:00Z",
  },
  "4": {
    id: "4",
    title: "Always Negotiate Your First Offer",
    content: `Grandpa William used to say: the first offer is just the starting point of a conversation. He negotiated everything from car prices to job salaries and passed down his approach to every grandchild. His key rule: know your worth, state it clearly, and be willing to walk away.

He had three principles:

1. Never accept the first number. It's always a starting point, not a final answer.
2. Do your homework. Know what things are worth before you sit down at the table.
3. Be willing to walk away. The person who can walk away has all the power.

He used to practice negotiations with us at the dinner table, turning everyday conversations into lessons about value and persuasion. "If you can convince me to pass the mashed potatoes," he'd joke, "you can convince anyone of anything."`,
    type: "lesson",
    tags: ["career", "negotiation", "grandpa wisdom"],
    authorName: "William Powell Sr.",
    date: "2025-10-05T16:45:00Z",
  },
  "5": {
    id: "5",
    title: "The Reunion That Changed Everything",
    content: `In 2018, we discovered a branch of the family we never knew existed. A DNA test connected Aunt Sarah to cousins in Georgia, leading to a reunion that brought together 47 family members across three states. It reminded us that family is bigger than we think.

Sarah had taken the test on a whim. When the results came back showing close relatives she'd never heard of, she was skeptical at first. But after exchanging messages with a woman named Denise in Savannah, the pieces started to fit together. They shared the same great-grandparents -- a connection lost when one branch of the family moved north during the Great Migration.

The reunion was held in Atlanta, neutral ground for everyone. People drove from Georgia, Alabama, and Virginia. There were tears, laughter, and the surreal experience of meeting people who looked just like you but whose names you'd never heard.

We've held the reunion every year since. What started as a DNA curiosity became one of the most meaningful traditions our family has.`,
    type: "connection",
    tags: ["reunion", "DNA discovery", "extended family"],
    authorName: "Sarah Mitchell",
    date: "2025-09-12T11:00:00Z",
  },
  "6": {
    id: "6",
    title: "Family Emergency Contact List",
    content: `Important phone numbers, addresses, and notes for all family members including doctors, schools, insurance information, and emergency contacts. Updated quarterly.

This document serves as the central reference point for the family. Keep it updated and make sure all adults in the household know where to find it.`,
    type: "general",
    tags: ["emergency", "contacts", "reference"],
    authorName: "Maria Powell",
    date: "2025-08-30T08:00:00Z",
  },
  "7": {
    id: "7",
    title: "Mom's Cornbread Recipe",
    content: `The cornbread recipe that's been at every Thanksgiving table since 1982. Uses buttermilk, stone-ground cornmeal, and a cast-iron skillet heated in the oven. The key is preheating the skillet with butter until it sizzles when the batter hits it.

Ingredients: 2 cups stone-ground cornmeal, 1 cup all-purpose flour, 1 tablespoon baking powder, 1 teaspoon salt, 1/3 cup sugar, 2 eggs, 1.5 cups buttermilk, 1/3 cup melted butter, plus 2 tablespoons butter for the skillet.

Instructions: Preheat oven to 425F with the cast-iron skillet inside. Mix dry ingredients. Whisk wet ingredients separately. Combine just until mixed -- don't overstir. Drop 2 tablespoons of butter in the hot skillet, swirl to coat, then pour in the batter. Bake 20-25 minutes until golden on top and a toothpick comes out clean.`,
    type: "recipe",
    tags: ["Thanksgiving", "baking", "Southern cooking"],
    authorName: "Dorothy Powell",
    date: "2025-08-15T13:20:00Z",
  },
  "8": {
    id: "8",
    title: "How Great-Grandpa Came to America",
    content: `The story of Emmanuel Powell arriving at Ellis Island in 1923 with nothing but a suitcase and the address of a cousin in Harlem. He worked three jobs to save enough to bring his wife and children over two years later. This is the foundation story of our family in America.

Emmanuel left Kingston, Jamaica in the summer of 1923. He was 24 years old. The passage took ten days, and he spent most of it seasick below deck. When he finally saw the Statue of Liberty, he said he cried -- not from joy, but from relief that the journey was over.

His cousin Edwin met him at the docks and took him to a boarding house on 125th Street. Within a week, he had a job at a garment factory. Within a month, he'd added a second job at a restaurant. On weekends, he worked as a porter.

Every penny he didn't need for rent and food went into a tin box under his bed. Two years and three months later, he had enough to send for his wife, Mildred, and their two children. They arrived in December 1925, just before Christmas.

The family has been in New York ever since.`,
    type: "story",
    tags: ["immigration", "history", "origin story"],
    authorName: "James Powell",
    date: "2025-07-04T10:00:00Z",
  },
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getEntry(id: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return MOCK_ENTRIES[id] ?? null;
    }

    // Fetch the entry with author join
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: entryError } = await (supabase as any)
      .from("entries")
      .select(
        "id, title, content, type, tags, created_at, updated_at, family_members!entries_author_id_fkey(display_name)"
      )
      .eq("id", id)
      .single();

    if (entryError || !entry) {
      return MOCK_ENTRIES[id] ?? null;
    }

    const authorJoin = entry.family_members;
    const authorName = Array.isArray(authorJoin)
      ? authorJoin[0]?.display_name ?? "Unknown"
      : (authorJoin as { display_name: string } | null)?.display_name ??
        "Unknown";

    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      type: entry.type as EntryType,
      tags: entry.tags ?? [],
      authorName,
      date: entry.created_at,
    };
  } catch (err) {
    console.error("Failed to fetch entry:", err);
    return MOCK_ENTRIES[id] ?? null;
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getEntry(id);

  if (!entry) {
    notFound();
  }

  const config = typeConfig[entry.type];

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link href="/entries">
          <ArrowLeft className="size-4 mr-2" />
          Back to entries
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3">
              <Badge
                variant="secondary"
                className={`text-xs ${config.color}`}
              >
                {config.emoji} {config.label}
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl leading-tight">
                {entry.title}
              </CardTitle>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/entries/${entry.id}/edit`}>
                  <Pencil className="size-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <DeleteEntryButton entryId={entry.id} />
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" />
              {entry.authorName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {formatDate(entry.date)}
            </span>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {/* Content body -- preserve whitespace/newlines */}
          <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
            {entry.content.split("\n\n").map((paragraph: string, index: number) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <>
            <Separator />
            <CardContent className="pt-4 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Tags:
                </span>
                {entry.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
