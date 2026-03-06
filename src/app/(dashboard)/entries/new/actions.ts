"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EntryType, EntryStructuredData } from "@/types/database";

interface CreateEntryInput {
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  structured_data?: EntryStructuredData;
}

export async function createEntry(input: CreateEntryInput) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "You must be signed in to create an entry." };
    }

    const sb = supabase as any;
    const { data: membership, error: memberError } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return { error: "You must belong to a family to create an entry." };
    }

    const insertData: Record<string, unknown> = {
      family_id: membership.family_id,
      author_id: user.id,
      title: input.title,
      content: input.content,
      type: input.type,
      tags: input.tags,
    };

    if (input.structured_data) {
      insertData.structured_data = input.structured_data;
    }

    const { data: entry, error: insertError } = await sb
      .from("entries")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return { error: insertError.message };
    }

    // Trigger embedding generation (fire-and-forget)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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

    revalidatePath("/entries");
    revalidatePath("/dashboard");
    revalidatePath("/skills");

    return { data: entry };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
