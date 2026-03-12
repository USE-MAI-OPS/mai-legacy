import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFamilyContext } from "@/lib/get-family-context";
import { FamilyTree } from "./components/family-tree";
import { UpcomingEvents } from "./components/upcoming-events";
import { FeatureCards } from "./components/feature-cards";
import type { RsvpStatus } from "@/types/database";

// ---------------------------------------------------------------------------
// Types for raw DB rows
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

interface EventRow {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string | null;
  location: string | null;
  created_by: string;
}

interface RsvpRow {
  event_id: string;
  user_id: string;
  status: RsvpStatus;
}

interface RealMemberRow {
  id: string;
  display_name: string;
  user_id: string;
}

interface EntryCountRow {
  type: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getFamilyData() {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return null;
    const { userId, familyId, supabase } = ctx;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Parallel data fetches
    const [
      familyResult,
      treeMembersResult,
      realMembersResult,
      eventsResult,
    ] = await Promise.all([
      sb.from("families").select("name").eq("id", familyId).single(),
      sb
        .from("family_tree_members")
        .select(
          "id, display_name, relationship_label, parent_id, spouse_id, linked_member_id, birth_year, is_deceased, avatar_url"
        )
        .eq("family_id", familyId)
        .order("created_at", { ascending: true }),
      sb
        .from("family_members")
        .select("id, display_name, user_id")
        .eq("family_id", familyId)
        .order("joined_at", { ascending: true }),
      sb
        .from("family_events")
        .select(
          "id, title, description, event_date, end_date, location, created_by"
        )
        .eq("family_id", familyId)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(6),
    ]);

    const events = (eventsResult.data as EventRow[]) ?? [];

    // Fetch RSVPs for returned events
    let rsvps: RsvpRow[] = [];
    if (events.length > 0) {
      const eventIds = events.map((e) => e.id);
      const { data: rsvpData } = await sb
        .from("event_rsvps")
        .select("event_id, user_id, status")
        .in("event_id", eventIds);
      rsvps = (rsvpData as RsvpRow[]) ?? [];
    }

    // Entry counts by type
    let entryCounts: Record<string, number> = {};
    try {
      const { data: countData } = await sb.rpc("get_entry_counts_by_type", {
        p_family_id: familyId,
      });
      if (countData) {
        for (const row of countData as EntryCountRow[]) {
          entryCounts[row.type] = Number(row.count);
        }
      }
    } catch {
      // RPC may not exist yet — fall back to client-side count
      try {
        const types = ["recipe", "skill", "lesson"];
        for (const t of types) {
          const { count } = await sb
            .from("entries")
            .select("id", { count: "exact", head: true })
            .eq("family_id", familyId)
            .eq("type", t);
          entryCounts[t] = count ?? 0;
        }
      } catch {
        // Silently ignore — counts will be 0
      }
    }

    // Find current user's family_members row
    const realMembers = (realMembersResult.data as RealMemberRow[]) ?? [];
    const currentUserMember = realMembers.find((m) => m.user_id === userId);

    return {
      familyName: familyResult.data?.name ?? "Your Family",
      treeMembers: (treeMembersResult.data as TreeMemberRow[]) ?? [],
      realMembers,
      events,
      rsvps,
      entryCounts,
      currentUserId: userId,
      currentUserMemberId: currentUserMember?.id ?? null,
      currentUserDisplayName: currentUserMember?.display_name ?? null,
      familyId,
      memberCount: realMembers.length,
    };
  } catch (err) {
    console.error("Family data fetch failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function FamilyPage() {
  const data = await getFamilyData();

  if (!data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold mb-1">Welcome to Your Family</h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Create or join a family to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            {data.familyName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {data.memberCount} member{data.memberCount !== 1 ? "s" : ""} · Your
            family hub
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/family/invite">
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Link>
        </Button>
      </div>

      {/* Family Tree — centerpiece */}
      <section>
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
      </section>

      {/* Upcoming Events */}
      <section>
        <UpcomingEvents
          events={data.events}
          rsvps={data.rsvps}
          familyId={data.familyId}
          currentUserId={data.currentUserId}
        />
      </section>

      {/* Feature Cards (Recipes, Skills, Lessons) */}
      <section>
        <FeatureCards entryCounts={data.entryCounts} />
      </section>
    </div>
  );
}
