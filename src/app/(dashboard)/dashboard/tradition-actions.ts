"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTraditions() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: membership } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) return [];

    const { data, error } = await sb
      .from("family_traditions")
      .select("*")
      .eq("family_id", membership.family_id)
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: membership } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) return { error: "No family found" };

    const { error } = await sb.from("family_traditions").insert({
      family_id: membership.family_id,
      name: input.name.trim(),
      description: input.description.trim(),
      frequency: input.frequency,
      created_by: user.id,
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const updates: Record<string, string> = {};
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.description !== undefined)
      updates.description = input.description.trim();
    if (input.frequency !== undefined) updates.frequency = input.frequency;

    const { error } = await sb
      .from("family_traditions")
      .update(updates)
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteTradition(id: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = await sb
      .from("family_traditions")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
