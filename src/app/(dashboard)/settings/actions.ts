"use server";

import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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

/**
 * Fully purge a user's account and data (GDPR).
 *
 * Order is dictated by the FK graph (see migration 026 and the Session 1
 * remediation plan). Tables with ON DELETE CASCADE from auth.users.id are
 * cleaned automatically when auth.admin.deleteUser() fires at the end;
 * tables with NO ACTION must be emptied first or the delete will error.
 *
 * families.created_by is nullable + ON DELETE SET NULL (migration 026), so
 * families the user created but share with others are preserved; only the
 * created_by pointer is nulled. Remaining admins can reassign ownership.
 */
export async function deleteAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const userId = user.id;
  const admin = createAdminClient();

  try {
    // Phase B — explicit deletes in FK-safe order.
    // entry_embeddings first (cascades from entries, but do explicitly in
    // case any embeddings were orphaned), then entries themselves.
    const { data: authoredEntries } = await admin
      .from("entries")
      .select("id")
      .eq("author_id", userId);

    const entryIds = (authoredEntries ?? []).map((r) => r.id);

    if (entryIds.length > 0) {
      const { error } = await admin
        .from("entry_embeddings")
        .delete()
        .in("entry_id", entryIds);
      if (error) throw new Error(`entry_embeddings: ${error.message}`);
    }

    const e1 = await admin.from("entries").delete().eq("author_id", userId);
    if (e1.error) throw new Error(`entries: ${e1.error.message}`);

    const e2 = await admin.from("family_tree_members").delete().eq("added_by", userId);
    if (e2.error) throw new Error(`family_tree_members: ${e2.error.message}`);

    const e3 = await admin.from("event_rsvps").delete().eq("user_id", userId);
    if (e3.error) throw new Error(`event_rsvps: ${e3.error.message}`);

    const e4 = await admin.from("family_events").delete().eq("created_by", userId);
    if (e4.error) throw new Error(`family_events: ${e4.error.message}`);

    // skill_tutorials has no user reference (linked to entries via entry_id
    // with ON DELETE CASCADE). Deleting the user's entries above already
    // removes any tutorials they authored through their entries.

    const e6 = await admin
      .from("interview_transcripts")
      .delete()
      .eq("uploaded_by", userId);
    if (e6.error) throw new Error(`interview_transcripts: ${e6.error.message}`);

    const e7 = await admin.from("family_members").delete().eq("user_id", userId);
    if (e7.error) throw new Error(`family_members: ${e7.error.message}`);

    // Phase D — delete the auth user. Cascades everything still pointing
    // at auth.users.id (notifications, entry_reactions, entry_comments,
    // direct_messages sender side, griot_conversations, drip_email_log,
    // email_verifications) + nulls families.created_by.
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      throw new Error(`auth.deleteUser: ${deleteUserError.message}`);
    }

    // Phase E — clear session + middleware cookies so the client doesn't loop.
    await supabase.auth.signOut();
    try {
      const cookieStore = await cookies();
      cookieStore.delete("mai_has_family");
      cookieStore.delete("mai_email_verified");
      cookieStore.delete("mai_active_family");
    } catch {
      // Non-critical — stale cookies expire on their own TTL.
    }

    return { success: true };
  } catch (e) {
    console.error("Failed to delete account:", e);
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return { success: false, error: message };
  }
}
