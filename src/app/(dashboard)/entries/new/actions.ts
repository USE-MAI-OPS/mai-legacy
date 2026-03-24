"use server";

import { revalidatePath } from "next/cache";
import { getFamilyContext } from "@/lib/get-family-context";
import type { EntryType, EntryStructuredData, EntryVisibility } from "@/types/database";

interface CreateEntryInput {
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  structured_data?: EntryStructuredData;
  is_mature?: boolean;
  visibility?: EntryVisibility;
}

export async function createEntry(input: CreateEntryInput) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "You must be signed in to create an entry." };
    const { userId, familyId, supabase } = ctx;

    const sb = supabase as any;

    const row: Record<string, unknown> = {
      family_id: familyId,
      author_id: userId,
      title: input.title,
      content: input.content,
      type: input.type,
      tags: input.tags,
      is_mature: input.is_mature ?? false,
      visibility: input.visibility ?? "family",
    };
    if (input.structured_data) {
      row.structured_data = input.structured_data;
    }

    const { data: entry, error: insertError } = await sb
      .from("entries")
      .insert(row)
      .select()
      .single();

    if (insertError) {
      return { error: insertError.message };
    }

    // Trigger embedding generation (fire-and-forget)
    if (entry) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${baseUrl}/api/entries/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: entry.id }),
      }).catch((err) => {
        console.error("Failed to trigger embedding:", err);
      });
    }

    revalidatePath("/entries");
    revalidatePath("/dashboard");
    revalidatePath("/skills");

    return { data: entry };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
