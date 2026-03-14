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
    // First check if user has a tree node
    const { data: treeNodeCheck } = await supabase
      .from("family_tree_members")
      .select("id")
      .eq("family_id", familyId)
      .eq(
        "linked_member_id",
        // Need to get the family_members.id for this user
        supabase
          .from("family_members")
          .select("id")
          .eq("user_id", userId)
          .eq("family_id", familyId)
          .single()
      );

    // Simpler approach: call the RPC functions directly
    // get_connected_user_ids handles the "no tree node" case by returning just the user's own ID

    const { data: connectedUserIds, error: userIdError } = await supabase.rpc(
      "get_connected_user_ids",
      {
        p_family_id: familyId,
        p_user_id: userId,
      }
    );

    if (userIdError) {
      console.error("Connection chain (user IDs) error:", userIdError);
      // Graceful fallback: return just the user's own ID
      return {
        connectedUserIds: [userId],
        connectedTreeMemberIds: [],
        hasTreeNode: false,
      };
    }

    // Check if user actually has a tree node by looking at whether they got
    // more than just their own ID back, or by checking directly
    const { data: userTreeNode } = await supabase
      .from("family_tree_members")
      .select("id, linked_member_id")
      .eq("family_id", familyId)
      .not("linked_member_id", "is", null);

    // Find this user's tree node by matching through family_members
    const { data: memberRow } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", userId)
      .eq("family_id", familyId)
      .maybeSingle();

    const myTreeNode = memberRow
      ? (userTreeNode ?? []).find(
          (t: { id: string; linked_member_id: string }) =>
            t.linked_member_id === memberRow.id
        )
      : null;

    const hasTreeNode = !!myTreeNode;

    // If user has no tree node, return ALL family user IDs (no filtering)
    if (!hasTreeNode) {
      const { data: allMembers } = await supabase
        .from("family_members")
        .select("user_id")
        .eq("family_id", familyId);

      const allUserIds = (allMembers ?? [])
        .map((m: { user_id: string }) => m.user_id)
        .filter(Boolean);

      // Also get all tree member IDs
      const { data: allTreeMembers } = await supabase
        .from("family_tree_members")
        .select("id")
        .eq("family_id", familyId);

      return {
        connectedUserIds: allUserIds.length > 0 ? allUserIds : [userId],
        connectedTreeMemberIds: (allTreeMembers ?? []).map(
          (t: { id: string }) => t.id
        ),
        hasTreeNode: false,
      };
    }

    // User has a tree node — get connected tree member IDs too
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
      connectedUserIds: connectedUserIds ?? [userId],
      connectedTreeMemberIds: connectedTreeIds ?? [],
      hasTreeNode: true,
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
