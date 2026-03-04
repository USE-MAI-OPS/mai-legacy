import Link from "next/link";
import {
  BookOpen,
  MessageCircle,
  GraduationCap,
  Users,
  Plus,
  ArrowRight,
  ArrowLeft,
  CalendarHeart,
  Heart,
  MapPin,
  Briefcase,
  Wrench,
  Flag,
  Sparkles,
  Phone,
  AlertCircle,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
const DEMO_STATS = [
  { label: "Total Entries", value: 24, icon: BookOpen },
  { label: "Griot Chats", value: 8, icon: MessageCircle },
  { label: "Tutorials", value: 4, icon: GraduationCap },
  { label: "Members", value: 5, icon: Users },
];

const DEMO_MEMBERS = [
  {
    name: "Kobe Powell",
    initials: "KP",
    role: "admin",
    highlight: "Software Engineer · Atlanta, GA",
    skills: ["Coding", "Woodworking", "Grilling", "Photography"],
  },
  {
    name: "Grandma Rose",
    initials: "GR",
    role: "member",
    highlight: "School Teacher · Memphis, TN",
    skills: ["Cooking", "Gardening", "Sewing", "Quilting"],
  },
  {
    name: "Uncle Ray",
    initials: "UR",
    role: "member",
    highlight: "BBQ Pitmaster · Memphis, TN",
    skills: ["BBQ", "Smoking Meats", "Guitar", "Fishing"],
  },
];

const DEMO_TRADITIONS = [
  { name: "Sunday Family Dinner", frequency: "Weekly", emoji: "🍽️", description: "Everyone gathers at Grandma's house for a big family meal." },
  { name: "Annual Family Reunion", frequency: "Annual", emoji: "🎉", description: "Third Saturday of July — potluck, games, and storytelling." },
  { name: "Christmas Eve Stories", frequency: "Annual", emoji: "📖", description: "Elders share family stories by the fireplace on Christmas Eve." },
  { name: "New Year's Cornbread", frequency: "Annual", emoji: "🌽", description: "Everyone eats Grandma Mae's cornbread for good luck." },
];

const DEMO_ENTRIES = [
  { title: "Grandma Rose's Sweet Potato Pie", type: "recipe", author: "Grandma Rose", date: "2 hours ago" },
  { title: "How Dad Fixed Everything with WD-40", type: "skill", author: "Uncle Ray", date: "Yesterday" },
  { title: "The Summer We Drove to Mississippi", type: "story", author: "Kobe Powell", date: "2 days ago" },
  { title: "Uncle Ray's BBQ Rub Secret", type: "recipe", author: "Uncle Ray", date: "3 days ago" },
];

const DEMO_GRIOT_MESSAGES = [
  { role: "user" as const, content: "What's Grandma Rose's sweet potato pie recipe?" },
  {
    role: "assistant" as const,
    content:
      "Based on your family's entries, Grandma Rose's Sweet Potato Pie calls for 3 large sweet potatoes (boiled and mashed), 1 cup sugar, ½ cup butter, 2 eggs, ½ cup milk, 1 tsp vanilla, ½ tsp cinnamon, and ½ tsp nutmeg. She always says the secret is letting the potatoes cool completely before mixing.",
  },
  { role: "user" as const, content: "When did the Sunday dinner tradition start?" },
  {
    role: "assistant" as const,
    content:
      "According to Grandma Rose's milestone entries, the Sunday Family Dinner tradition started in 1972 — the year after she and Grandpa James bought their house on Maple Street. It's been running every week for over 50 years.",
  },
];

const typeColors: Record<string, string> = {
  story: "bg-blue-100 text-blue-800",
  skill: "bg-green-100 text-green-800",
  recipe: "bg-orange-100 text-orange-800",
  lesson: "bg-purple-100 text-purple-800",
};

// ---------------------------------------------------------------------------
// Demo Page
// ---------------------------------------------------------------------------
export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xl font-bold">MAI Legacy</span>
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3 w-3" />
            Demo Mode
          </Badge>
          <Button asChild>
            <Link href="/signup">
              Start Your Legacy
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        {/* Hero */}
        <section className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            See MAI Legacy in Action
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore how the Powell family uses MAI Legacy to preserve their
            stories, recipes, skills, and traditions for future generations.
          </p>
        </section>

        {/* ---- SECTION 1: Family Dashboard Preview ---- */}
        <section className="mb-12">
          <SectionLabel
            icon={Users}
            title="Family Dashboard"
            description="See your whole family at a glance — people, traditions, and important info."
          />

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {DEMO_STATS.map((stat) => (
              <Card key={stat.label}>
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
            ))}
          </div>

          {/* People cards */}
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            People & Stories
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {DEMO_MEMBERS.map((member) => (
              <Card key={member.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          {member.name}
                        </p>
                        {member.role === "admin" && (
                          <Badge variant="outline" className="text-[10px]">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.highlight}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Traditions */}
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CalendarHeart className="h-4 w-4 text-pink-500" />
            Family Traditions
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {DEMO_TRADITIONS.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{t.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium">{t.name}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {t.frequency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ---- SECTION 2: Entries ---- */}
        <section className="mb-12">
          <SectionLabel
            icon={BookOpen}
            title="Knowledge Entries"
            description="Document stories, recipes, skills, and lessons. Everything searchable by the Griot."
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Entries</CardTitle>
              <Button variant="ghost" size="sm" disabled className="gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Add Entry
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {DEMO_ENTRIES.map((entry, i) => (
                <div key={entry.title}>
                  <div className="flex items-center justify-between py-3 px-2 rounded-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="secondary"
                        className={`${typeColors[entry.type]} shrink-0 text-xs`}
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
                  </div>
                  {i < DEMO_ENTRIES.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* ---- SECTION 3: The Griot (AI Chat) ---- */}
        <section className="mb-12">
          <SectionLabel
            icon={MessageCircle}
            title="The Griot — Your Family's AI"
            description="Ask the Griot anything and get answers from your family's collective knowledge."
          />

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4 max-w-2xl mx-auto">
                {DEMO_GRIOT_MESSAGES.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 max-w-2xl mx-auto">
                <div className="flex-1 rounded-full border px-4 py-2.5 text-sm text-muted-foreground">
                  Ask about your family&apos;s knowledge...
                </div>
                <Button size="icon" className="rounded-full shrink-0" disabled>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ---- SECTION 4: My Story Profile ---- */}
        <section className="mb-12">
          <SectionLabel
            icon={Heart}
            title="My Story — Life Resume"
            description="Every family member builds a personal life resume — career, places, skills, milestones."
          />

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                    KP
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">Kobe Powell</h3>
                  <p className="text-sm text-muted-foreground">
                    Admin · Joined Aug 2024
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <StoryPreviewItem
                  icon={MapPin}
                  title="Places Lived"
                  items={["Atlanta, GA (2020 - Present)", "Memphis, TN (2010 - 2020)", "Jackson, MS (1995 - 2010)"]}
                />
                <StoryPreviewItem
                  icon={Briefcase}
                  title="Career"
                  items={["Software Engineer @ Tech Solutions", "IT Specialist @ City of Memphis"]}
                />
                <StoryPreviewItem
                  icon={Wrench}
                  title="Skills & Hobbies"
                  items={["Coding, Woodworking, Grilling, Guitar", "Photography, Fishing, Reading"]}
                />
                <StoryPreviewItem
                  icon={Flag}
                  title="Life Milestones"
                  items={["First child born (2022)", "Bought first house (2019)", "Graduated college (2016)"]}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <div className="max-w-2xl mx-auto bg-primary text-primary-foreground rounded-2xl p-12">
            <h2 className="text-3xl font-bold">
              Ready to preserve your legacy?
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              Create your family in minutes. Document what matters.
              Let the Griot keep it alive forever.
            </p>
            <Button size="lg" variant="secondary" className="mt-6" asChild>
              <Link href="/signup">
                Start Your Legacy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------
function SectionLabel({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-bold flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {title}
      </h2>
      <p className="text-muted-foreground mt-1 ml-[42px]">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story preview item
// ---------------------------------------------------------------------------
function StoryPreviewItem({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
