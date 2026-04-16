"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export type InviteDetails = {
  familyName: string;
  invitedBy: string;
  role: string;
  familyId: string;
  expired: boolean;
};

export type FetchInviteResult =
  | { ok: false; error: string }
  | { ok: true; alreadyMember: true }
  | {
      ok: true;
      alreadyMember: false;
      isLoggedIn: boolean;
      invite: InviteDetails;
    };

/**
 * Fetch invite details for the public invite page.
 *
 * Uses the admin client because `family_invites` SELECT is now restricted
 * (migration 025). The admin client bypasses RLS so unauthenticated link
 * viewers can still see the invite. Only a narrow projection is returned —
 * never the full invite row.
 */
export async function fetchInviteDetails(
  inviteId: string,
): Promise<FetchInviteResult> {
  // Standard client for auth user lookup
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("family_invites")
    .select("family_id, invited_by, role, accepted, expires_at")
    .eq("id", inviteId)
    .maybeSingle();

  if (inviteError || !invite) {
    return { ok: false, error: "This invite link is invalid or has been removed." };
  }

  if (invite.accepted) {
    if (user) {
      const { data: memberCheck } = await admin
        .from("family_members")
        .select("id")
        .eq("family_id", invite.family_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberCheck) {
        return { ok: true, alreadyMember: true };
      }
    }
    return { ok: false, error: "This invite has already been accepted." };
  }

  const { data: family } = await admin
    .from("families")
    .select("name")
    .eq("id", invite.family_id)
    .maybeSingle();

  if (!family) {
    return {
      ok: false,
      error: "This invite points to a family that no longer exists.",
    };
  }

  const { data: inviter } = await admin
    .from("family_members")
    .select("display_name")
    .eq("user_id", invite.invited_by)
    .eq("family_id", invite.family_id)
    .limit(1)
    .maybeSingle();

  const expired = new Date(invite.expires_at) < new Date();

  return {
    ok: true,
    alreadyMember: false,
    isLoggedIn,
    invite: {
      familyName: family.name,
      invitedBy: inviter?.display_name ?? "A family member",
      role: invite.role,
      familyId: invite.family_id,
      expired,
    },
  };
}
