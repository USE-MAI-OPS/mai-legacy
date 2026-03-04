import Link from "next/link";
import {
  BookOpen,
  MessageCircle,
  GraduationCap,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  CalendarHeart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------
const MOCK_STATS = [
  { label: "Total Entries", value: 24, icon: BookOpen, href: "/entries" },
  { label: "Griot Chats", value: 8, icon: MessageCircle, href: "/griot" },
  { label: "Tutorials", value: 4, icon: GraduationCap, href: "/tutorials" },
  { label: "Members", value: 5, icon: Users, href: "/family/settings" },
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

const MOCK_TRADITIONS = [
  {
    id: "1",
    name: "Sunday Family Dinner",
    frequency: "Weekly",
    description: "Everyone gathers at Grandma's house for a big family meal.",
  },
  {
    id: "2",
    name: "Annual Family Reunion",
    frequency: "Annual",
    description: "Third Saturday of July — potluck, games, and storytelling.",
  },
  {
    id: "3",
    name: "Christmas Eve Stories",
    frequency: "Annual",
    description: "Elders share family stories by the fireplace on Christmas Eve.",
  },
  {
    id: "4",
    name: "New Year's Cornbread",
    frequency: "Annual",
    description: "Everyone eats Grandma Mae's cornbread for good luck.",
  },
  {
    id: "5",
    name: "Saturday Morning Chores",
    frequency: "Weekly",
    description: "Kids help with yard work and learn home repair skills.",
  },
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
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Get the user's family membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership, error: memberError } = await (supabase as any)
      .from("family_members")
      .select("family_id, display_name, role")
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return null;
    }

    const familyId = membership.family_id;
    const displayName = membership.display_name;

    // Fetch all stats in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const [
      entriesCount,
      griotCount,
      tutorialsCount,
      membersCount,
      recentEntriesResult,
      familyMembersResult,
      familyResult,
    ] = await Promise.all([
      sb.from("entries").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      sb.from("griot_conversations").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      sb.from("skill_tutorials").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      sb.from("family_members").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      sb
        .from("entries")
        .select("id, title, type, created_at, author_id, family_members!entries_author_id_fkey(display_name)")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(4),
      sb
        .from("family_members")
        .select("display_name, role")
        .eq("family_id", familyId)
        .order("joined_at", { ascending: true }),
      sb.from("families").select("name").eq("id", familyId).single(),
    ]);

    return {
      displayName,
      familyName: familyResult.data?.name ?? "Your Family",
      stats: {
        entries: entriesCount.count ?? 0,
        griotChats: griotCount.count ?? 0,
        tutorials: tutorialsCount.count ?? 0,
        members: membersCount.count ?? 0,
      },
      recentEntries: recentEntriesResult.data ?? [],
      familyMembers: familyMembersResult.data ?? [],
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
  const data = await getDashboardData();

  // Resolve stats
  const stats = data
    ? [
        { label: "Total Entries", value: data.stats.entries, icon: BookOpen, href: "/entries" },
        { label: "Griot Chats", value: data.stats.griotChats, icon: MessageCircle, href: "/griot" },
        { label: "Tutorials", value: data.stats.tutorials, icon: GraduationCap, href: "/tutorials" },
        { label: "Members", value: data.stats.members, icon: Users, href: "/family/settings" },
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
          family_members: { display_name: string } | { display_name: string }[] | null;
        }) => {
          // Supabase join can return an object or array depending on the FK shape
          const authorJoin = entry.family_members;
          const authorName = Array.isArray(authorJoin)
            ? authorJoin[0]?.display_name ?? "Unknown"
            : (authorJoin as { display_name: string } | null)?.display_name ?? "Unknown";
          return {
            id: entry.id,
            title: entry.title,
            type: entry.type,
            author: authorName,
            date: timeAgo(entry.created_at),
          };
        }
      )
    : MOCK_RECENT_ENTRIES;

  // Resolve family members
  const familyMembers = data
    ? data.familyMembers.map(
        (m: { display_name: string; role: string }) => ({
          name: m.display_name,
          initials: getInitials(m.display_name),
          role: m.role,
        })
      )
    : MOCK_FAMILY_MEMBERS;

  // Resolve welcome name
  const welcomeName = data?.displayName
    ? data.displayName.split(" ")[0]
    : "Kobe";

  const familyName = data?.familyName ?? "Powell Family";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {welcomeName}</h1>
          <p className="text-muted-foreground mt-1">
            The {familyName} knowledge base is growing.
          </p>
        </div>
        <Button asChild>
          <Link href="/entries/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                  <stat.icon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Family Traditions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarHeart className="h-5 w-5 text-pink-500" />
            Family Traditions
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/entries/new">
              <Plus className="mr-1 h-3 w-3" />
              Add Tradition
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOCK_TRADITIONS.map((tradition) => (
              <div
                key={tradition.id}
                className="rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-medium">{tradition.name}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                    {tradition.frequency}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tradition.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Entries */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Entries</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/entries">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
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
        </div>

        {/* Family Members + Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Family Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {familyMembers.map(
                (member: { name: string; initials: string; role: string }) => (
                  <div
                    key={member.name}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.name}
                      </p>
                    </div>
                    {member.role === "admin" && (
                      <Badge variant="outline" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                )
              )}
              {familyMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  No members found.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                asChild
              >
                <Link href="/family/invite">
                  <Plus className="mr-2 h-3 w-3" />
                  Invite Member
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ask the Griot</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Ask your family&apos;s AI anything about your collective knowledge.
              </p>
              <Button className="w-full" asChild>
                <Link href="/griot">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Start a Conversation
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
