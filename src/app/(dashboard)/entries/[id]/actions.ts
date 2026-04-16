"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { enqueueEmbedJob } from "@/lib/jobs/queue";
import type { EntryType, EntryVisibility, EntryStructuredData } from "@/types/database";

// ---------------------------------------------------------------------------
// Copy entry to other families
// ---------------------------------------------------------------------------
export async function copyEntryToFamilies(
  entryId: string,
  targetFamilyIds: string[]
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be signed in to copy an entry." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase;

    // Fetch the source entry
    const { data: sourceEntry, error: fetchError } = await sb
      .from("entries")
      .select("title, content, type, tags, structured_data, author_id, family_id")
      .eq("id", entryId)
      .single();

    if (fetchError || !sourceEntry) {
      return { error: "Entry not found." };
    }

    if (sourceEntry.author_id !== user.id) {
      return { error: "You can only copy your own memories." };
    }

    if (targetFamilyIds.length === 0) {
      return { error: "No target families selected." };
    }

    // Filter out the source family to avoid duplicates
    const filteredIds = targetFamilyIds.filter(
      (fid: string) => fid !== sourceEntry.family_id
    );

    if (filteredIds.length === 0) {
      return { error: "Entry already exists in the selected families." };
    }

    // Build insert rows for each target family
    const insertRows = filteredIds.map((familyId: string) => ({
      family_id: familyId,
      author_id: sourceEntry.author_id,
      title: sourceEntry.title,
      content: sourceEntry.content,
      type: sourceEntry.type,
      tags: sourceEntry.tags ?? [],
      ...(sourceEntry.structured_data ? { structured_data: sourceEntry.structured_data } : {}),
    }));

    const { data: newEntries, error: insertError } = await sb
      .from("entries")
      .insert(insertRows)
      .select();

    if (insertError) {
      return { error: (insertError as { message: string }).message };
    }

    // Enqueue background embedding jobs for each new entry
    for (const entry of newEntries ?? []) {
      await enqueueEmbedJob(entry.id, entry.family_id);
    }

    revalidatePath("/entries");
    revalidatePath("/dashboard");
    revalidatePath("/skills");

    return { success: true, copiedCount: newEntries?.length ?? 0 };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

// ---------------------------------------------------------------------------
// Delete entry
// ---------------------------------------------------------------------------
export async function deleteEntry(entryId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be signed in to delete an entry." };
    }

    // Verify ownership before allowing deletion
    const { data: entry } = await supabase
      .from("entries")
      .select("author_id")
      .eq("id", entryId)
      .maybeSingle();

    if (!entry) {
      return { error: "Entry not found." };
    }

    if ((entry as { author_id: string }).author_id !== user.id) {
      return { error: "You can only delete your own memories." };
    }

    // Delete the entry (cascade will handle embeddings via FK)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await supabase
      .from("entries")
      .delete()
      .eq("id", entryId);

    if (deleteError) {
      return { error: (deleteError as { message: string }).message };
    }

    revalidatePath("/entries");
    revalidatePath("/dashboard");
  } catch {
    return { error: "An unexpected error occurred." };
  }

  redirect("/entries");
}

// ---------------------------------------------------------------------------
// Update entry
// ---------------------------------------------------------------------------
interface UpdateEntryInput {
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  structured_data?: EntryStructuredData;
  visibility?: EntryVisibility;
}

export async function updateEntry(entryId: string, input: UpdateEntryInput) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be signed in to update an entry." };
    }

    // Verify ownership before allowing update
    const { data: existing } = await supabase
      .from("entries")
      .select("author_id")
      .eq("id", entryId)
      .maybeSingle();

    if (!existing) {
      return { error: "Entry not found." };
    }

    if ((existing as { author_id: string }).author_id !== user.id) {
      return { error: "You can only update your own memories." };
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      title: input.title,
      content: input.content,
      type: input.type,
      tags: input.tags,
      updated_at: new Date().toISOString(),
    };

    // Include visibility if provided
    if (input.visibility) {
      updatePayload.visibility = input.visibility;
    }

    // Include structured_data if provided
    if (input.structured_data) {
      updatePayload.structured_data = input.structured_data;
    }

    // Update the entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: updateError } = await supabase
      .from("entries")
      .update(updatePayload)
      .eq("id", entryId)
      .select()
      .single();

    if (updateError) {
      return { error: (updateError as { message: string }).message };
    }

    // Enqueue background re-embedding job
    if (entry) {
      await enqueueEmbedJob(entry.id, entry.family_id);
    }

    revalidatePath("/entries");
    revalidatePath(`/entries/${entryId}`);
    revalidatePath("/dashboard");

    return { data: entry };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
