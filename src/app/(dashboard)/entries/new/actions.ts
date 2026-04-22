"use server";

import { revalidatePath } from "next/cache";
import { getFamilyContext } from "@/lib/get-family-context";
import { checkTierLimit } from "@/lib/tier-check";
import { enqueueEmbedJob } from "@/lib/jobs/queue";
import type { EntryType, EntryStructuredData, EntryVisibility } from "@/types/database";

interface CreateEntryInput {
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  structured_data?: EntryStructuredData;
  is_mature?: boolean;
  visibility?: EntryVisibility;
  /**
   * When true (default), the entry is visible to its author in every
   * family/circle they belong to. When false, it stays scoped to the
   * hub it was created in.
   */
  share_across_hubs?: boolean;
}

export async function createEntry(input: CreateEntryInput) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "You must be signed in to create an entry." };
    const { userId, familyId, supabase } = ctx;

    // Enforce entry limit based on plan tier
    const tierCheck = await checkTierLimit(familyId, "entries");
    if (!tierCheck.allowed) {
      return {
        error: `You've reached the ${tierCheck.limit} entry limit on your ${tierCheck.currentTier} plan. Upgrade to add more entries.`,
      };
    }

    const { data: entry, error: insertError } = await supabase
      .from("entries")
      .insert({
        family_id: familyId,
        author_id: userId,
        title: input.title,
        content: input.content,
        type: input.type,
        tags: input.tags,
        is_mature: input.is_mature ?? false,
        visibility: input.visibility ?? "family",
        share_across_hubs: input.share_across_hubs ?? true,
        ...(input.structured_data ? { structured_data: input.structured_data } : {}),
      })
      .select()
      .single();

    if (insertError) {
      return { error: insertError.message };
    }

    // Enqueue background embedding job
    if (entry) {
      await enqueueEmbedJob(entry.id, entry.family_id);
    }

    revalidatePath("/entries");
    revalidatePath("/feed");
    revalidatePath("/skills");

    return { data: entry };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
