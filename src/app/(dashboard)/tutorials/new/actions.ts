"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { TutorialStep } from "@/types/database";

export async function createTutorial(formData: {
  entryId: string;
  difficulty: string;
  estimatedTime: string;
  steps: { title: string; description: string; tips: string }[];
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's family
    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No family found" };
    }

    // Build steps array
    const steps: TutorialStep[] = formData.steps.map((s, i) => ({
      order: i + 1,
      title: s.title,
      description: s.description,
      tips: s.tips || undefined,
    }));

    const { data: tutorial, error } = await supabase
      .from("skill_tutorials")
      .insert({
        entry_id: formData.entryId,
        family_id: membership.family_id,
        steps,
        difficulty_level: formData.difficulty || "beginner",
        estimated_time: formData.estimatedTime || "",
      })
      .select("id")
      .single();

    if (error) throw error;

    return { success: true, id: tutorial.id };
  } catch (e) {
    console.error("Failed to create tutorial:", e);
    return { success: false, error: "Failed to create tutorial" };
  }
}
