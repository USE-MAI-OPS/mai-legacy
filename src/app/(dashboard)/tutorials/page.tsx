import { getFamilyContext } from "@/lib/get-family-context";
import { TutorialsListClient, type Tutorial } from "./tutorials-list-client";

const MOCK_TUTORIALS: Tutorial[] = [
  {
    id: "tutorial-1",
    title: "Grandma's Cornbread Recipe",
    description:
      "Learn to make Grandma Mae's famous cast-iron cornbread, passed down through three generations.",
    difficulty: "beginner",
    estimated_time: "45 min",
    step_count: 6,
    entry_title: "Grandma Mae's Cornbread",
  },
  {
    id: "tutorial-2",
    title: "How to Fix a Leaky Faucet",
    description:
      "Uncle Robert's step-by-step guide to diagnosing and fixing common faucet leaks, no plumber needed.",
    difficulty: "intermediate",
    estimated_time: "1 hr",
    step_count: 8,
    entry_title: "Home Repair Skills",
  },
  {
    id: "tutorial-3",
    title: "Family Quilt Pattern",
    description:
      "The traditional quilt pattern Aunt Diane has been teaching at every reunion since 1990.",
    difficulty: "advanced",
    estimated_time: "3 hrs",
    step_count: 12,
    entry_title: "Aunt Diane's Quilting",
  },
  {
    id: "tutorial-4",
    title: "Grandpa's Garden Layout",
    description:
      "How Grandpa James planned his vegetable garden for maximum yield in a small backyard space.",
    difficulty: "beginner",
    estimated_time: "30 min",
    step_count: 5,
    entry_title: "Grandpa's Garden Notes",
  },
];

export default async function TutorialsPage() {
  let tutorials: Tutorial[] = MOCK_TUTORIALS;

  try {
    const ctx = await getFamilyContext();

    if (ctx) {
      const { familyId, supabase } = ctx;
      {
        // Fetch tutorials joined with entries for title
        const { data: tutorialsData } = await supabase
          .from("skill_tutorials")
          .select("id, entry_id, steps, difficulty_level, estimated_time, created_at, entries(title)")
          .eq("family_id", familyId)
          .order("created_at", { ascending: false });

        if (tutorialsData && tutorialsData.length > 0) {
          tutorials = tutorialsData.map((t) => {
            const steps = t.steps as { title?: string; description?: string }[];
            // Generate a description from the first step if available
            const firstStepDesc = steps?.[0]?.description || "";
            const description =
              firstStepDesc.length > 120
                ? firstStepDesc.slice(0, 120) + "..."
                : firstStepDesc;

            // The entry title from the join — entries is an object (single row via entry_id FK)
            const entryRecord = t.entries as unknown as { title: string } | null;
            const entryTitle = entryRecord?.title || "Unknown Entry";

            // Use first step title as tutorial title if the tutorial has steps
            const title = steps?.[0]?.title
              ? `${entryTitle} Tutorial`
              : entryTitle;

            return {
              id: t.id,
              title,
              description,
              difficulty: (t.difficulty_level || "beginner") as Tutorial["difficulty"],
              estimated_time: t.estimated_time || "N/A",
              step_count: steps?.length || 0,
              entry_title: entryTitle,
            };
          });
        } else if (tutorialsData && tutorialsData.length === 0) {
          // Real data returned empty — show empty state
          tutorials = [];
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch tutorials, using mock data:", e);
  }

  return <TutorialsListClient tutorials={tutorials} />;
}
