"use server";

import { revalidatePath } from "next/cache";
import { getFamilyContext } from "@/lib/get-family-context";

export async function getTraditions() {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = ctx.supabase as any;

    const { data, error } = await sb
      .from("family_traditions")
      .select("*")
      .eq("family_id", ctx.familyId)
      .order("created_at", { ascending: true });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function createTradition(input: {
  name: string;
  description: string;
  frequency: string;
  next_occurrence?: string | null;
  cover_image?: string | null;
}) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = ctx.supabase as any;

    const { error } = await sb.from("family_traditions").insert({
      family_id: ctx.familyId,
      name: input.name.trim(),
      description: input.description.trim(),
      frequency: input.frequency,
      next_occurrence: input.next_occurrence || null,
      cover_image: input.cover_image || null,
      created_by: ctx.userId,
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

export async function updateTradition(
  id: string,
  input: {
    name?: string;
    description?: string;
    frequency?: string;
    next_occurrence?: string | null;
    last_celebrated?: string | null;
    cover_image?: string | null;
  }
) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = ctx.supabase as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.description !== undefined)
      updates.description = input.description.trim();
    if (input.frequency !== undefined) updates.frequency = input.frequency;
    if (input.next_occurrence !== undefined)
      updates.next_occurrence = input.next_occurrence || null;
    if (input.last_celebrated !== undefined)
      updates.last_celebrated = input.last_celebrated || null;
    if (input.cover_image !== undefined)
      updates.cover_image = input.cover_image || null;

    const { error } = await sb
      .from("family_traditions")
      .update(updates)
      .eq("id", id)
      .eq("created_by", ctx.userId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteTradition(id: string) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = ctx.supabase as any;
    const { error } = await sb
      .from("family_traditions")
      .delete()
      .eq("id", id)
      .eq("created_by", ctx.userId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

// ---------------------------------------------------------------------------
// Tradition Memories
// ---------------------------------------------------------------------------

export async function getTraditionMemories(traditionId: string) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = ctx.supabase as any;

    const { data, error } = await sb
      .from("tradition_memories")
      .select("*")
      .eq("tradition_id", traditionId)
      .eq("family_id", ctx.familyId)
      .order("celebrated_on", { ascending: false });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function addTraditionMemory(input: {
  tradition_id: string;
  content: string;
  celebrated_on?: string | null;
  images?: string[];
}) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = ctx.supabase as any;

    const { error } = await sb.from("tradition_memories").insert({
      tradition_id: input.tradition_id,
      family_id: ctx.familyId,
      content: input.content.trim(),
      celebrated_on: input.celebrated_on || null,
      images: input.images ?? [],
      created_by: ctx.userId,
    });

    if (error) return { error: error.message };

    // Also update last_celebrated on the tradition
    if (input.celebrated_on) {
      await sb
        .from("family_traditions")
        .update({ last_celebrated: input.celebrated_on })
        .eq("id", input.tradition_id);
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteTraditionMemory(memoryId: string) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = ctx.supabase as any;

    const { error } = await sb
      .from("tradition_memories")
      .delete()
      .eq("id", memoryId)
      .eq("family_id", ctx.familyId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
