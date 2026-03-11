"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getActiveFamilyIdFromCookie,
  setActiveFamilyCookie,
} from "@/lib/active-family-server";

export type FamilyContext = {
  userId: string;
  familyId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/**
 * Server-side helper that resolves the current user + active family.
 *
 * 1. Gets authenticated user
 * 2. Reads active family from cookie
 * 3. Verifies user belongs to that family
 * 4. Falls back to first family if cookie missing/invalid
 * 5. Sets cookie for next time
 * 6. Returns { userId, familyId, supabase } or null
 */
export async function getFamilyContext(): Promise<FamilyContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const cookieFamilyId = await getActiveFamilyIdFromCookie();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // If we have a cookie, verify the user belongs to that family
  if (cookieFamilyId) {
    const { data: validMember } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .eq("family_id", cookieFamilyId)
      .maybeSingle();

    if (validMember) {
      return { userId: user.id, familyId: cookieFamilyId, supabase };
    }
  }

  // Cookie missing or invalid — fall back to first family
  const { data: firstMember } = await sb
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!firstMember) return null;

  // Set cookie for next time
  try {
    await setActiveFamilyCookie(firstMember.family_id);
  } catch {
    // Server component context — can't always set cookies, that's fine
  }

  return { userId: user.id, familyId: firstMember.family_id, supabase };
}
