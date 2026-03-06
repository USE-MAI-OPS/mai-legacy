import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CalendarDaysIcon,
  FileTextIcon,
  GraduationCap,
  Heart,
  LayersIcon,
  MapPin,
  Medal,
  Wrench,
  BookOpenIcon,
  TagIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/stats-card";
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

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
// Life Story Section (read-only)
// ---------------------------------------------------------------------------
function LifeStoryReadOnly({ story }: { story: LifeStory }) {
  const hasContent =
    story.career.length > 0 ||
    story.places.length > 0 ||
    story.education.length > 0 ||
    story.skills.length > 0 ||
    story.hobbies.length > 0 ||
    story.military !== null ||
    story.milestones.length > 0;

  if (!hasContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="size-4 text-pink-500" />
            Life Story
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            This member hasn&apos;t added their life story yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="size-4 text-pink-500" />
          Life Story
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Places */}
        {story.places.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4 text-muted-foreground" />
              Places Lived
            </div>
            <div className="space-y-1.5 pl-6">
              {story.places.map((place, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">
                    {place.city}, {place.state}
                  </span>
                  {place.years && (
                    <span className="text-muted-foreground ml-2">
                      ({place.years})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Career */}
        {story.career.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="size-4 text-muted-foreground" />
              Career
            </div>
            <div className="space-y-1.5 pl-6">
              {story.career.map((job, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{job.title}</span>
                  {job.company && (
                    <span className="text-muted-foreground">
                      {" "}
                      at {job.company}
                    </span>
                  )}
                  {job.years && (
                    <span className="text-muted-foreground ml-2">
                      ({job.years})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {story.education.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GraduationCap className="size-4 text-muted-foreground" />
              Education
            </div>
            <div className="space-y-1.5 pl-6">
              {story.education.map((edu, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{edu.school}</span>
                  {edu.degree && (
                    <span className="text-muted-foreground">
                      {" "}
                      &mdash; {edu.degree}
                    </span>
                  )}
                  {edu.year && (
                    <span className="text-muted-foreground ml-2">
                      ({edu.year})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Military */}
        {story.military && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Medal className="size-4 text-muted-foreground" />
              Military Service
            </div>
            <div className="text-sm pl-6">
              <span className="font-medium">{story.military.branch}</span>
              {story.military.rank && (
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; {story.military.rank}
                </span>
              )}
              {story.military.years && (
                <span className="text-muted-foreground ml-2">
                  ({story.military.years})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Skills & Hobbies */}
        {(story.skills.length > 0 || story.hobbies.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="size-4 text-muted-foreground" />
              Skills & Interests
            </div>
            <div className="flex flex-wrap gap-1.5 pl-6">
              {story.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {story.hobbies.map((hobby) => (
                <Badge
                  key={hobby}
                  variant="outline"
                  className="text-xs"
                >
                  {hobby}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        {story.milestones.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarDaysIcon className="size-4 text-muted-foreground" />
              Life Milestones
            </div>
            <div className="space-y-1.5 pl-6">
              {story.milestones.map((m, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{m.event}</span>
                  {m.year && (
                    <span className="text-muted-foreground ml-2">
                      ({m.year})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link href="/family">
          <ArrowLeft className="size-4 mr-2" />
          Back to Family
        </Link>
      </Button>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <Avatar className="size-20">
          <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
            {getInitials(member.display_name)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {member.display_name}
            </h1>
            <Badge variant="secondary" className="capitalize text-xs">
              {member.role}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDaysIcon className="size-3.5" />
            Joined {formatDate(member.joined_at)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
        <StatsCard
          label="Entries Created"
          value={entriesCount}
          icon={<FileTextIcon className="size-5" />}
        />
        <StatsCard
          label="Types Contributed"
          value={typesContributed.length}
          icon={<LayersIcon className="size-5" />}
        />
        <StatsCard
          label="Skills & Hobbies"
          value={story.skills.length + story.hobbies.length}
          icon={<Wrench className="size-5" />}
        />
      </div>

      {/* Types contributed */}
      {typesContributed.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TagIcon className="size-4" />
              Types Contributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {typesContributed.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={`capitalize border-0 ${typeColors[type] || ""}`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Life Story (read-only) */}
      <div className="mb-8">
        <LifeStoryReadOnly story={story} />
      </div>

      {/* Recent Contributions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpenIcon className="size-4" />
            Recent Contributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No contributions yet.
            </p>
          ) : (
            <div className="space-y-1">
              {entries.map((entry, i) => (
                <div key={entry.id}>
                  <Link
                    href={`/entries/${entry.id}`}
                    className="flex items-center justify-between py-3 hover:bg-accent/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileTextIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {entry.title}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize border-0 px-1.5 py-0 mt-0.5 ${
                            typeColors[entry.type] || ""
                          }`}
                        >
                          {entry.type}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">
                      {formatRelativeDate(entry.created_at)}
                    </span>
                  </Link>
                  {i < entries.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
