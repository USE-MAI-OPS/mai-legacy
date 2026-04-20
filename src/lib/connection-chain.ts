"use server";

/**
 * Connection Chain — the core visibility algorithm for MAI Legacy.
 *
 * Computes which family members a user is connected to through blood
 * relationships + their spouses. Used to filter everything: tree view,
 * dashboard entries, Griot AI context, and entry access.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export interface ConnectionChain {
  /** Auth user UUIDs — for filtering entries (author_id) */
  connectedUserIds: string[];
  /** Tree member UUIDs — for filtering the tree view */
  connectedTreeMemberIds: string[];
  /** Whether the user has a linked tree node (false = hasn't completed parent linking) */
  hasTreeNode: boolean;
}

/**
 * Get the connection chain for a user within a family.
 *
 * If the user has no tree node yet (hasn't completed parent linking),
 * returns hasTreeNode=false and ALL family user IDs (graceful degradation —
 * no filtering until they set up their connections).
 */
export async function getConnectionChain(
  supabase: SupabaseClient,
  familyId: string,
  userId: string
): Promise<ConnectionChain> {
  try {
    // Round trip 1 (parallel):
    //   a. Ask Postgres for the connected user IDs via tree traversal.
    //      The RPC returns [userId] on its own if the user has no
    //      tree node, so we don't need a separate "do I have a node"
    //      probe to decide whether to run this.
    //   b. Fetch the current user's own tree node (via a join through
    //      family_members → family_tree_members). We need the tree
    //      node's id to run the tree-member-ids RPC later, and we
    //      use its presence as the definitive hasTreeNode signal.
    const [userIdsResult, myTreeNodeResult] = await Promise.all([
      supabase.rpc("get_connected_user_ids", {
        p_family_id: familyId,
        p_user_id: userId,
      }),
      supabase
        .from("family_tree_members")
        .select("id, linked_member_id, family_members!inner(user_id)")
        .eq("family_id", familyId)
        .eq("family_members.user_id", userId)
        .maybeSingle(),
    ]);

    if (userIdsResult.error) {
      console.error("Connection chain (user IDs) error:", userIdsResult.error);
      return {
        connectedUserIds: [userId],
        connectedTreeMemberIds: [],
        hasTreeNode: false,
      };
    }

    const connectedUserIds = (userIdsResult.data as string[] | null) ?? [userId];
    const myTreeNode = myTreeNodeResult.data as
      | { id: string; linked_member_id: string | null }
      | null;
    const hasTreeNode = !!myTreeNode;

    // Round trip 2: either fetch the connected tree member IDs (if the
    // user has a tree node), or the "show everyone" fallback pair
    // (family_members + family_tree_members) when they don't yet.
    if (hasTreeNode) {
      const { data: connectedTreeIds, error: treeIdError } = await supabase.rpc(
        "get_connected_tree_member_ids",
        {
          p_family_id: familyId,
          p_tree_member_id: myTreeNode.id,
        }
      );
      if (treeIdError) {
        console.error("Connection chain (tree IDs) error:", treeIdError);
      }
      return {
        connectedUserIds,
        connectedTreeMemberIds: (connectedTreeIds as string[] | null) ?? [],
        hasTreeNode: true,
      };
    }

    // No tree node yet — graceful "show everyone in the family" so the
    // new member sees content until they finish onboarding tree setup.
    const [allMembersResult, allTreeResult] = await Promise.all([
      supabase.from("family_members").select("user_id").eq("family_id", familyId),
      supabase.from("family_tree_members").select("id").eq("family_id", familyId),
    ]);

    const allUserIds = (allMembersResult.data ?? [])
      .map((m: { user_id: string }) => m.user_id)
      .filter(Boolean);
    const allTreeIds = (allTreeResult.data ?? []).map(
      (t: { id: string }) => t.id
    );

    return {
      connectedUserIds: allUserIds.length > 0 ? allUserIds : [userId],
      connectedTreeMemberIds: allTreeIds,
      hasTreeNode: false,
    };
  } catch (err) {
    console.error("Connection chain failed:", err);
    return {
      connectedUserIds: [userId],
      connectedTreeMemberIds: [],
      hasTreeNode: false,
    };
  }
}
