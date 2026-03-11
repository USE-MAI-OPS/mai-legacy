import { getFamilyContext } from "@/lib/get-family-context";
import SkillsClient from "./skills-client";

async function getSkillEntries() {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return [];
    const { familyId, supabase } = ctx;

    const sb = supabase as any;

    // Fetch all skill-type entries with author info
    const { data, error } = await sb
      .from("entries")
      .select(
        "id, title, content, type, tags, structured_data, created_at, family_members!entries_author_id_fkey(display_name)"
      )
      .eq("family_id", familyId)
      .eq("type", "skill")
      .order("created_at", { ascending: false });

    if (error) return [];

    // Also check for tutorials associated with these entries
    const entryIds = (data ?? []).map((e: any) => e.id);
    const { data: tutorials } =
      entryIds.length > 0
        ? await sb
            .from("skill_tutorials")
            .select("entry_id")
            .in("entry_id", entryIds)
        : { data: [] };

    const tutorialEntryIds = new Set(
      (tutorials ?? []).map((t: any) => t.entry_id)
    );

    return (data ?? []).map((entry: any) => {
      const authorJoin = entry.family_members;
      const authorName = Array.isArray(authorJoin)
        ? authorJoin[0]?.display_name ?? "Unknown"
        : authorJoin?.display_name ?? "Unknown";

      // Extract difficulty from structured_data if available
      const sd = entry.structured_data;
      const difficulty = sd?.type === "skill" ? sd.data?.difficulty : null;

      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        tags: entry.tags ?? [],
        authorName,
        date: entry.created_at,
        difficulty,
        hasTutorial: tutorialEntryIds.has(entry.id),
      };
    });
  } catch {
    return [];
  }
}

export default async function SkillsPage() {
  const skills = await getSkillEntries();
  return <SkillsClient initialSkills={skills} />;
}
