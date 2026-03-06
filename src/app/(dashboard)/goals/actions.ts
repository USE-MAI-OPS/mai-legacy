"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { GoalStatus } from "@/types/database";

// Helper to get authenticated user's family context
async function getUserFamily() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: membership } = await sb
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;
  return { userId: user.id, familyId: membership.family_id, sb };
}

export interface FamilyGoal {
  id: string;
  family_id: string;
  title: string;
  description: string;
  target_count: number;
  current_count: number;
  status: GoalStatus;
  assigned_to: string[];
  due_date: string | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getGoals(): Promise<FamilyGoal[]> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return [];

    const { data, error } = await ctx.sb
      .from("family_goals")
      .select("*")
      .eq("family_id", ctx.familyId)
      .order("status", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []) as FamilyGoal[];
  } catch {
    return [];
  }
}

export async function createGoal(input: {
  title: string;
  description: string;
  targetCount: number;
  dueDate?: string;
}) {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return { error: "Not authenticated" };

    const { error } = await ctx.sb.from("family_goals").insert({
      family_id: ctx.familyId,
      title: input.title.trim(),
      description: input.description.trim(),
      target_count: input.targetCount,
      current_count: 0,
      status: "active" as GoalStatus,
      assigned_to: [],
      due_date: input.dueDate || null,
      created_by: ctx.userId,
    });

    if (error) return { error: error.message };

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

export async function updateGoal(
  id: string,
  input: {
    title?: string;
    description?: string;
    targetCount?: number;
    dueDate?: string | null;
    status?: GoalStatus;
  }
) {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return { error: "Not authenticated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.description !== undefined)
      updates.description = input.description.trim();
    if (input.targetCount !== undefined)
      updates.target_count = input.targetCount;
    if (input.dueDate !== undefined) updates.due_date = input.dueDate;
    if (input.status !== undefined) {
      updates.status = input.status;
      if (input.status === "completed") {
        updates.completed_at = new Date().toISOString();
      }
    }

    const { error } = await ctx.sb
      .from("family_goals")
      .update(updates)
      .eq("id", id)
      .eq("family_id", ctx.familyId);

    if (error) return { error: error.message };

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

export async function incrementProgress(id: string) {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return { error: "Not authenticated" };

    // Fetch current goal
    const { data: goal, error: fetchError } = await ctx.sb
      .from("family_goals")
      .select("current_count, target_count, status")
      .eq("id", id)
      .eq("family_id", ctx.familyId)
      .single();

    if (fetchError || !goal) return { error: "Goal not found" };
    if (goal.status !== "active") return { error: "Goal is not active" };

    const newCount = goal.current_count + 1;
    const isComplete = newCount >= goal.target_count;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      current_count: newCount,
    };

    if (isComplete) {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await ctx.sb
      .from("family_goals")
      .update(updates)
      .eq("id", id)
      .eq("family_id", ctx.familyId);

    if (error) return { error: error.message };

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true, completed: isComplete };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

export async function completeGoal(id: string) {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return { error: "Not authenticated" };

    // Fetch current goal to get target_count
    const { data: goal, error: fetchError } = await ctx.sb
      .from("family_goals")
      .select("target_count")
      .eq("id", id)
      .eq("family_id", ctx.familyId)
      .single();

    if (fetchError || !goal) return { error: "Goal not found" };

    const { error } = await ctx.sb
      .from("family_goals")
      .update({
        status: "completed" as GoalStatus,
        completed_at: new Date().toISOString(),
        current_count: goal.target_count,
      })
      .eq("id", id)
      .eq("family_id", ctx.familyId);

    if (error) return { error: error.message };

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteGoal(id: string) {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return { error: "Not authenticated" };

    // Only the creator can delete
    const { error } = await ctx.sb
      .from("family_goals")
      .delete()
      .eq("id", id)
      .eq("created_by", ctx.userId);

    if (error) return { error: error.message };

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
