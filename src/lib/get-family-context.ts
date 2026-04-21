import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveFamilyIdFromCookie,
  setActiveFamilyCookie,
} from "@/lib/active-family-server";
import {
  getConnectionChain,
  getConnectionChainMulti,
  type ConnectionChain,
} from "@/lib/connection-chain";

export type FamilyContext = {
  userId: string;
  /** Active hub (family or circle) — use for hub-scoped pages like /family */
  familyId: string;
  /** All hubs the user belongs to — use for aggregated pages (dashboard, feed, etc.) */
  familyIds: string[];
  supabase: Awaited<ReturnType<typeof createClient>>;
  /** Auth user UUIDs of connected members in the active hub */
  connectedUserIds: string[];
  /** Tree member UUIDs of connected members in the active hub */
  connectedTreeMemberIds: string[];
  /** Auth user UUIDs of connected members across ALL hubs (for aggregated pages) */
  connectedUserIdsAll: string[];
  /** Tree member UUIDs of connected members across ALL hubs */
  connectedTreeMemberIdsAll: string[];
  /** Whether the current user has a linked tree node in the active hub */
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
export const getFamilyContext = cache(async (): Promise<FamilyContext | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const cookieFamilyId = await getActiveFamilyIdFromCookie();

  const sb = supabase;

  // Fetch ALL memberships in one query — needed for both active-hub resolution
  // and the familyIds[] aggregate used by non-hub-scoped pages.
  const { data: memberships } = await sb
    .from("family_members")
    .select("family_id, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (!memberships || memberships.length === 0) return null;

  const familyIds = memberships.map((m) => m.family_id as string);

  // Resolve active family: cookie if valid, else first joined.
  let familyId: string | null = null;
  if (cookieFamilyId && familyIds.includes(cookieFamilyId)) {
    familyId = cookieFamilyId;
  } else {
    familyId = familyIds[0];
    try {
      await setActiveFamilyCookie(familyId);
    } catch {
      // Server component context — can't always set cookies, that's fine
    }
  }

  // Compute connection chains (active-hub + unioned across all hubs) in parallel
  const [chain, chainAll]: [ConnectionChain, ConnectionChain] = await Promise.all([
    getConnectionChain(sb, familyId, user.id),
    getConnectionChainMulti(sb, familyIds, user.id),
  ]);

  return {
    userId: user.id,
    familyId,
    familyIds,
    supabase,
    connectedUserIds: chain.connectedUserIds,
    connectedTreeMemberIds: chain.connectedTreeMemberIds,
    connectedUserIdsAll: chainAll.connectedUserIds,
    connectedTreeMemberIdsAll: chainAll.connectedTreeMemberIds,
    hasTreeNode: chain.hasTreeNode,
  };
});
