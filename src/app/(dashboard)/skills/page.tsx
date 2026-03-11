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
        "id, title, content, type, tags, structured_data, created_at, author_id"
      )
      .eq("family_id", familyId)
      .eq("type", "skill")
      .order("created_at", { ascending: false });

    if (error) return [];

    // Batch-resolve author display names
    const authorIds = [...new Set((data ?? []).map((e: any) => e.author_id).filter(Boolean))];
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
      const authorName = authorMap[entry.author_id] ?? "Unknown";

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
