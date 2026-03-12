"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EntryType } from "@/types/database";

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
