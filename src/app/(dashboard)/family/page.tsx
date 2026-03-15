import Link from "next/link";
import { Users, Plus, TreePine, ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFamilyContext } from "@/lib/get-family-context";
import { UpcomingEvents } from "./components/upcoming-events";
import { FeatureCards } from "./components/feature-cards";
import { TraditionsSection } from "@/components/traditions-section";
import type { RsvpStatus } from "@/types/database";

// ---------------------------------------------------------------------------
// Types for raw DB rows
// ---------------------------------------------------------------------------
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
    const { userId, familyId, supabase, connectedUserIds, connectedTreeMemberIds } = ctx;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Build tree count query — filter to connected members
    let treeCountQuery = sb
      .from("family_tree_members")
      .select("id", { count: "exact", head: true })
      .eq("family_id", familyId);
    if (connectedTreeMemberIds.length > 0) {
      treeCountQuery = treeCountQuery.in("id", connectedTreeMemberIds);
    }

    // Parallel data fetches
    const [
      familyResult,
      treeMembersResult,
      realMembersResult,
      eventsResult,
      traditionsResult,
      goalsResult,
    ] = await Promise.all([
      sb.from("families").select("name").eq("id", familyId).single(),
      treeCountQuery,
      sb
        .from("family_members")
        .select("id, display_name, user_id")
        .eq("family_id", familyId)
        .in("user_id", connectedUserIds)
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
      sb
        .from("family_traditions")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: true }),
      sb
        .from("family_goals")
        .select("id, title, target_count, current_count, status")
        .eq("family_id", familyId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5),
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
      const { data: countData, error: rpcError } = await sb.rpc("get_entry_counts_by_type", {
        p_family_id: familyId,
      });
      if (rpcError || !countData) {
        // RPC doesn't exist or failed — fall back to direct queries
        throw new Error("RPC unavailable");
      }
      for (const row of countData as EntryCountRow[]) {
        entryCounts[row.type] = Number(row.count);
      }
    } catch {
      // Fall back to client-side count
      try {
        const types = ["recipe", "skill", "lesson", "story", "connection"];
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
      treeMemberCount: treeMembersResult.count ?? 0,
      realMembers,
      events,
      rsvps,
      entryCounts,
      currentUserId: userId,
      currentUserMemberId: currentUserMember?.id ?? null,
      currentUserDisplayName: currentUserMember?.display_name ?? null,
      familyId,
      memberCount: realMembers.length,
      goals: (goalsResult.data ?? []) as Array<{ id: string; title: string; target_count: number; current_count: number }>,
      traditions: (traditionsResult.data ?? []).map(
        (t: { id: string; name: string; description: string; frequency: string; created_by: string }) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          frequency: t.frequency ?? "annual",
          created_by: t.created_by,
        })
      ),
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
      {/* Storytelling Header Block */}
      <section className="relative rounded-2xl overflow-hidden mb-12 shadow-sm border bg-[#2C4835] dark:bg-green-950">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Photo */}
          <div className="relative h-64 md:h-[400px]">
            <img 
              src="https://images.unsplash.com/photo-1596707328607-4e5ff41d0172?q=80&w=2072&auto=format&fit=crop" 
              alt="Our Family" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right: Overlapping Box Content */}
          <div className="flex flex-col justify-center p-8 md:p-12 text-white relative">
            <div className="relative z-10">
              <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20">
                {data.memberCount} member{data.memberCount !== 1 ? "s" : ""}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 leading-tight">
                {data.familyName}
              </h1>
              <p className="text-green-50 mb-8 font-serif italic text-lg opacity-90 max-w-md">
                Explore your family's lineage and relationships. Trace the roots that connect you all.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" variant="secondary" className="bg-white text-[#2C4835] hover:bg-green-50 rounded-full font-serif" asChild>
                  <Link href="/family/tree">
                    <TreePine className="mr-2 h-5 w-5" />
                    View Family Tree
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 rounded-full font-serif bg-transparent" asChild>
                  <Link href="/family/invite">
                    <Plus className="mr-2 h-5 w-5" />
                    Invite Member
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
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

      {/* Family Traditions */}
      <section>
        <TraditionsSection traditions={data.traditions} userId={data.currentUserId} />
      </section>

      {/* Family Goals */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-500" />
              Family Goals
            </CardTitle>
            {data.goals.length > 0 ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/goals">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/goals">
                  <Plus className="mr-1 h-3 w-3" />
                  Set a Goal
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {data.goals.length > 0 ? (
              <div className="grid sm:grid-cols-3 gap-4">
                {data.goals.map((goal) => {
                  const pct = goal.target_count > 0 ? Math.round((goal.current_count / goal.target_count) * 100) : 0;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <p className="text-sm font-medium leading-tight">
                        {goal.title}
                      </p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {goal.current_count} / {goal.target_count} ({pct}%)
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No goals yet. Set a family goal to track your legacy-building progress!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Feature Cards (Recipes, Skills, Lessons) */}
      <section>
        <FeatureCards entryCounts={data.entryCounts} />
      </section>
    </div>
  );
}
