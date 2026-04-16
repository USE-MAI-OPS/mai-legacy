/**
 * Reusable authorization helpers for server actions.
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Verify that the authenticated user is a member of the given family.
 * Returns the user object if authorized, or an error string.
 */
export async function verifyFamilyMembership(familyId: string): Promise<
  | { user: { id: string }; error: null }
  | { user: null; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, error: "Not authenticated" };
  }

  const { data: membership } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("family_id", familyId)
    .maybeSingle();

  if (!membership) {
    return { user: null, error: "You are not a member of this family" };
  }

  return { user, error: null };
}

/**
 * Verify that the authenticated user is an admin of the given family.
 */
export async function verifyFamilyAdmin(familyId: string): Promise<
  | { user: { id: string }; error: null }
  | { user: null; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, error: "Not authenticated" };
  }

  const { data: membership } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("family_id", familyId)
    .maybeSingle();

  if (!membership) {
    return { user: null, error: "You are not a member of this family" };
  }

  if (membership.role !== "admin") {
    return { user: null, error: "Admin access required" };
  }

  return { user, error: null };
}

/**
 * Check whether a specific user is an admin of a family.
 * Returns true only when a membership row exists with role = 'admin'.
 * Uses the caller-supplied supabase client to reuse the current request's auth context.
 */
export async function isUserFamilyAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  familyId: string
): Promise<boolean> {
  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", userId)
    .eq("family_id", familyId)
    .maybeSingle();

  return membership?.role === "admin";
}
