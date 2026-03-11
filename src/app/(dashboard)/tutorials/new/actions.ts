"use server";

import { redirect } from "next/navigation";
import { getFamilyContext } from "@/lib/get-family-context";
import type { TutorialStep } from "@/types/database";

export async function createTutorial(formData: {
  entryId: string;
  difficulty: string;
  estimatedTime: string;
  steps: { title: string; description: string; tips: string }[];
}) {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return { success: false, error: "Not authenticated" };
    const { familyId, supabase } = ctx;

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
        family_id: familyId,
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
