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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase as any)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase as any)
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
