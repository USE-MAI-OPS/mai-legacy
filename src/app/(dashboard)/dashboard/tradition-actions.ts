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
  input: { name?: string; description?: string; frequency?: string }
) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = ctx.supabase as any;
    const updates: Record<string, string> = {};
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.description !== undefined)
      updates.description = input.description.trim();
    if (input.frequency !== undefined) updates.frequency = input.frequency;

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
