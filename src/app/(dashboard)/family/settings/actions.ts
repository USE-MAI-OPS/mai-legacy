"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFamilyName(familyId: string, name: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("families")
      .update({ name })
      .eq("id", familyId);

    if (error) throw error;
    revalidatePath("/family/settings");
    return { success: true };
  } catch (e) {
    console.error("Failed to update family name:", e);
    return { success: false, error: "Failed to update family name" };
  }
}

export async function sendInvite(
  familyId: string,
  email: string,
  role: "admin" | "member"
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    const { error } = await supabase.from("family_invites").insert({
      family_id: familyId,
      email,
      invited_by: user.id,
      role,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw error;

    // TODO: Send email with invite link
    revalidatePath("/family/settings");
    return { success: true };
  } catch (e) {
    console.error("Failed to send invite:", e);
    return { success: false, error: "Failed to send invite" };
  }
}

export async function removeMember(memberId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", memberId);

    if (error) throw error;
    revalidatePath("/family/settings");
    return { success: true };
  } catch (e) {
    console.error("Failed to remove member:", e);
    return { success: false, error: "Failed to remove member" };
  }
}
