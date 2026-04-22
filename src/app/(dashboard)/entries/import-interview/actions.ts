"use server";

import { getFamilyContext } from "@/lib/get-family-context";
import { revalidatePath } from "next/cache";
import { enqueueEmbedJob } from "@/lib/jobs/queue";
import type {
  ReviewableEntry,
  ExtractedProfileUpdates,
} from "@/lib/interview/types";
import type { EntryType, EntryStructuredData, LifeStory, StoryData, RecipeData, LessonData, SkillData, ConnectionData } from "@/types/database";
import { normalizeLifeStory } from "@/types/database";

// ---------------------------------------------------------------------------
// Interview subjects — everyone the viewer can document an interview for
// ---------------------------------------------------------------------------

export type InterviewSubjectKind = "account" | "tree";

export interface InterviewSubject {
  id: string;
  display_name: string;
  life_story: LifeStory | null;
  kind: InterviewSubjectKind;
}

/**
 * Returns all people the viewer can record an interview for, aggregated across
 * every hub they belong to:
 *   - `account` subjects are `family_members` rows (someone with a login).
 *     Deduped across hubs by user_id so the same person shows once.
 *   - `tree` subjects are `family_tree_members` without a linked account —
 *     e.g. deceased grandparents you've added to the tree but who don't have
 *     a MAI Legacy login. Deduped by tree-member id (each tree node is a
 *     distinct person; members shared across hubs would have separate rows).
 */
export async function getInterviewSubjects(): Promise<InterviewSubject[]> {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return [];
    const { familyIds, supabase } = ctx;

    const [accountRes, treeRes] = await Promise.all([
      supabase
        .from("family_members")
        .select("id, user_id, display_name, life_story")
        .in("family_id", familyIds)
        .order("display_name"),
      supabase
        .from("family_tree_members")
        .select("id, display_name, linked_member_id")
        .in("family_id", familyIds)
        .is("linked_member_id", null)
        .order("display_name"),
    ]);

    // Dedupe account holders across hubs — prefer the first sighting so the
    // display_name stays stable.
    const seenUserIds = new Set<string>();
    const accountSubjects: InterviewSubject[] = [];
    for (const m of accountRes.data ?? []) {
      if (!m.user_id || seenUserIds.has(m.user_id)) continue;
      seenUserIds.add(m.user_id);
      accountSubjects.push({
        id: m.id,
        display_name: m.display_name,
        life_story: (m.life_story ?? null) as LifeStory | null,
        kind: "account",
      });
    }

    // Tree-only members (no linked account). These don't carry a life_story
    // in the same shape — null keeps the extraction "no prior profile" path.
    const treeSubjects: InterviewSubject[] = (treeRes.data ?? []).map((t) => ({
      id: t.id,
      display_name: t.display_name,
      life_story: null,
      kind: "tree" as const,
    }));

    // Account holders first (they'll usually be the viewer + close family),
    // then tree-only members alphabetically.
    return [...accountSubjects, ...treeSubjects];
  } catch (err) {
    console.error("[interview] Failed to load subjects:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Save transcript record
// ---------------------------------------------------------------------------

export async function saveTranscriptRecord(
  transcript: string,
  subjectMemberId: string
) {
  const ctx = await getFamilyContext();
  if (!ctx) return { error: "You must be signed in." };
  const { userId, familyId, supabase } = ctx;

  const sb = supabase;

  // Save transcript
  const { data: record, error } = await sb
    .from("interview_transcripts")
    .insert({
      family_id: familyId,
      uploaded_by: userId,
      subject_member_id: subjectMemberId,
      raw_transcript: transcript,
      extraction_status: "pending",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: record };
}

// ---------------------------------------------------------------------------
// Save approved entries and profile updates
// ---------------------------------------------------------------------------

function buildStructuredData(
  type: EntryType,
  data: Record<string, unknown>
): EntryStructuredData {
  if (!data || Object.keys(data).length === 0) return null;

  switch (type) {
    case "story":
      return { type: "story", data: data as unknown as StoryData };
    case "recipe":
      return { type: "recipe", data: data as unknown as RecipeData };
    case "lesson":
      return { type: "lesson", data: data as unknown as LessonData };
    case "skill":
      return { type: "skill", data: data as unknown as SkillData };
    case "connection":
      return { type: "connection", data: data as unknown as ConnectionData };
    default:
      return null;
  }
}

export async function saveExtractedEntries(
  entries: ReviewableEntry[],
  profileUpdates: ExtractedProfileUpdates,
  selectedProfileKeys: Record<string, boolean>,
  subjectMemberId: string,
  transcriptId?: string
) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "You must be signed in." };
    const { userId, familyId, supabase } = ctx;

    const sb = supabase;
    const createdEntryIds: string[] = [];

    // 1. Create entries
    for (const entry of entries) {
      const structuredData = buildStructuredData(
        entry.type,
        entry.structured_data
      );

      const { data: created, error: insertError } = await sb
        .from("entries")
        .insert({
          family_id: familyId,
          author_id: userId,
          title: entry.title,
          content: entry.content,
          type: entry.type,
          tags: entry.tags,
          ...(structuredData ? { structured_data: structuredData } : {}),
        })
        .select()
        .single();

      if (insertError) {
        console.error(
          `[interview] Failed to create entry "${entry.title}":`,
          insertError
        );
        continue;
      }

      createdEntryIds.push(created.id);

      // Enqueue background embedding job
      await enqueueEmbedJob(created.id, created.family_id);
    }

    // 2. Update profile (merge new data into existing life_story)
    const hasProfileUpdates = Object.entries(selectedProfileKeys).some(
      ([, selected]) => selected !== false
    );

    if (hasProfileUpdates) {
      // Get current profile
      const { data: member } = await sb
        .from("family_members")
        .select("life_story")
        .eq("id", subjectMemberId)
        .single();

      const currentStory = normalizeLifeStory(member?.life_story);

      // Build updated profile by merging new items
      const updatedStory: LifeStory = { ...currentStory };

      // Career
      const newCareers = (profileUpdates.career || []).filter(
        (_, idx) => selectedProfileKeys[`career.${idx}`] !== false
      );
      if (newCareers.length > 0) {
        updatedStory.career = [
          ...currentStory.career,
          ...newCareers.map((c) => ({
            title: c.job_title,
            company: c.company,
            years: c.years,
          })),
        ];
      }

      // Education
      const newEducation = (profileUpdates.education || []).filter(
        (_, idx) => selectedProfileKeys[`education.${idx}`] !== false
      );
      if (newEducation.length > 0) {
        updatedStory.education = [
          ...currentStory.education,
          ...newEducation.map((e) => ({
            school: e.school,
            degree: e.degree,
            year: e.year,
          })),
        ];
      }

      // Places
      const newPlaces = (profileUpdates.places_lived || []).filter(
        (_, idx) => selectedProfileKeys[`places_lived.${idx}`] !== false
      );
      if (newPlaces.length > 0) {
        updatedStory.places = [
          ...currentStory.places,
          ...newPlaces.map((p) => ({
            city: p.location.split(",")[0]?.trim() || p.location,
            state: p.location.split(",")[1]?.trim() || "",
            years: p.years,
          })),
        ];
      }

      // Skills (deduplicate)
      const newSkills = (profileUpdates.skills || []).filter(
        (_, idx) => selectedProfileKeys[`skills.${idx}`] !== false
      );
      if (newSkills.length > 0) {
        const existingSkills = new Set(
          currentStory.skills.map((s) => s.toLowerCase())
        );
        const unique = newSkills.filter(
          (s) => !existingSkills.has(s.toLowerCase())
        );
        updatedStory.skills = [...currentStory.skills, ...unique];
      }

      // Hobbies (deduplicate)
      const newHobbies = (profileUpdates.hobbies || []).filter(
        (_, idx) => selectedProfileKeys[`hobbies.${idx}`] !== false
      );
      if (newHobbies.length > 0) {
        const existingHobbies = new Set(
          currentStory.hobbies.map((h) => h.toLowerCase())
        );
        const unique = newHobbies.filter(
          (h) => !existingHobbies.has(h.toLowerCase())
        );
        updatedStory.hobbies = [...currentStory.hobbies, ...unique];
      }

      // Milestones
      const newMilestones = (profileUpdates.milestones || []).filter(
        (_, idx) => selectedProfileKeys[`milestones.${idx}`] !== false
      );
      if (newMilestones.length > 0) {
        updatedStory.milestones = [
          ...currentStory.milestones,
          ...newMilestones.map((m) => ({
            event: m.event,
            year: m.year,
          })),
        ];
      }

      // Military
      if (
        profileUpdates.military &&
        selectedProfileKeys["military.0"] !== false
      ) {
        updatedStory.military = {
          branch: profileUpdates.military.branch,
          rank: profileUpdates.military.rank,
          years: profileUpdates.military.years,
        };
      }

      // Save updated profile — sync across all families for this user
      const { data: subjectMember } = await sb
        .from("family_members")
        .select("user_id")
        .eq("id", subjectMemberId)
        .single();

      if (subjectMember?.user_id) {
        // Update ALL family_members rows for this user
        await sb
          .from("family_members")
          .update({ life_story: updatedStory })
          .eq("user_id", subjectMember.user_id);
      } else {
        // Fallback: just update the specific member
        await sb
          .from("family_members")
          .update({ life_story: updatedStory })
          .eq("id", subjectMemberId);
      }
    }

    // 3. Update transcript record status
    if (transcriptId) {
      await sb
        .from("interview_transcripts")
        .update({
          extraction_status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", transcriptId);
    }

    // 4. Revalidate paths
    revalidatePath("/entries");
    revalidatePath("/dashboard");
    revalidatePath("/family");
    revalidatePath("/skills");

    return {
      data: {
        entriesCreated: createdEntryIds.length,
        profileUpdated: hasProfileUpdates,
      },
    };
  } catch (error) {
    console.error("[interview] Save error:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
