import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TreePine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFamilyContext } from "@/lib/get-family-context";
import { FamilyTree } from "../components/family-tree";
import type {
  TreeGroupType,
  TreeSide,
  TreeFilterSpec,
  TreeSplitSpec,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TreeMemberRow {
  id: string;
  display_name: string;
  relationship_label: string | null;
  parent_id: string | null;
  parent2_id: string | null;
  spouse_id: string | null;
  linked_member_id: string | null;
  birth_year: number | null;
  is_deceased: boolean;
  avatar_url: string | null;
  position_x: number | null;
  position_y: number | null;
  connection_type: string | null;
  group_type: TreeGroupType | null;
  side: TreeSide | null;
  tags: string[] | null;
  occupation: string | null;
  location: string | null;
  bio: string | null;
}

interface RealMemberRow {
  id: string;
  display_name: string;
  user_id: string;
  occupation: string | null;
  country: string | null;
  state: string | null;
}

interface SavedViewRow {
  id: string;
  label: string;
  icon: string;
  filters: TreeFilterSpec;
  split: TreeSplitSpec | null;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getTreeData() {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return null;
    const { userId, familyId, supabase, connectedTreeMemberIds } = ctx;

    const sb = supabase;

    const fullSelect =
      "id, display_name, relationship_label, parent_id, parent2_id, spouse_id, linked_member_id, birth_year, is_deceased, avatar_url, position_x, position_y, connection_type, group_type, side, tags, occupation, location, bio";

    // Same visibility relaxation we applied in commit c79243b — include members
    // the user added themselves so friends/work/school (no DNA edges) aren't
    // stripped by the connection-chain filter.
    const idOrAddedByFilter =
      connectedTreeMemberIds.length === 0
        ? `added_by.eq.${userId}`
        : `id.in.(${connectedTreeMemberIds.map((id) => `"${id}"`).join(",")}),added_by.eq.${userId}`;

    const [familyResult, treeMembersResult, realMembersResult, savedViewsResult] =
      await Promise.all([
        sb.from("families").select("name").eq("id", familyId).single(),
        sb
          .from("family_tree_members")
          .select(fullSelect)
          .eq("family_id", familyId)
          .or(idOrAddedByFilter)
          .order("created_at", { ascending: true }),
        sb
          .from("family_members")
          .select("id, display_name, user_id, occupation, country, state")
          .eq("family_id", familyId)
          .order("joined_at", { ascending: true }),
        sb
          .from("tree_views")
          .select("id, label, icon, filters, split")
          .eq("family_id", familyId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
      ]);

    const treeMembersData = (treeMembersResult.data as TreeMemberRow[] | null) ?? [];
    const realMembers = (realMembersResult.data as RealMemberRow[]) ?? [];
    const savedViews = (savedViewsResult.data as SavedViewRow[] | null) ?? [];
    const currentUserMember = realMembers.find((m) => m.user_id === userId);

    // Count entries per author_id once, for tree members linked to real accounts.
    // Splits into stories vs recipes using entries.type.
    const linkedUserIds = treeMembersData
      .map((m) => {
        const fm = realMembers.find((r) => r.id === m.linked_member_id);
        return fm?.user_id;
      })
      .filter((v): v is string => !!v);

    const storyCounts = new Map<string, number>();
    const recipeCounts = new Map<string, number>();
    if (linkedUserIds.length > 0) {
      const { data: entries } = await sb
        .from("entries")
        .select("author_id, type")
        .eq("family_id", familyId)
        .in("author_id", linkedUserIds);
      for (const e of entries ?? []) {
        const uid = (e as { author_id: string }).author_id;
        const type = (e as { type: string }).type;
        if (type === "recipe") recipeCounts.set(uid, (recipeCounts.get(uid) ?? 0) + 1);
        else storyCounts.set(uid, (storyCounts.get(uid) ?? 0) + 1);
      }
    }

    return {
      familyName: familyResult.data?.name ?? "Your Family",
      treeMembers: treeMembersData,
      realMembers,
      savedViews,
      storyCounts: Object.fromEntries(storyCounts),
      recipeCounts: Object.fromEntries(recipeCounts),
      currentUserId: userId,
      currentUserMemberId: currentUserMember?.id ?? null,
      currentUserDisplayName: currentUserMember?.display_name ?? null,
      currentUserOccupation: currentUserMember?.occupation ?? null,
      currentUserLocation:
        [currentUserMember?.state, currentUserMember?.country].filter(Boolean).join(", ") || null,
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
  const ctx = await getFamilyContext();
  if (!ctx) {
    redirect("/onboarding");
  }

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
              {data.familyName} MAI Tree
            </h1>
            <p className="text-xs text-muted-foreground">
              {memberCount} member{memberCount !== 1 ? "s" : ""} in tree
            </p>
          </div>
        </div>
      </div>

      {/* Canvas fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <FamilyTree
          treeMembers={data.treeMembers.map((m) => ({
            ...m,
            tags: m.tags ?? [],
          }))}
          realMembers={data.realMembers.map((m) => ({
            id: m.id,
            display_name: m.display_name,
            user_id: m.user_id,
          }))}
          savedViews={data.savedViews}
          storyCounts={data.storyCounts}
          recipeCounts={data.recipeCounts}
          familyId={data.familyId}
          familyName={data.familyName}
          currentUserId={data.currentUserId}
          currentUserMemberId={data.currentUserMemberId}
          currentUserDisplayName={data.currentUserDisplayName}
          currentUserOccupation={data.currentUserOccupation}
          currentUserLocation={data.currentUserLocation}
        />
      </div>
    </div>
  );
}
