import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  MessageCircle,
  Users,
  Plus,
  ArrowRight,
  Target,
  Sparkles,
  Utensils,
  History,
  Upload,
  TreePine,
  CalendarDays,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getFamilyContext } from "@/lib/get-family-context";
import { LegacyCarousel } from "@/components/legacy-carousel";
import { GriotWidget } from "@/components/griot-widget";
import { GriotGapSuggestions } from "@/components/griot-gap-suggestions";

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------
const MOCK_STATS = [
  { label: "Family Members", value: 5, icon: Users, href: "/family/settings" },
  { label: "Griot Chats", value: 8, icon: MessageCircle, href: "/griot" },
  { label: "Entries", value: 24, icon: BookOpen, href: "/entries" },
  { label: "Traditions", value: 3, icon: Heart, href: "/family" },
  { label: "Goals", value: 2, icon: Target, href: "/goals" },
  { label: "Events", value: 4, icon: CalendarDays, href: "/family" },
];

const MOCK_RECENT_ENTRIES = [
  {
    id: "1",
    title: "Grandma Rose's Sweet Potato Pie",
    type: "recipe" as const,
    author: "Auntie Mae",
    date: "2 hours ago",
  },
  {
    id: "2",
    title: "How Dad Fixed Everything with WD-40 and Duct Tape",
    type: "skill" as const,
    author: "Marcus Jr.",
    date: "Yesterday",
  },
  {
    id: "3",
    title: "The Summer We Drove to Mississippi",
    type: "story" as const,
    author: "Kobe Powell",
    date: "2 days ago",
  },
  {
    id: "4",
    title: "Uncle Ray's BBQ Rub Secret",
    type: "recipe" as const,
    author: "Ray Powell",
    date: "3 days ago",
  },
];

const MOCK_FAMILY_MEMBERS = [
  { name: "Kobe Powell", initials: "KP", role: "admin" },
  { name: "Auntie Mae", initials: "AM", role: "member" },
  { name: "Marcus Jr.", initials: "MJ", role: "member" },
  { name: "Ray Powell", initials: "RP", role: "member" },
  { name: "Lisa Powell", initials: "LP", role: "member" },
];

const typeColors: Record<string, string> = {
  story: "bg-blue-100 text-blue-800",
  skill: "bg-green-100 text-green-800",
  recipe: "bg-orange-100 text-orange-800",
  lesson: "bg-purple-100 text-purple-800",
  connection: "bg-pink-100 text-pink-800",
  general: "bg-gray-100 text-gray-800",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getDashboardData() {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return null;
    const { userId, familyId, supabase, connectedUserIds } = ctx;

    const sb = supabase;

    // Get display name for this family
    const { data: memberInfo } = await sb
      .from("family_members")
      .select("display_name, role")
      .eq("user_id", userId)
      .eq("family_id", familyId)
      .single();

    const displayName = memberInfo?.display_name ?? "User";

    const [
      entriesCount,
      griotCount,
      membersCount,
      eventsCount,
      traditionsCount,
      recentEntriesResult,
      familyMembersResult,
      familyResult,
      entryTypesResult,
      goalsResult,
      carouselRecipes,
      carouselStories,
      carouselSkills,
    ] = await Promise.all([
      sb.from("entries").select("id", { count: "exact", head: true }).eq("family_id", familyId).in("author_id", connectedUserIds),
      sb.from("griot_conversations").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      sb.from("family_tree_members").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      sb.from("family_events").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      sb.from("family_traditions").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      sb
        .from("entries")
        .select("id, title, type, created_at, author_id")
        .eq("family_id", familyId)
        .in("author_id", connectedUserIds)
        .order("created_at", { ascending: false })
        .limit(4),
      sb
        .from("family_tree_members")
        .select("id, display_name, relationship_label, avatar_url")
        .eq("family_id", familyId)
        .order("created_at", { ascending: true }),
      sb.from("families").select("name").eq("id", familyId).single(),
      sb
        .from("entries")
        .select("type, author_id")
        .eq("family_id", familyId)
        .in("author_id", connectedUserIds),
      sb
        .from("family_goals")
        .select("id, title, target_count, current_count, status")
        .eq("family_id", familyId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3),
      // Carousel: fetch recent entries by type with content + structured_data for images
      sb
        .from("entries")
        .select("id, title, content, structured_data")
        .eq("family_id", familyId)
        .eq("type", "recipe")
        .in("author_id", connectedUserIds)
        .order("created_at", { ascending: false })
        .limit(10),
      sb
        .from("entries")
        .select("id, title, content, structured_data")
        .eq("family_id", familyId)
        .eq("type", "story")
        .in("author_id", connectedUserIds)
        .order("created_at", { ascending: false })
        .limit(10),
      sb
        .from("entries")
        .select("id, title, content, structured_data")
        .eq("family_id", familyId)
        .eq("type", "skill")
        .in("author_id", connectedUserIds)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Build author name map from connected family members
    const authorNameMap: Record<string, string> = {};
    // Fetch a lookup of user_id → display_name for connected members
    const { data: memberLookup } = await sb
      .from("family_members")
      .select("user_id, display_name")
      .eq("family_id", familyId)
      .in("user_id", connectedUserIds);
    for (const m of memberLookup ?? []) {
      if (m.user_id && m.display_name) authorNameMap[m.user_id] = m.display_name;
    }

    // Aggregate entry type counts for Legacy Board
    const allEntries: Array<{
      type: string;
      author_id: string;
    }> = entryTypesResult.data ?? [];

    const typeCounts: Record<string, number> = {};
    const authorCounts: Record<string, { name: string; count: number }> = {};

    for (const entry of allEntries) {
      typeCounts[entry.type] = (typeCounts[entry.type] ?? 0) + 1;

      // Count contributions per author
      const authorName = authorNameMap[entry.author_id] ?? "Unknown";
      if (!authorCounts[entry.author_id]) {
        authorCounts[entry.author_id] = { name: authorName, count: 0 };
      }
      authorCounts[entry.author_id].count += 1;
    }

    // Find top contributor
    let topContributor: { name: string; count: number } | undefined;
    for (const ac of Object.values(authorCounts)) {
      if (!topContributor || ac.count > topContributor.count) {
        topContributor = { name: ac.name, count: ac.count };
      }
    }

    // Build carousel entries — extract first image from structured_data
    function toCarouselEntries(
      rawEntries: Array<{
        id: string;
        title: string;
        content: string;
        structured_data?: unknown;
      }>
    ) {
      return (rawEntries ?? []).map((e) => {
        const sd = e.structured_data as { data?: { images?: string[] } } | null;
        return {
          id: e.id,
          title: e.title,
          content: e.content?.slice(0, 200) ?? "",
          image: sd?.data?.images?.[0] ?? null,
        };
      });
    }

    return {
      userId,
      displayName,
      familyName: familyResult.data?.name ?? "Your Family",
      stats: {
        entries: entriesCount.count ?? 0,
        griotChats: griotCount.count ?? 0,
        members: membersCount.count ?? 0,
        events: eventsCount.count ?? 0,
        traditions: traditionsCount.count ?? 0,
      },
      recentEntries: recentEntriesResult.data ?? [],
      treeMembers: familyMembersResult.data ?? [],
      goals: goalsResult.data ?? [],
      authorNameMap,
      entryTypeCounts: {
        recipe: typeCounts["recipe"] ?? 0,
        story: typeCounts["story"] ?? 0,
        skill: typeCounts["skill"] ?? 0,
        lesson: typeCounts["lesson"] ?? 0,
      },
      topContributor,
      carousel: {
        recipes: toCarouselEntries(carouselRecipes.data ?? []),
        stories: toCarouselEntries(carouselStories.data ?? []),
        skills: toCarouselEntries(carouselSkills.data ?? []),
      },
    };
  } catch (err) {
    console.error("Dashboard data fetch failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------
export default async function DashboardPage() {
  // Redirect to onboarding if user has no family
  const ctx = await getFamilyContext();
  if (!ctx) {
    redirect("/onboarding");
  }

  const data = await getDashboardData();

  // Resolve 6 stats
  const stats = data
    ? [
        { label: "Family Members", value: data.stats.members, icon: Users, href: "/family/settings" },
        { label: "Griot Chats", value: data.stats.griotChats, icon: MessageCircle, href: "/griot" },
        { label: "Entries", value: data.stats.entries, icon: BookOpen, href: "/entries" },
        { label: "Traditions", value: data.stats.traditions, icon: Heart, href: "/family" },
        { label: "Goals", value: (data.goals ?? []).length, icon: Target, href: "/goals" },
        { label: "Events", value: data.stats.events, icon: CalendarDays, href: "/family" },
      ]
    : MOCK_STATS;

  // Resolve recent entries
  const recentEntries = data
    ? data.recentEntries.map(
        (entry: {
          id: string;
          title: string;
          type: string;
          created_at: string;
          author_id: string;
        }) => ({
          id: entry.id,
          title: entry.title,
          type: entry.type,
          author: data.authorNameMap[entry.author_id] ?? "Unknown",
          date: timeAgo(entry.created_at),
        })
      )
    : MOCK_RECENT_ENTRIES;

  // Resolve tree members sorted by relationship priority
  const RELATIONSHIP_ORDER: Record<string, number> = {
    Mother: 1, Father: 2,
    Brother: 3, Sister: 3,
    Son: 4, Daughter: 4,
    Grandmother: 5, Grandfather: 5,
    Aunt: 6, Uncle: 6,
    Cousin: 7,
    Niece: 8, Nephew: 8,
    Spouse: 9, Partner: 9,
    Grandson: 10, Granddaughter: 10,
    Other: 11,
  };

  const familyMembers = data
    ? (data.treeMembers as Array<{ id: string; display_name: string; relationship_label: string | null; avatar_url: string | null }>)
        .map((m) => ({
          name: m.display_name,
          initials: getInitials(m.display_name),
          role: m.relationship_label ?? "",
          sortOrder: RELATIONSHIP_ORDER[m.relationship_label ?? ""] ?? 99,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : MOCK_FAMILY_MEMBERS;

  // Resolve welcome name
  const welcomeName = data?.displayName
    ? data.displayName.split(" ")[0]
    : "Kobe";

  const rawFamilyName = data?.familyName ?? "Powell Family";
  // Strip leading "The " so templates like "The {name} Legacy Board" don't
  // render as "The The Powells Legacy Board" when the stored name is "The Powells".
  const familyName = rawFamilyName.replace(/^The\s+/i, "");

  const userId = data?.userId;
  const goals = data?.goals ?? [];

  // Carousel data
  const carouselData = data?.carousel ?? { recipes: [], stories: [], skills: [] };

  return (
    <div className="p-6 space-y-6">
      {/* Compact Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6 shadow-sm border" data-tour-step="dashboard-welcome">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/5727909/pexels-photo-5727909.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Happy Black family together at home"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
        </div>

        <div className="relative z-10 p-6 md:p-10 min-h-[220px] md:min-h-[380px] flex items-end">
          <div className="bg-background/95 backdrop-blur-md p-5 md:p-7 rounded-xl max-w-xl shadow-xl ml-0 md:ml-4 border border-border/50">
            <h1 className="text-3xl md:text-4xl font-bold font-serif mb-3 text-foreground tracking-tight leading-tight">
              Welcome back,<br />{welcomeName}.
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mb-4 font-serif italic">
              The {familyName} knowledge base is growing. What will you preserve today?
            </p>
            <Button size="lg" className="rounded-full shadow-lg h-11 px-7 font-serif text-sm" asChild>
              <Link href="/entries/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Goal Statement + 6-Stat Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Personal Family Goal */}
        <div className="lg:col-span-2 p-10 md:p-14 flex flex-col justify-center bg-card rounded-2xl border shadow-sm">
          <p className="text-sm uppercase tracking-widest text-orange-600 dark:text-orange-400 font-semibold mb-4">
            Family Goal
          </p>
          {goals.length > 0 ? (
            <>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight mb-6">
                {goals[0].title}
              </h2>
              {goals[0].target_count > 0 && (
                <div className="mb-6">
                  <div className="w-full bg-orange-200/40 dark:bg-orange-900/30 rounded-full h-2 mb-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((goals[0].current_count / goals[0].target_count) * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goals[0].current_count} / {goals[0].target_count} completed
                  </p>
                </div>
              )}
              <Button variant="outline" className="w-fit rounded-full border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30" asChild>
                <Link href="/goals">
                  <Target className="mr-2 h-4 w-4" />
                  View Goals
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight mb-4">
                Set your family&apos;s first goal.
              </h2>
              <p className="text-base text-muted-foreground mb-6 font-serif italic">
                What does your family want to accomplish together?
              </p>
              <Button variant="outline" className="w-fit rounded-full border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30" asChild>
                <Link href="/goals">
                  <Plus className="mr-2 h-4 w-4" />
                  Set a Goal
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Right: 3x2 Stat Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group flex flex-col items-center justify-center text-center p-6 md:p-8 bg-card rounded-2xl border shadow-sm hover:bg-accent/50 transition-colors"
            >
              <stat.icon className="h-7 w-7 text-orange-500/70 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
              <p className="text-4xl md:text-5xl font-bold font-serif text-foreground tracking-tighter">
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mt-1">
                {stat.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Getting Started — shown when dashboard is empty */}
      {data && data.stats.entries === 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Get Started Building Your Legacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your family&apos;s knowledge base is empty — here are some great first steps:
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                href="/entries/new"
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2 shrink-0">
                  <Utensils className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Add a Family Recipe</p>
                  <p className="text-xs text-muted-foreground">Preserve a dish everyone loves</p>
                </div>
              </Link>
              <Link
                href="/entries/new"
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 shrink-0">
                  <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Write a Family Story</p>
                  <p className="text-xs text-muted-foreground">Capture a memory before it fades</p>
                </div>
              </Link>
              <Link
                href="/entries/import-interview"
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 shrink-0">
                  <Upload className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Import an Interview</p>
                  <p className="text-xs text-muted-foreground">Record an elder, then upload the transcript</p>
                </div>
              </Link>
              <Link
                href="/family/tree"
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 shrink-0">
                  <TreePine className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Build the MAI Tree</p>
                  <p className="text-xs text-muted-foreground">Map out your family&apos;s lineage</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy Carousel */}
      <LegacyCarousel
        recipes={carouselData.recipes}
        stories={carouselData.stories}
        skills={carouselData.skills}
        familyName={familyName}
      />

      {/* Griot Widget */}
      <GriotWidget />

      {/* Griot Gap Suggestions — surfaces missing entry types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Your family&apos;s knowledge gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GriotGapSuggestions showHeading={false} />
        </CardContent>
      </Card>

      {/* Recent Entries + Family Members — side by side, equal height */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Entries */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Entries</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/entries">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 flex-1">
            {recentEntries.map(
              (
                entry: {
                  id: string;
                  title: string;
                  type: string;
                  author: string;
                  date: string;
                },
                i: number
              ) => (
                <div key={entry.id}>
                  <Link
                    href={`/entries/${entry.id}`}
                    className="flex items-center justify-between py-3 hover:bg-accent/50 rounded-md px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="secondary"
                        className={`${typeColors[entry.type] ?? typeColors.general} shrink-0 text-xs`}
                      >
                        {entry.type}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {entry.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {entry.author}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {entry.date}
                    </span>
                  </Link>
                  {i < recentEntries.length - 1 && <Separator />}
                </div>
              )
            )}
            {recentEntries.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No entries yet. Start preserving your family&apos;s knowledge!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Family Members — 3-column grid */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Family Members</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/family/invite">
                <Plus className="mr-1 h-3 w-3" />
                Invite
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {familyMembers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {familyMembers.slice(0, 9).map(
                  (member: { name: string; initials: string; role: string }, idx: number) => (
                    <div
                      key={`${member.name}-${idx}`}
                      className="flex flex-col items-center text-center gap-1.5 py-2"
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="text-sm font-medium">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="w-full">
                        <p className="text-xs font-medium truncate">
                          {member.name.split(" ")[0]}
                        </p>
                        {member.role && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {member.role}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No members yet. Invite your family!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
