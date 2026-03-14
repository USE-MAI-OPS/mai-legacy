"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getActiveFamilyIdFromCookie,
  setActiveFamilyCookie,
} from "@/lib/active-family-server";
import {
  getConnectionChain,
  type ConnectionChain,
} from "@/lib/connection-chain";

export type FamilyContext = {
  userId: string;
  familyId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  /** Auth user UUIDs of connected family members (for filtering entries) */
  connectedUserIds: string[];
  /** Tree member UUIDs of connected members (for filtering tree view) */
  connectedTreeMemberIds: string[];
  /** Whether the current user has a linked tree node with parents */
  hasTreeNode: boolean;
};

/**
 * Server-side helper that resolves the current user + active family + connection chain.
 *
 * 1. Gets authenticated user
 * 2. Reads active family from cookie
 * 3. Verifies user belongs to that family
 * 4. Falls back to first family if cookie missing/invalid
 * 5. Sets cookie for next time
 * 6. Computes connection chain (which members the user can see)
 * 7. Returns full context or null
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

  let familyId: string | null = null;

  // If we have a cookie, verify the user belongs to that family
  if (cookieFamilyId) {
    const { data: validMember } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .eq("family_id", cookieFamilyId)
      .maybeSingle();

    if (validMember) {
      familyId = cookieFamilyId;
    }
  }

  // Cookie missing or invalid — fall back to first family
  if (!familyId) {
    const { data: firstMember } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!firstMember) return null;

    familyId = firstMember.family_id;

    // Set cookie for next time
    try {
      await setActiveFamilyCookie(familyId!);
    } catch {
      // Server component context — can't always set cookies, that's fine
    }
  }

  // Compute connection chain
  const chain: ConnectionChain = await getConnectionChain(
    sb,
    familyId!,
    user.id
  );

  return {
    userId: user.id,
    familyId: familyId!,
    supabase,
    connectedUserIds: chain.connectedUserIds,
    connectedTreeMemberIds: chain.connectedTreeMemberIds,
    hasTreeNode: chain.hasTreeNode,
  };
}
