import Link from "next/link";
import {
  CalendarHeart,
  Users,
  Heart,
  MapPin,
  Briefcase,
  GraduationCap,
  Plus,
  ArrowRight,
  Phone,
  AlertCircle,
  BookOpen,
  Star,
  Mic,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getFamilyContext } from "@/lib/get-family-context";
import { normalizeLifeStory } from "@/types/database";
import type { LifeStory } from "@/types/database";

// ---------------------------------------------------------------------------
// Mock data (fallback when DB is empty)
// ---------------------------------------------------------------------------
const MOCK_TRADITIONS = [
  {
    id: "1",
    name: "Sunday Family Dinner",
    frequency: "Weekly",
    description: "Everyone gathers at Grandma's house for a big family meal.",
    emoji: "🍽️",
  },
  {
    id: "2",
    name: "Annual Family Reunion",
    frequency: "Annual",
    description: "Third Saturday of July — potluck, games, and storytelling.",
    emoji: "🎉",
  },
  {
    id: "3",
    name: "Christmas Eve Stories",
    frequency: "Annual",
    description: "Elders share family stories by the fireplace on Christmas Eve.",
    emoji: "📖",
  },
  {
    id: "4",
    name: "New Year's Cornbread",
    frequency: "Annual",
    description: "Everyone eats Grandma Mae's cornbread for good luck.",
    emoji: "🌽",
  },
  {
    id: "5",
    name: "Saturday Morning Chores",
    frequency: "Weekly",
    description: "Kids help with yard work and learn home repair skills.",
    emoji: "🔧",
  },
  {
    id: "6",
    name: "Birthday Phone Calls",
    frequency: "As Needed",
    description: "The whole family calls to sing happy birthday — no exceptions.",
    emoji: "🎂",
  },
];

const MOCK_NEEDED_INFO = [
  {
    id: "1",
    title: "Family Doctor",
    value: "Dr. Patricia Williams",
    detail: "(901) 555-0123",
    icon: Phone,
  },
  {
    id: "2",
    title: "Insurance Policy",
    value: "State Farm #PL-4492871",
    detail: "Agent: Robert Taylor",
    icon: AlertCircle,
  },
  {
    id: "3",
    title: "Family Recipe Book",
    value: "Google Drive shared folder",
    detail: "47 recipes documented",
    icon: BookOpen,
  },
  {
    id: "4",
    title: "WiFi Password",
    value: "Grandma's House",
    detail: "powell_family_2024",
    icon: Star,
  },
];

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

/** Get the most recent career item — "Present" jobs first, then by start year descending. */
function getMostRecentCareer(career: { title: string; company: string; years: string }[]) {
  if (career.length === 0) return null;
  if (career.length === 1) return career[0];

  return [...career].sort((a, b) => {
    const aPresent = /present/i.test(a.years);
    const bPresent = /present/i.test(b.years);
    if (aPresent && !bPresent) return -1;
    if (!aPresent && bPresent) return 1;

    // Extract start year for comparison
    const aYear = parseInt(a.years.match(/\d{4}/)?.[0] ?? "0", 10);
    const bYear = parseInt(b.years.match(/\d{4}/)?.[0] ?? "0", 10);
    return bYear - aYear;
  })[0];
}

function getStoryHighlight(story: LifeStory): string {
  const parts: string[] = [];
  if (story.places.length > 0) {
    parts.push(`From ${story.places[0].city}, ${story.places[0].state}`);
  }
  const recentJob = getMostRecentCareer(story.career);
  if (recentJob) {
    parts.push(recentJob.title);
  }
  if (story.skills.length > 0) {
    parts.push(`${story.skills.length} skill${story.skills.length !== 1 ? "s" : ""}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Tap to add your story";
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
interface FamilyMemberData {
  id: string;
  display_name: string;
  role: string;
  avatar_url: string | null;
  joined_at: string;
  life_story: LifeStory | null;
  user_id: string;
}

async function getFamilyData() {
  try {
    const ctx = await getFamilyContext();
    if (!ctx) return null;
    const { userId, familyId, supabase } = ctx;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const [familyResult, membersResult] = await Promise.all([
      sb.from("families").select("name").eq("id", familyId).single(),
      sb
        .from("family_members")
        .select("id, display_name, role, avatar_url, joined_at, life_story, user_id")
        .eq("family_id", familyId)
        .order("joined_at", { ascending: true }),
    ]);

    return {
      familyName: familyResult.data?.name ?? "Your Family",
      members: (membersResult.data as FamilyMemberData[]) ?? [],
      currentUserId: userId,
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

  const familyName = data?.familyName ?? "Powell Family";
  const members: FamilyMemberData[] = data?.members ?? [];
  const hasMockMembers = members.length === 0;

  // Mock members for demo
  const displayMembers: FamilyMemberData[] = hasMockMembers
    ? [
        {
          id: "1",
          display_name: "Kobe Powell",
          role: "admin",
          avatar_url: null,
          joined_at: "2024-08-15T00:00:00Z",
          user_id: "u1",
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
        },
        {
          id: "2",
          display_name: "Grandma Rose",
          role: "member",
          avatar_url: null,
          joined_at: "2024-08-16T00:00:00Z",
          user_id: "u2",
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
        },
        {
          id: "3",
          display_name: "Uncle Ray",
          role: "member",
          avatar_url: null,
          joined_at: "2024-08-17T00:00:00Z",
          user_id: "u3",
          life_story: {
            career: [{ title: "BBQ Pitmaster", company: "Ray's Smokehouse", years: "1995 - Present" }],
            places: [{ city: "Memphis", state: "TN", years: "1960 - Present" }],
            education: [],
            skills: ["BBQ", "Smoking Meats", "Guitar"],
            hobbies: ["Fishing", "Blues Music"],
            military: { branch: "U.S. Army", rank: "Corporal", years: "1980 - 1984" },
            milestones: [],
          },
        },
      ]
    : members;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            {familyName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {displayMembers.length} member{displayMembers.length !== 1 ? "s" : ""} · Your family hub
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/family/invite">
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Link>
        </Button>
      </div>

      {/* People & Profiles Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            People & Stories
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMembers.map((member) => {
            const story = normalizeLifeStory(member.life_story);
            return (
              <Card
                key={member.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  {/* Member header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
                        {getInitials(member.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {member.display_name}
                        </p>
                        {member.role === "admin" && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getStoryHighlight(story)}
                      </p>
                    </div>
                  </div>

                  <Separator className="mb-3" />

                  {/* Story preview */}
                  {(story.places.length > 0 || story.career.length > 0 || story.education.length > 0 || story.skills.length > 0 || story.hobbies.length > 0) && (
                    <div className="space-y-2">
                      {story.places.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          <span>
                            {story.places
                              .slice(0, 2)
                              .map((p) => `${p.city}, ${p.state}`)
                              .join(" → ")}
                          </span>
                        </div>
                      )}
                      {story.career.length > 0 && (() => {
                        const job = getMostRecentCareer(story.career);
                        return job ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Briefcase className="size-3" />
                            <span>{job.title} at {job.company}</span>
                          </div>
                        ) : null;
                      })()}
                      {story.education.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <GraduationCap className="size-3" />
                          <span>{story.education[0].school}</span>
                        </div>
                      )}
                      {(story.skills.length > 0 || story.hobbies.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {[...story.skills, ...story.hobbies].slice(0, 4).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {[...story.skills, ...story.hobbies].length > 4 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              +{[...story.skills, ...story.hobbies].length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs gap-1"
                      asChild
                    >
                      <Link
                        href={
                          data?.currentUserId === member.user_id
                            ? "/profile"
                            : `/family/member/${member.id}`
                        }
                      >
                        View Full Story
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      asChild
                    >
                      <Link href={`/entries/import-interview?member=${member.id}`}>
                        <Mic className="size-3" />
                        Interview
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Traditions Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarHeart className="h-5 w-5 text-pink-500" />
            Family Traditions
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/entries/new">
              <Plus className="mr-1 h-3 w-3" />
              Add Tradition
            </Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_TRADITIONS.map((tradition) => (
            <Card
              key={tradition.id}
              className="hover:shadow-sm transition-shadow"
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tradition.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-medium truncate">
                        {tradition.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0"
                      >
                        {tradition.frequency}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tradition.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Needed Info Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Need to Know
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/entries/new">
              <Plus className="mr-1 h-3 w-3" />
              Add Info
            </Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {MOCK_NEEDED_INFO.map((info) => (
            <Card
              key={info.id}
              className="hover:shadow-sm transition-shadow"
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <info.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {info.title}
                    </p>
                    <p className="text-sm font-medium">{info.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {info.detail}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
