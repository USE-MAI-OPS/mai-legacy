import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Plus, TreePine, ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getFamilyContext } from "@/lib/get-family-context";
import { UpcomingEvents } from "./components/upcoming-events";
import { FeatureCards } from "./components/feature-cards";
import { TraditionsSection } from "@/components/traditions-section";
import { FamilyCoverPhoto } from "./components/family-cover-photo";
import { HubContentWrapper } from "./hub-content-wrapper";
import { CreateHubButton } from "./components/create-hub-button";
import { getHubLabel } from "@/lib/hub-labels";
import type { RsvpStatus, EntryType, HubType } from "@/types/database";

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

    const sb = supabase;

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
      sb.from("families").select("name, type").eq("id", familyId).single(),
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
    const entryCounts: Record<string, number> = {};
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
      // Fall back to client-side count — run queries in parallel
      try {
        const types: EntryType[] = ["recipe", "skill", "lesson", "story", "connection"];
        const results = await Promise.all(
          types.map((t) =>
            sb
              .from("entries")
              .select("id", { count: "exact", head: true })
              .eq("family_id", familyId)
              .eq("type", t)
          )
        );
        types.forEach((t, i) => {
          entryCounts[t] = results[i].count ?? 0;
        });
      } catch {
        // Silently ignore — counts will be 0
      }
    }

    // Find current user's family_members row
    const realMembers = (realMembersResult.data as RealMemberRow[]) ?? [];
    const currentUserMember = realMembers.find((m) => m.user_id === userId);

    return {
      familyName: familyResult.data?.name ?? "Your Family",
      hubType: (familyResult.data?.type ?? "family") as HubType,
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
  // Redirect to onboarding if user has no family
  const ctx = await getFamilyContext();
  if (!ctx) {
    redirect("/onboarding");
  }

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
    <HubContentWrapper>
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Storytelling Header Block */}
      <section className="relative rounded-2xl overflow-hidden mb-12 shadow-sm border bg-[#2C4835] dark:bg-green-950">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Family Portrait */}
          <FamilyCoverPhoto familyId={data.familyId} />

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
                {data.hubType === "circle"
                  ? "Explore your circle\u2019s connections and shared experiences."
                  : "Explore your family\u2019s lineage and relationships. Trace the roots that connect you all."}
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" variant="secondary" className="bg-white text-[#2C4835] hover:bg-green-50 rounded-full font-serif" asChild>
                  <Link href="/family/tree">
                    <TreePine className="mr-2 h-5 w-5" />
                    View MAI Tree
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 rounded-full font-serif bg-transparent" asChild>
                  <Link href="/family/invite">
                    <Plus className="mr-2 h-5 w-5" />
                    Invite Member
                  </Link>
                </Button>
                <CreateHubButton />
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
      <section id="traditions">
        <TraditionsSection traditions={data.traditions} userId={data.currentUserId} />
      </section>

      {/* Family Goals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">{getHubLabel(data.hubType)} Goals</h2>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/goals">
              {data.goals.length > 0 ? (
                <>
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-3 w-3" />
                  Set a Goal
                </>
              )}
            </Link>
          </Button>
        </div>

        {data.goals.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.goals.map((goal) => {
              const pct = goal.target_count > 0 ? Math.round((goal.current_count / goal.target_count) * 100) : 0;
              const circumference = 2 * Math.PI * 24;
              return (
                <div key={goal.id} className="bg-card rounded-2xl border shadow-sm p-5 flex items-center gap-4">
                  {/* Circular progress */}
                  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
                    <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" className="stroke-muted" />
                    <circle
                      cx="28" cy="28" r="24" fill="none" strokeWidth="4"
                      className="stroke-emerald-500"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - pct / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 28 28)"
                    />
                    <text x="28" y="28" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[11px] font-semibold">
                      {pct}%
                    </text>
                  </svg>

                  {/* Text + bar */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{goal.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {goal.current_count}/{goal.target_count}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No goals yet. Set a {data.hubType === "circle" ? "circle" : "family"} goal to track your legacy-building progress!
            </p>
          </div>
        )}
      </section>

      {/* Feature Cards (Recipes, Skills, Lessons) */}
      <section>
        <FeatureCards entryCounts={data.entryCounts} />
      </section>
    </div>
    </HubContentWrapper>
  );
}
