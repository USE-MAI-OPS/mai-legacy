"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  MessageCircle,
  Users,
  ArrowRight,
  ArrowLeft,
  CalendarHeart,
  Heart,
  MapPin,
  Briefcase,
  Wrench,
  Flag,
  Sparkles,
  TreePine,
  Target,
  Calendar,
  CheckCircle2,
  Upload,
  Mic,
  BarChart3,
  UserPlus,
  Pencil,
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
  { label: "Total Entries", value: 24, icon: BookOpen, color: "text-primary" },
  { label: "Griot Chats", value: 8, icon: MessageCircle, color: "text-primary" },
  { label: "Members", value: 7, icon: Users, color: "text-primary" },
];

const DEMO_MEMBERS = [
  {
    name: "Kobe Powell",
    initials: "KP",
    role: "admin",
    highlight: "Software Engineer",
    location: "Atlanta, GA",
    skills: ["Coding", "Woodworking", "Grilling", "Photography"],
  },
  {
    name: "Grandma Rose",
    initials: "GR",
    role: "member",
    highlight: "Retired Teacher",
    location: "Memphis, TN",
    skills: ["Cooking", "Gardening", "Sewing", "Quilting"],
  },
  {
    name: "Uncle Ray",
    initials: "UR",
    role: "member",
    highlight: "BBQ Pitmaster",
    location: "Memphis, TN",
    skills: ["BBQ", "Smoking Meats", "Guitar", "Fishing"],
  },
];

const DEMO_TRADITIONS = [
  { name: "Sunday Family Dinner", frequency: "Weekly", emoji: "🍽️" },
  { name: "Annual Family Reunion", frequency: "Annual", emoji: "🎉" },
  { name: "Christmas Eve Stories", frequency: "Annual", emoji: "📖" },
  { name: "New Year's Cornbread", frequency: "Annual", emoji: "🌽" },
];

const DEMO_ENTRIES = [
  { title: "Grandma Rose's Sweet Potato Pie", type: "recipe", author: "Grandma Rose", date: "2 hrs ago" },
  { title: "How Dad Fixed Everything with WD-40", type: "skill", author: "Uncle Ray", date: "Yesterday" },
  { title: "The Summer We Drove to Mississippi", type: "story", author: "Kobe Powell", date: "2 days ago" },
  { title: "Always Finish What You Start", type: "lesson", author: "Grandma Rose", date: "3 days ago" },
  { title: "Dr. Marcus Thompson — Family Doctor", type: "connection", author: "David Powell", date: "4 days ago" },
  { title: "Notes from the Family Meeting", type: "general", author: "David Powell", date: "5 days ago" },
];

const DEMO_GRIOT_PROMPTS = [
  {
    prompt: "What's Grandma Rose's sweet potato pie recipe?",
    response:
      "Based on your family's entries, Grandma Rose's Sweet Potato Pie calls for 3 large sweet potatoes (boiled and mashed), 1 cup sugar, ½ cup butter, 2 eggs, ½ cup milk, 1 tsp vanilla, ½ tsp cinnamon, and ½ tsp nutmeg. She always says the secret is letting the potatoes cool completely before mixing.",
    sources: ["Grandma Rose's Sweet Potato Pie", "Holiday Cooking Tips"],
  },
  {
    prompt: "What life lessons has the family documented?",
    response:
      "Your family has documented several key life lessons. Grandma Rose shared \"Always Finish What You Start\" — a value she learned from her own mother during hard times. Uncle Ray contributed \"Measure Twice, Cut Once\" which applies to both woodworking and life decisions. David Powell added \"Show Up For People\" about the importance of being present at family events.",
    sources: ["Always Finish What You Start", "Uncle Ray's Workshop Wisdom", "Show Up For People"],
  },
  {
    prompt: "Tell me about Uncle Ray's BBQ techniques",
    response:
      "Uncle Ray's BBQ mastery centers on low-and-slow smoking. His brisket method uses a 12-hour oak wood smoke at 225°F with a homemade dry rub (paprika, brown sugar, garlic powder, black pepper, cayenne). He wraps in butcher paper at the stall, never foil. His secret: he mops with apple cider vinegar every 90 minutes for the first 6 hours.",
    sources: ["How to Smoke a Brisket", "Uncle Ray's Dry Rub Recipe"],
  },
];

const DEMO_GOALS = [
  { title: "Document 50 Family Recipes", progress: 68, current: 34, target: 50 },
  { title: "Interview All Elders", progress: 40, current: 2, target: 5 },
  { title: "Digitize Old Photo Albums", progress: 15, current: 3, target: 20 },
];

const DEMO_EVENTS = [
  { title: "Sunday Dinner", date: "This Sunday", location: "Grandma's House", rsvps: 4 },
  { title: "Family Reunion Planning", date: "Mar 22", location: "Zoom Call", rsvps: 3 },
  { title: "Annual Family Reunion", date: "Jul 19", location: "Shelby Farms Park", rsvps: 12 },
];

const typeColors: Record<string, string> = {
  story: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  skill: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  recipe: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  lesson: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  connection: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300",
};

// ---------------------------------------------------------------------------
// Demo Page
// ---------------------------------------------------------------------------
export default function DemoPage() {
  const [activePrompt, setActivePrompt] = React.useState(0);
  const [phase, setPhase] = React.useState<"idle" | "fading" | "dots" | "streaming">("idle");
  const [streamIndex, setStreamIndex] = React.useState(Infinity);
  const timers = React.useRef<{
    timeout: ReturnType<typeof setTimeout> | null;
    interval: ReturnType<typeof setInterval> | null;
  }>({ timeout: null, interval: null });

  const cleanup = React.useCallback(() => {
    if (timers.current.timeout) clearTimeout(timers.current.timeout);
    if (timers.current.interval) clearInterval(timers.current.interval);
    timers.current = { timeout: null, interval: null };
  }, []);

  React.useEffect(() => cleanup, [cleanup]);

  const handlePromptClick = React.useCallback(
    (index: number) => {
      if (index === activePrompt || phase !== "idle") return;
      cleanup();

      // 1 — Fade out old conversation
      setPhase("fading");

      timers.current.timeout = setTimeout(() => {
        // 2 — Switch prompt, show bouncing dots
        setActivePrompt(index);
        setStreamIndex(0);
        setPhase("dots");

        timers.current.timeout = setTimeout(() => {
          // 3 — Stream the response word-by-word
          setPhase("streaming");
          const words = DEMO_GRIOT_PROMPTS[index].response.split(" ");
          const tickMs = Math.max(20, Math.min(40, 1200 / words.length));
          let i = 0;
          timers.current.interval = setInterval(() => {
            i += 1;
            setStreamIndex(i);
            if (i >= words.length) {
              if (timers.current.interval) clearInterval(timers.current.interval);
              timers.current.timeout = setTimeout(() => {
                setStreamIndex(Infinity);
                setPhase("idle");
              }, 120);
            }
          }, tickMs);
        }, 800);
      }, 200);
    },
    [activePrompt, phase, cleanup]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xl font-bold text-foreground">MAI Legacy</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Demo Mode</span>
              <span className="sm:hidden">Demo</span>
            </Badge>
            <Button size="sm" asChild>
              <Link href="/signup">
                <span className="hidden sm:inline">Start Your Legacy</span>
                <span className="sm:hidden">Sign Up</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {/* Hero */}
        <section className="text-center py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            See MAI Legacy in Action
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore how the Powell family uses MAI Legacy to preserve their
            stories, recipes, skills, and traditions for future generations.
          </p>
        </section>

        {/* ---- SECTION 1: Dashboard Overview ---- */}
        <DemoSection
          id="dashboard"
          icon={BarChart3}
          title="Family Dashboard"
          description="Your family hub — stats, members, traditions, and recent activity at a glance."
        >
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            {DEMO_STATS.map((stat) => (
              <Card key={stat.label} className="overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {stat.label}
                      </p>
                    </div>
                    <stat.icon className={`h-7 w-7 sm:h-8 sm:w-8 ${stat.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* People cards */}
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Family Members
          </h3>
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {DEMO_MEMBERS.map((member) => (
              <Card key={member.name} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-11 w-11 ring-2 ring-background">
                      <AvatarFallback className="text-xs font-semibold text-white bg-primary">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{member.name}</p>
                        {member.role === "admin" && (
                          <Badge variant="outline" className="text-[10px] shrink-0">Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.highlight}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />{member.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs px-1.5 py-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Traditions */}
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <CalendarHeart className="h-4 w-4 text-primary" />
            Family Traditions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {DEMO_TRADITIONS.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-4 pb-3 text-center">
                  <span className="text-2xl block mb-1">{t.emoji}</span>
                  <p className="text-sm font-medium leading-tight">{t.name}</p>
                  <Badge variant="outline" className="text-xs mt-1.5">{t.frequency}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </DemoSection>

        {/* ---- SECTION 2: Family Tree ---- */}
        <DemoSection
          id="family-tree"
          icon={TreePine}
          title="Family Tree"
          description="Visualize relationships across generations. Add members, spouses, and build your lineage."
        >
          <Card>
            <CardContent className="pt-6 pb-6 overflow-x-auto">
              <div className="flex flex-col items-center min-w-[500px]">
                {/* Generation 1 - Grandparents */}
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Grandparents</p>
                <div className="flex items-center gap-3 mb-2">
                  <TreeNode name="Grandma Rose" label="Grandmother" initials="GR" year="1945" />
                  <div className="w-6 h-0.5 bg-primary/40" />
                  <TreeNode name="James Powell" label="Grandfather" initials="JP" year="1943" deceased />
                </div>

                {/* Connector down */}
                <div className="w-0.5 h-5 bg-border" />
                <div className="w-64 h-0.5 bg-border" />
                <div className="flex gap-64">
                  <div className="w-0.5 h-5 bg-border" />
                  <div className="w-0.5 h-5 bg-border" />
                </div>

                {/* Generation 2 - Parents & Uncle */}
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Parents</p>
                <div className="flex items-start gap-12 sm:gap-20 mb-2">
                  {/* Dad + Mom */}
                  <div className="flex items-center gap-3">
                    <TreeNode name="David Powell" label="Dad" initials="DP" year="1968" />
                    <div className="w-6 h-0.5 bg-primary/40" />
                    <TreeNode name="Lisa Powell" label="Mom" initials="LP" year="1970" />
                  </div>
                  {/* Uncle Ray + Aunt Carol */}
                  <div className="flex items-center gap-3">
                    <TreeNode name="Uncle Ray" label="Uncle" initials="UR" year="1971" />
                    <div className="w-6 h-0.5 bg-primary/40" />
                    <TreeNode name="Aunt Carol" label="Aunt" initials="AC" year="1973" />
                  </div>
                </div>

                {/* Connectors down */}
                <div className="flex gap-12 sm:gap-20">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-5 bg-border" />
                    <div className="w-28 h-0.5 bg-border" />
                    <div className="flex gap-28">
                      <div className="w-0.5 h-5 bg-border" />
                      <div className="w-0.5 h-5 bg-border" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-5 bg-border" />
                    <div className="w-28 h-0.5 bg-border" />
                    <div className="flex gap-28">
                      <div className="w-0.5 h-5 bg-border" />
                      <div className="w-0.5 h-5 bg-border" />
                    </div>
                  </div>
                </div>

                {/* Generation 3 - Kids */}
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Children</p>
                <div className="flex items-start gap-4 sm:gap-8">
                  <TreeNode name="Kobe Powell" label="Son" initials="KP" year="1995" highlight />
                  <TreeNode name="Maya Powell" label="Daughter" initials="MP" year="1998" />
                  <div className="w-4 sm:w-10" />
                  <TreeNode name="Jaylen Powell" label="Son" initials="JyP" year="2000" />
                  <TreeNode name="Nia Powell" label="Daughter" initials="NP" year="2003" />
                </div>
              </div>
            </CardContent>
          </Card>
        </DemoSection>

        {/* ---- SECTION 3: Entries ---- */}
        <DemoSection
          id="knowledge-entries"
          icon={BookOpen}
          title="Knowledge Entries"
          description="Document recipes, stories, skills, and lessons — all searchable by the Griot."
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Entries</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">6 types supported</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Edit entries">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {DEMO_ENTRIES.map((entry, i) => (
                <div key={entry.title}>
                  <div className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary" className={`${typeColors[entry.type]} shrink-0 text-xs capitalize`}>
                        {entry.type}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-base font-medium truncate">{entry.title}</p>
                        <p className="text-sm text-muted-foreground">by {entry.author}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0 ml-2">{entry.date}</span>
                  </div>
                  {i < DEMO_ENTRIES.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </DemoSection>

        {/* ---- SECTION 4: The Griot ---- */}
        <DemoSection
          id="griot"
          icon={MessageCircle}
          title="The Griot — Your Family's AI"
          description="Ask the Griot anything and get answers drawn from your family's collective knowledge."
        >
          <Card>
            <CardContent className="pt-6">
              {/* Conversation */}
              {(() => {
                const active = DEMO_GRIOT_PROMPTS[activePrompt];
                const isFading = phase === "fading";
                const isDots = phase === "dots";
                const isStreaming = phase === "streaming";
                const isIdle = phase === "idle";
                const words = active.response.split(" ");
                const visibleText =
                  streamIndex >= words.length
                    ? active.response
                    : words.slice(0, streamIndex).join(" ");
                const showCursor = isStreaming && streamIndex < words.length;
                const busy = phase !== "idle";

                return (
                  <>
                    <div className="space-y-4 max-w-2xl mx-auto">
                      {/* User message */}
                      <div className="flex justify-end">
                        <div
                          className="rounded-2xl px-4 py-3 max-w-[85%] bg-primary text-primary-foreground transition-opacity duration-200"
                          style={{ opacity: isFading ? 0 : 1 }}
                        >
                          <p className="text-base leading-relaxed">{active.prompt}</p>
                        </div>
                      </div>

                      {/* Griot response area */}
                      {isDots ? (
                        <div className="flex justify-start">
                          <div className="rounded-2xl px-5 py-3 bg-muted">
                            <div className="flex items-center gap-1.5 py-0.5">
                              {[0, 1, 2].map((i) => (
                                <span
                                  key={i}
                                  className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 animate-bounce"
                                  style={{
                                    animationDelay: `${i * 0.15}s`,
                                    animationDuration: "0.7s",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex justify-start transition-opacity duration-200"
                          style={{ opacity: isFading ? 0 : 1 }}
                        >
                          <div className="rounded-2xl px-4 py-3 max-w-[85%] bg-muted">
                            <p className="text-base leading-relaxed">
                              {visibleText}
                              {showCursor && (
                                <span className="inline-block w-[2px] h-[1.1em] ml-0.5 align-middle bg-foreground/40 animate-pulse" />
                              )}
                            </p>
                            {isIdle && (
                              <div className="mt-2 pt-2 border-t border-border/30 transition-opacity duration-300">
                                <p className="text-xs font-medium opacity-70 mb-1">Sources</p>
                                <div className="flex flex-wrap gap-1">
                                  {active.sources.map((src) => (
                                    <Badge key={src} variant="outline" className="text-xs opacity-70">
                                      {src}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Example prompts */}
                    <div className="mt-6 max-w-2xl mx-auto">
                      <p className="text-sm font-medium text-muted-foreground mb-3">Try asking:</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {DEMO_GRIOT_PROMPTS.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => handlePromptClick(i)}
                            disabled={busy}
                            className={`text-left rounded-lg border px-3 py-2 text-sm transition-all ${
                              activePrompt === i
                                ? "border-primary bg-primary/5 text-primary font-medium"
                                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                            } ${busy ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            &ldquo;{p.prompt}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="mt-6 flex items-center gap-2 max-w-2xl mx-auto">
                <div className="flex-1 rounded-full border px-4 py-2.5 text-base text-muted-foreground bg-muted/30">
                  Ask about your family&apos;s knowledge...
                </div>
                <Button size="icon" className="rounded-full shrink-0 h-10 w-10" disabled>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-3">
                Powered by RAG — the Griot searches your entries to find real answers.
              </p>
            </CardContent>
          </Card>
        </DemoSection>

        {/* ---- SECTION 5: Import Interview ---- */}
        <DemoSection
          id="import-interview"
          icon={Mic}
          title="Import Interview"
          description="Paste a conversation with a family elder and let AI extract entries, stories, and profile updates."
        >
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
                <InterviewStep
                  step={1}
                  title="Paste Transcript"
                  description="Upload or paste a recorded interview conversation with a family member."
                  icon={Upload}
                />
                <InterviewStep
                  step={2}
                  title="AI Extracts Entries"
                  description="Our AI reads the interview and automatically identifies recipes, stories, skills, and more."
                  icon={Sparkles}
                />
                <InterviewStep
                  step={3}
                  title="Review & Save"
                  description="Review extracted entries, edit as needed, and save them to your family's knowledge base."
                  icon={CheckCircle2}
                />
              </div>
            </CardContent>
          </Card>
        </DemoSection>

        {/* ---- SECTION 7: Family Events ---- */}
        <DemoSection
          id="family-events"
          icon={Calendar}
          title="Family Events"
          description="Track upcoming gatherings, reunions, and celebrations with RSVP tracking."
        >
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
            {DEMO_EVENTS.map((event) => (
              <Card key={event.title} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{event.date}</span>
                  </div>
                  <p className="text-base font-semibold mb-1">{event.title}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{event.location}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {event.rsvps} attending
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DemoSection>

        {/* ---- SECTION 8: Family Goals ---- */}
        <DemoSection
          id="family-goals"
          icon={Target}
          title="Family Goals"
          description="Set shared goals and track your family's progress together."
        >
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
            {DEMO_GOALS.map((goal) => (
              <Card key={goal.title}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold">{goal.title}</p>
                    <span className="text-xs text-muted-foreground">{goal.current}/{goal.target}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{goal.progress}% complete</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DemoSection>

        {/* ---- SECTION 9: My Story (Life Resume) ---- */}
        <DemoSection
          id="life-resume"
          icon={Heart}
          title="My Story — Life Resume"
          description="Every family member builds a personal life resume — career, places, skills, and milestones."
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-5">
                <Avatar className="h-14 w-14 ring-2 ring-background">
                  <AvatarFallback className="text-lg font-bold bg-primary text-white">KP</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">Kobe Powell</h3>
                  <p className="text-base text-muted-foreground">Admin · Software Engineer</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <StoryItem icon={MapPin} title="Places Lived" items={[
                  "Atlanta, GA (2020 - Present)",
                  "Memphis, TN (2010 - 2020)",
                  "Jackson, MS (1995 - 2010)",
                ]} />
                <StoryItem icon={Briefcase} title="Career" items={[
                  "Software Engineer @ Tech Solutions",
                  "IT Specialist @ City of Memphis",
                ]} />
                <StoryItem icon={Wrench} title="Skills & Hobbies" items={[
                  "Coding, Woodworking, Grilling",
                  "Photography, Guitar, Fishing",
                ]} />
                <StoryItem icon={Flag} title="Life Milestones" items={[
                  "First child born (2022)",
                  "Bought first house (2019)",
                  "Graduated college (2016)",
                ]} />
              </div>
            </CardContent>
          </Card>
        </DemoSection>

        {/* ---- SECTION 10: Onboarding ---- */}
        <DemoSection
          id="onboarding"
          icon={UserPlus}
          title="Easy Onboarding"
          description="Get your family started in minutes with a guided setup flow."
        >
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { step: "1", label: "Create Family", desc: "Name your family" },
                  { step: "2", label: "Your Profile", desc: "Add your story" },
                  { step: "3", label: "Invite Members", desc: "Magic link invites" },
                  { step: "4", label: "Start Adding", desc: "Entries & stories" },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="mx-auto h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mb-2">
                      {s.step}
                    </div>
                    <p className="text-base font-semibold">{s.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </DemoSection>

        {/* CTA */}
        <section className="text-center py-10 sm:py-14">
          <div className="max-w-2xl mx-auto bg-primary text-primary-foreground rounded-2xl p-8 sm:p-12 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Ready to preserve your legacy?
            </h2>
            <p className="mt-3 text-primary-foreground/80 text-base">
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
// Helper components
// ---------------------------------------------------------------------------

function DemoSection({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 sm:mb-14 scroll-mt-20">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          {title}
        </h2>
        <p className="text-base text-muted-foreground mt-1 ml-[42px]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function TreeNode({
  name,
  label,
  initials,
  year,
  deceased,
  highlight,
}: {
  name: string;
  label: string;
  initials: string;
  year: string;
  deceased?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 ${highlight ? "scale-105" : ""}`}>
      <Avatar className={`h-11 w-11 sm:h-12 sm:w-12 ${highlight ? "ring-2 ring-primary" : ""} ${deceased ? "opacity-60" : ""}`}>
        <AvatarFallback className="text-xs font-semibold text-white bg-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <p className={`text-xs font-medium leading-tight ${deceased ? "text-muted-foreground" : ""}`}>{name}</p>
        <p className="text-[10px] text-primary font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">
          b. {year} {deceased && "· deceased"}
        </p>
      </div>
    </div>
  );
}

function InterviewStep({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="mx-auto sm:mx-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-xs font-medium text-primary mb-1">Step {step}</p>
      <p className="text-base font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function StoryItem({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border p-3 bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-base">{item}</li>
        ))}
      </ul>
    </div>
  );
}
