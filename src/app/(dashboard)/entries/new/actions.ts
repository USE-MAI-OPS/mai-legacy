"use server";

import { revalidatePath } from "next/cache";
import { getFamilyContext } from "@/lib/get-family-context";
import { createClient } from "@/lib/supabase/server";
import type { EntryType, EntryStructuredData } from "@/types/database";

interface CreateEntryInput {
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  structured_data?: EntryStructuredData;
  /** When provided, creates entries in these specific families.
   *  When empty or undefined, creates in ALL user's families. */
  familyIds?: string[];
}

export interface UserFamily {
  id: string;
  name: string;
}

/** Get all families the current user belongs to. */
export async function getUserFamilies(): Promise<UserFamily[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const sb = supabase as any;
    const { data: memberships } = await sb
      .from("family_members")
      .select("family_id, families(name)")
      .eq("user_id", user.id);

    if (!memberships) return [];

    return memberships.map((m: any) => ({
      id: m.family_id,
      name: (m.families as any)?.name ?? "Unknown Family",
    }));
  } catch {
    return [];
  }
}

export async function createEntry(input: CreateEntryInput) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "You must be signed in to create an entry." };
    const { userId, supabase } = ctx;

    const sb = supabase as any;

    // Determine which families to create the entry in
    let targetFamilyIds = input.familyIds ?? [];

    if (targetFamilyIds.length === 0) {
      // Default: create in all user's families
      const { data: memberships } = await sb
        .from("family_members")
        .select("family_id")
        .eq("user_id", userId);

      targetFamilyIds = (memberships ?? []).map((m: any) => m.family_id);
    }

    if (targetFamilyIds.length === 0) {
      return { error: "No families found for your account." };
    }

    // Build insert rows for each family
    const insertRows = targetFamilyIds.map((fid: string) => {
      const row: Record<string, unknown> = {
        family_id: fid,
        author_id: userId,
        title: input.title,
        content: input.content,
        type: input.type,
        tags: input.tags,
      };
      if (input.structured_data) {
        row.structured_data = input.structured_data;
      }
      return row;
    });

    const { data: entries, error: insertError } = await sb
      .from("entries")
      .insert(insertRows)
      .select();

    if (insertError) {
      return { error: insertError.message };
    }

    // Trigger embedding generation for each entry (fire-and-forget)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    for (const entry of entries ?? []) {
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

    // Return the first entry (the one for the active family) for redirect
    const firstEntry = entries?.[0];
    return { data: firstEntry };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
