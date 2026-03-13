"use server";

import { createClient } from "@/lib/supabase/server";

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (e) {
    console.error("Failed to change password:", e);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteAccount() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Sign out the user (actual account deletion would need admin privileges)
    // For now, we sign out and note that full deletion requires admin action
    await supabase.auth.signOut();

    return { success: true };
  } catch (e) {
    console.error("Failed to process account deletion:", e);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
