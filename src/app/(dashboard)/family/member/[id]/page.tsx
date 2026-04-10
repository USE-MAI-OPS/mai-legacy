import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  BookOpen,
  CalendarDaysIcon,
  ChevronRight,
  FileTextIcon,
  GraduationCap,
  Heart,
  LayersIcon,
  Lightbulb,
  MapPin,
  Medal,
  Utensils,
  Wrench,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { normalizeLifeStory } from "@/types/database";
import type { LifeStory } from "@/types/database";

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
}

const typeColors: Record<string, string> = {
  story: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  recipe: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  skill: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  lesson: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  connection: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

// ---------------------------------------------------------------------------
// UUID validation
// ---------------------------------------------------------------------------
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Mock member data (for non-UUID ids)
// ---------------------------------------------------------------------------
interface MockMember {
  id: string;
  display_name: string;
  role: string;
  avatar_url: string | null;
  joined_at: string;
  life_story: LifeStory;
  entries: { id: string; title: string; type: string; created_at: string }[];
}

const MOCK_MEMBERS: Record<string, MockMember> = {
  "1": {
    id: "1",
    display_name: "Kobe Powell",
    role: "admin",
    avatar_url: null,
    joined_at: "2024-08-15T00:00:00Z",
    life_story: {
      career: [
        { title: "Software Engineer", company: "Tech Solutions", years: "2020 - Present" },
      ],
      places: [{ city: "Atlanta", state: "GA", years: "2020 - Present" }],
      education: [{ school: "Georgia Tech", degree: "B.S. Computer Science", year: "2016" }],
      skills: ["Coding", "Woodworking", "Grilling"],
      hobbies: ["Photography", "Fishing"],
      military: null,
      milestones: [{ event: "First child born", year: "2022" }],
    },
    entries: [
      { id: "1", title: "Grandma Rosa's Sunday Gravy", type: "recipe", created_at: "2025-12-15T10:30:00Z" },
      { id: "3", title: "Building a Raised Garden Bed", type: "skill", created_at: "2025-11-20T09:15:00Z" },
    ],
  },
  "2": {
    id: "2",
    display_name: "Grandma Rose",
    role: "member",
    avatar_url: null,
    joined_at: "2024-08-16T00:00:00Z",
    life_story: {
      career: [
        { title: "School Teacher", company: "Memphis Public Schools", years: "1970 - 2005" },
      ],
      places: [
        { city: "Memphis", state: "TN", years: "1950 - Present" },
        { city: "Jackson", state: "MS", years: "1948 - 1950" },
      ],
      education: [],
      skills: ["Cooking", "Gardening", "Sewing", "Quilting"],
      hobbies: ["Church Choir", "Reading"],
      military: null,
      milestones: [
        { event: "Married James Powell", year: "1968" },
        { event: "Started Sunday dinner tradition", year: "1972" },
      ],
    },
    entries: [
      { id: "7", title: "Mom's Cornbread Recipe", type: "recipe", created_at: "2025-08-15T13:20:00Z" },
      { id: "2", title: "How Dad Fixed Anything with Duct Tape", type: "story", created_at: "2025-11-28T14:00:00Z" },
    ],
  },
  "3": {
    id: "3",
    display_name: "Uncle Ray",
    role: "member",
    avatar_url: null,
    joined_at: "2024-08-17T00:00:00Z",
    life_story: {
      career: [{ title: "BBQ Pitmaster", company: "Ray's Smokehouse", years: "1995 - Present" }],
      places: [{ city: "Memphis", state: "TN", years: "1960 - Present" }],
      education: [],
      skills: ["BBQ", "Smoking Meats", "Guitar"],
      hobbies: ["Fishing", "Blues Music"],
      military: { branch: "U.S. Army", rank: "Corporal", years: "1980 - 1984" },
      milestones: [],
    },
    entries: [
      { id: "4", title: "Always Negotiate Your First Offer", type: "lesson", created_at: "2025-10-05T16:45:00Z" },
      { id: "8", title: "How Great-Grandpa Came to America", type: "story", created_at: "2025-07-04T10:00:00Z" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getMemberData(memberId: string) {
  // If the id is not a valid UUID, use mock data
  if (!UUID_REGEX.test(memberId)) {
    return MOCK_MEMBERS[memberId] ?? null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return MOCK_MEMBERS[memberId] ?? null;

    const sb = supabase;

    // Get the current user's family
    const { data: currentMembership } = await sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (!currentMembership) return null;

    // Get the target member
    const { data: member, error: memberError } = await sb
      .from("family_members")
      .select("id, display_name, role, avatar_url, joined_at, life_story, user_id")
      .eq("id", memberId)
      .eq("family_id", currentMembership.family_id)
      .single();

    if (memberError || !member) return null;

    // Get their entries
    const { data: entries } = await sb
      .from("entries")
      .select("id, title, type, created_at")
      .eq("family_id", currentMembership.family_id)
      .eq("author_id", member.user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get distinct entry types
    const { data: typesData } = await sb
      .from("entries")
      .select("type")
      .eq("family_id", currentMembership.family_id)
      .eq("author_id", member.user_id);

    const distinctTypes = typesData
      ? [...new Set(typesData.map((t: { type: string }) => t.type))]
      : [];

    // Count entries
    const { count: entriesCount } = await sb
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("family_id", currentMembership.family_id)
      .eq("author_id", member.user_id);

    return {
      id: member.id as string,
      display_name: member.display_name as string,
      role: member.role as string,
      avatar_url: member.avatar_url as string | null,
      joined_at: member.joined_at as string,
      life_story: normalizeLifeStory(member.life_story),
      entries: (entries ?? []) as { id: string; title: string; type: string; created_at: string }[],
      entriesCount: (entriesCount ?? 0) as number,
      typesContributed: distinctTypes as string[],
    };
  } catch (err) {
    console.error("Failed to fetch member data:", err);
    return MOCK_MEMBERS[memberId] ?? null;
  }
}

// ---------------------------------------------------------------------------
// Entry type icons & colors
// ---------------------------------------------------------------------------
const typeIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  story: { icon: BookOpen, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/40" },
  recipe: { icon: Utensils, color: "text-red-600 bg-red-100 dark:bg-red-900/40" },
  skill: { icon: Wrench, color: "text-green-600 bg-green-100 dark:bg-green-900/40" },
  lesson: { icon: Lightbulb, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
};

function getFirstName(name: string) {
  return name.split(" ")[0];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberData(id);

  if (!member) {
    notFound();
  }

  const story = normalizeLifeStory(member.life_story);
  const entries = member.entries ?? [];
  const entriesCount =
    "entriesCount" in member ? (member.entriesCount as number) : entries.length;
  const typesContributed =
    "typesContributed" in member
      ? (member.typesContributed as string[])
      : [...new Set(entries.map((e) => e.type))];

  const skillsAndHobbies = [...story.skills, ...story.hobbies];
  const firstName = getFirstName(member.display_name);
  const familyName = member.display_name.split(" ").pop() ?? "";

  const hasLifeJourney =
    story.places.length > 0 ||
    story.career.length > 0 ||
    story.education.length > 0 ||
    story.milestones.length > 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link href="/family">
          <ArrowLeft className="size-4 mr-2" />
          Back to Family
        </Link>
      </Button>

      {/* ─── Hero Section ─── */}
      <div className="flex flex-col items-center text-center mb-8">
        <Avatar className="h-28 w-28 ring-2 ring-primary/20 ring-offset-2 ring-offset-background mb-4">
          {member.avatar_url && (
            <AvatarImage src={member.avatar_url} alt={member.display_name} />
          )}
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {getInitials(member.display_name)}
          </AvatarFallback>
        </Avatar>

        <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
          {member.display_name}
        </h1>

        <div className="flex items-center gap-2 mb-2">
          {/* Relationship badge — TODO: map from life_story or tree data */}
          <Badge className="bg-[#C17B54] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#C17B54]/90 border-0">
            {member.role === "admin" ? "Family Admin" : "Member"}
          </Badge>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-widest font-bold">
            {member.role}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Joined {new Date(member.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Entries Created */}
        <Card className="text-center py-6">
          <CardContent className="p-0 flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <FileTextIcon className="h-4.5 w-4.5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold">{entriesCount}</p>
            <p className="text-xs text-muted-foreground">Memories Created</p>
          </CardContent>
        </Card>

        {/* Types Contributed */}
        <Card className="text-center py-6">
          <CardContent className="p-0 flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <LayersIcon className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <p className="text-sm font-bold">{typesContributed.length} Types Contributed</p>
            <div className="flex flex-wrap justify-center gap-1">
              {typesContributed.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={`text-[9px] uppercase tracking-wider font-bold border-0 px-1.5 py-0 ${typeColors[type] || ""}`}
                >
                  {type}s
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills & Hobbies */}
        <Card className="text-center py-6">
          <CardContent className="p-0 flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Wrench className="h-4.5 w-4.5 text-purple-600" />
            </div>
            <p className="text-sm font-bold">Skills & Hobbies</p>
            <p className="text-xs text-muted-foreground">
              {skillsAndHobbies.length > 0
                ? skillsAndHobbies.join(", ")
                : "None listed yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Life Journey ─── */}
      {hasLifeJourney && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
              <span className="text-base">🗺️</span>
              Life Journey
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Places Lived */}
              {story.places.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Places Lived
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-6">
                    {story.places.map((p, i) => (
                      <p key={i} className="text-sm">
                        {p.city}, {p.state}
                        {p.years && <span className="text-muted-foreground"> ({p.years})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Career */}
              {story.career.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Career
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-6">
                    {story.career.map((job, i) => (
                      <p key={i} className="text-sm">
                        {job.title}
                        {job.company && <span className="text-muted-foreground">, {job.years} at {job.company}</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {story.education.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Education
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-6">
                    {story.education.map((edu, i) => (
                      <p key={i} className="text-sm">
                        {edu.school}
                        {edu.degree && <span className="text-muted-foreground">, {edu.degree}</span>}
                        {edu.year && <span className="text-muted-foreground"> ({edu.year})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {story.milestones.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Milestones
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-6">
                    {story.milestones.map((m, i) => (
                      <p key={i} className="text-sm">
                        {m.event}
                        {m.year && <span className="text-muted-foreground"> ({m.year})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Military (if exists) */}
              {story.military && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Medal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Military Service
                    </span>
                  </div>
                  <p className="text-sm ml-6">
                    {story.military.branch}
                    {story.military.rank && <span className="text-muted-foreground"> &mdash; {story.military.rank}</span>}
                    {story.military.years && <span className="text-muted-foreground"> ({story.military.years})</span>}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Recent from [Name] ─── */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Recent from {firstName}
            </h2>
            {entries.length > 0 && (
              <Link
                href="/entries"
                className="text-sm font-medium text-[#C17B54] hover:text-[#C17B54]/80 transition-colors"
              >
                View All
              </Link>
            )}
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No contributions yet.
            </p>
          ) : (
            <div>
              {entries.map((entry, i) => {
                const typeInfo = typeIcons[entry.type] ?? {
                  icon: FileTextIcon,
                  color: "text-gray-600 bg-gray-100 dark:bg-gray-900/40",
                };
                const TypeIcon = typeInfo.icon;

                return (
                  <div key={entry.id}>
                    <Link
                      href={`/entries/${entry.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors group"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeInfo.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {entry.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="secondary"
                            className={`text-[9px] uppercase tracking-wider font-bold border-0 px-1.5 py-0 ${typeColors[entry.type] || ""}`}
                          >
                            {entry.type}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            &middot; {formatRelativeDate(entry.created_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    {i < entries.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Footer ─── */}
      <div className="flex flex-col items-center gap-2 py-6">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-[#C17B54]/30" />
          <Heart className="h-3.5 w-3.5 text-[#C17B54]/40" />
          <div className="h-px w-12 bg-[#C17B54]/30" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Preserving the {familyName} Legacy
        </p>
      </div>
    </div>
  );
}
