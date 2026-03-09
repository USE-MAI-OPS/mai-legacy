"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ReviewableEntry,
  ExtractedProfileUpdates,
} from "@/lib/interview/types";
import type { EntryType, EntryStructuredData, LifeStory } from "@/types/database";
import { normalizeLifeStory } from "@/types/database";

// ---------------------------------------------------------------------------
// Save transcript record
// ---------------------------------------------------------------------------

export async function saveTranscriptRecord(
  transcript: string,
  subjectMemberId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in." };
  }

  const sb = supabase as any;

  // Get family
  const { data: membership } = await sb
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { error: "You must belong to a family." };
  }

  // Save transcript
  const { data: record, error } = await sb
    .from("interview_transcripts")
    .insert({
      family_id: membership.family_id,
      uploaded_by: user.id,
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
      return { type: "story", data: data as any };
    case "recipe":
      return { type: "recipe", data: data as any };
    case "lesson":
      return { type: "lesson", data: data as any };
    case "skill":
      return { type: "skill", data: data as any };
    case "connection":
      return { type: "connection", data: data as any };
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be signed in." };
    }

    const sb = supabase as any;

    // Get family membership
    const { data: membership } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { error: "You must belong to a family." };
    }

    const familyId = membership.family_id;
    const createdEntryIds: string[] = [];

    // 1. Create entries
    for (const entry of entries) {
      const structuredData = buildStructuredData(
        entry.type,
        entry.structured_data
      );

      const insertData: Record<string, unknown> = {
        family_id: familyId,
        author_id: user.id,
        title: entry.title,
        content: entry.content,
        type: entry.type,
        tags: entry.tags,
      };

      if (structuredData) {
        insertData.structured_data = structuredData;
      }

      const { data: created, error: insertError } = await sb
        .from("entries")
        .insert(insertData)
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

      // Trigger embedding (fire-and-forget)
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        fetch(`${baseUrl}/api/entries/embed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: created.id }),
        }).catch((err) => {
          console.error("[interview] Embedding trigger failed:", err);
        });
      } catch {
        // non-critical
      }
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

      // Save updated profile
      await sb
        .from("family_members")
        .update({ life_story: updatedStory })
        .eq("id", subjectMemberId);
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
