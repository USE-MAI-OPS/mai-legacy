import Link from "next/link";
import { ArrowLeft, TreePine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFamilyContext } from "@/lib/get-family-context";
import { FamilyTree } from "../components/family-tree";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TreeMemberRow {
  id: string;
  display_name: string;
  relationship_label: string | null;
  parent_id: string | null;
  spouse_id: string | null;
  linked_member_id: string | null;
  birth_year: number | null;
  is_deceased: boolean;
  avatar_url: string | null;
}

interface RealMemberRow {
  id: string;
  display_name: string;
  user_id: string;
}

// ---------------------------------------------------------------------------
// Data fetching (tree-specific subset)
// ---------------------------------------------------------------------------
async function getTreeData() {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return null;
    const { userId, familyId, supabase, connectedTreeMemberIds } = ctx;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Build tree query — filter to connected members if connection chain is active
    let treeQuery = sb
      .from("family_tree_members")
      .select(
        "id, display_name, relationship_label, parent_id, parent2_id, spouse_id, linked_member_id, birth_year, is_deceased, avatar_url"
      )
      .eq("family_id", familyId)
      .order("created_at", { ascending: true });

    if (connectedTreeMemberIds.length > 0) {
      treeQuery = treeQuery.in("id", connectedTreeMemberIds);
    }

    const [familyResult, treeMembersResult, realMembersResult] =
      await Promise.all([
        sb.from("families").select("name").eq("id", familyId).single(),
        treeQuery,
        sb
          .from("family_members")
          .select("id, display_name, user_id")
          .eq("family_id", familyId)
          .order("joined_at", { ascending: true }),
      ]);

    const realMembers = (realMembersResult.data as RealMemberRow[]) ?? [];
    const currentUserMember = realMembers.find((m) => m.user_id === userId);

    return {
      familyName: familyResult.data?.name ?? "Your Family",
      treeMembers: (treeMembersResult.data as TreeMemberRow[]) ?? [],
      realMembers,
      currentUserId: userId,
      currentUserMemberId: currentUserMember?.id ?? null,
      currentUserDisplayName: currentUserMember?.display_name ?? null,
      familyId,
    };
  } catch (err) {
    console.error("Tree data fetch failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function FamilyTreePage() {
  const data = await getTreeData();

  if (!data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold mb-1">
              Welcome to Your Family
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Create or join a family to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const memberCount = data.treeMembers.length;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Compact header */}
      <div className="flex items-center justify-between px-6 py-5 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/family">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <TreePine className="h-5 w-5 text-primary" />
              {data.familyName} Family Tree
            </h1>
            <p className="text-xs text-muted-foreground">
              {memberCount} member{memberCount !== 1 ? "s" : ""} in tree
            </p>
          </div>
        </div>
      </div>

      {/* Tree fills remaining height — viewport handles its own pan/zoom */}
      <div className="flex-1 overflow-hidden px-6 pt-5">
        <FamilyTree
          treeMembers={data.treeMembers}
          realMembers={data.realMembers.map((m) => ({
            id: m.id,
            display_name: m.display_name,
          }))}
          familyId={data.familyId}
          currentUserId={data.currentUserId}
          currentUserMemberId={data.currentUserMemberId}
          currentUserDisplayName={data.currentUserDisplayName}
        />
      </div>
    </div>
  );
}
