"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EntryType } from "@/types/database";

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
    const sb = supabase as any;

    // Fetch the source entry
    const { data: sourceEntry, error: fetchError } = await sb
      .from("entries")
      .select("title, content, type, tags, structured_data, author_id, family_id")
      .eq("id", entryId)
      .single();

    if (fetchError || !sourceEntry) {
      return { error: "Entry not found." };
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
    const insertRows = filteredIds.map((familyId: string) => {
      const row: Record<string, unknown> = {
        family_id: familyId,
        author_id: sourceEntry.author_id,
        title: sourceEntry.title,
        content: sourceEntry.content,
        type: sourceEntry.type,
        tags: sourceEntry.tags ?? [],
      };
      if (sourceEntry.structured_data) {
        row.structured_data = sourceEntry.structured_data;
      }
      return row;
    });

    const { data: newEntries, error: insertError } = await sb
      .from("entries")
      .insert(insertRows)
      .select();

    if (insertError) {
      return { error: (insertError as { message: string }).message };
    }

    // Trigger embedding generation for each new entry (fire-and-forget)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    for (const entry of newEntries ?? []) {
      try {
        fetch(`${baseUrl}/api/entries/embed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: entry.id }),
        }).catch((err) => {
          console.error("Failed to trigger embedding:", err);
        });
      } catch {
        console.error("Failed to trigger embedding for entry:", entry.id);
      }
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

    // Delete the entry (cascade will handle embeddings via FK)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
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
  structured_data?: { type: string; data: Record<string, unknown> };
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

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      title: input.title,
      content: input.content,
      type: input.type,
      tags: input.tags,
      updated_at: new Date().toISOString(),
    };

    // Include structured_data if provided
    if (input.structured_data) {
      updatePayload.structured_data = input.structured_data;
    }

    // Update the entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: updateError } = await (supabase as any)
      .from("entries")
      .update(updatePayload)
      .eq("id", entryId)
      .select()
      .single();

    if (updateError) {
      return { error: (updateError as { message: string }).message };
    }

    // Re-trigger embedding generation (fire-and-forget)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${baseUrl}/api/entries/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      }).catch((err) => {
        console.error("Failed to trigger re-embedding:", err);
      });
    } catch {
      // Non-critical: embedding will happen eventually or can be re-triggered
      console.error("Failed to trigger re-embedding for entry:", entryId);
    }

    revalidatePath("/entries");
    revalidatePath(`/entries/${entryId}`);
    revalidatePath("/dashboard");

    return { data: entry };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
