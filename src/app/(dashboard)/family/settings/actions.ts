"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";
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

    // Insert invite and capture the ID
    const { data: invite, error } = await supabase
      .from("family_invites")
      .insert({
        family_id: familyId,
        email,
        invited_by: user.id,
        role,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error || !invite) throw error ?? new Error("Failed to create invite");

    // Fetch family name and inviter display name for the email
    const [familyResult, inviterResult] = await Promise.all([
      supabase.from("families").select("name").eq("id", familyId).single(),
      supabase
        .from("family_members")
        .select("display_name")
        .eq("user_id", user.id)
        .limit(1)
        .single(),
    ]);

    const familyName = familyResult.data?.name ?? "Your Family";
    const inviterName = inviterResult.data?.display_name ?? "A family member";
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.id}`;

    // Send the invite email via Resend
    const { error: emailError } = await sendInviteEmail({
      to: email,
      inviteUrl,
      familyName,
      inviterName,
    });

    if (emailError) {
      // Clean up the invite record if the email failed
      await supabase.from("family_invites").delete().eq("id", invite.id);
      console.error("Email send failed:", emailError);
      throw new Error("Failed to send invite email");
    }

    revalidatePath("/family/settings");
    return { success: true };
  } catch (e) {
    console.error("Failed to send invite:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to send invite",
    };
  }
}

/** Create an invite record for a shareable link (no email sent) */
export async function createInviteLink(familyId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invite, error } = await supabase
      .from("family_invites")
      .insert({
        family_id: familyId,
        email: "link",
        invited_by: user.id,
        role: "member",
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error || !invite) throw error ?? new Error("Failed to create link");

    return {
      success: true,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.id}`,
    };
  } catch (e) {
    console.error("Failed to create invite link:", e);
    return { success: false, error: "Failed to create invite link" };
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
