"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EntryType } from "@/types/database";

interface CreateEntryInput {
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
}

/**
 * Server action to create a new entry.
 *
 * NOTE: The explicit `as any` casts below are intentional. The hand-written
 * Database type definition in `@/types/database` does not yet include the
 * `PostgrestVersion` field expected by `@supabase/supabase-js` v2.98+, which
 * causes all table Row / Insert generics to collapse to `never`. Once the
 * database types are regenerated from `supabase gen types typescript`, these
 * casts can be removed.
 */
export async function createEntry(input: CreateEntryInput) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be signed in to create an entry." };
    }

    // Get the user's family membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership, error: memberError } = await (supabase as any)
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return { error: "You must belong to a family to create an entry." };
    }

    // Insert the entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: insertError } = await (supabase as any)
      .from("entries")
      .insert({
        family_id: membership.family_id,
        author_id: user.id,
        title: input.title,
        content: input.content,
        type: input.type,
        tags: input.tags,
      })
      .select()
      .single();

    if (insertError) {
      return { error: (insertError as { message: string }).message };
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
      // Non-critical: embedding can be re-triggered later
      console.error("Failed to trigger embedding for entry:", entry.id);
    }

    revalidatePath("/entries");
    revalidatePath("/dashboard");

    return { data: entry };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
