"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  MessageCircle,
  Users,
  UserPlus,
  ArrowRight,
  Shield,
  Lock,
  EyeOff,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  {
    icon: Users,
    title: "Create Your Family",
    description: "Name your family and set up your private knowledge space.",
  },
  {
    icon: UserPlus,
    title: "Invite Members",
    description: "Send magic link invites. Everyone gets their own profile.",
  },
  {
    icon: BookOpen,
    title: "Document Together",
    description: "Add stories, recipes, skills, and lessons to your shared base.",
  },
  {
    icon: MessageCircle,
    title: "Ask the Griot",
    description: "Your family AI answers any question from your collective wisdom.",
  },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Living Knowledge Base",
    description:
      "Document stories, recipes, skills, life lessons, and family connections in one searchable place. Every entry is indexed and ready for the Griot.",
    href: "/demo#knowledge-entries",
  },
  {
    icon: MessageCircle,
    title: "The Griot",
    description:
      "Your family's AI brain. Ask it anything and get answers drawn from your collective wisdom, with sources cited from real family entries.",
    href: "/demo#griot",
  },
  {
    icon: Users,
    title: "Family Collaboration",
    description:
      "Invite family members with a magic link. Everyone adds to the knowledge base, everyone benefits. Track events, goals, and milestones together.",
    href: "/demo#dashboard",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We documented over 40 of my grandmother's recipes before she passed. Now the whole family can cook her dishes. That's priceless.",
    family: "The Williams Family",
    location: "Atlanta, GA",
    initials: "WF",
  },
  {
    quote:
      "My kids finally know the stories I grew up hearing. The Griot even helped my daughter write a school project about our family history.",
    family: "The Martinez Family",
    location: "Houston, TX",
    initials: "MF",
  },
  {
    quote:
      "Uncle James can't type well, but he told his stories and we added them. Now his wisdom lives on for generations to come.",
    family: "The Johnson Family",
    location: "Chicago, IL",
    initials: "JF",
  },
];

const GRIOT_PREVIEW_PROMPTS = [
  {
    prompt: "What was Grandma's secret to her sweet potato pie?",
    response:
      "According to Grandma Rose's entry, the secret is letting the sweet potatoes cool completely before mixing. She also adds a pinch of nutmeg that most recipes skip.",
    sources: ["Grandma Rose's Pie", "Holiday Tips"],
  },
  {
    prompt: "What life lessons has the family documented?",
    response:
      "Your family has recorded several key lessons. Grandma Rose shared \"Always Finish What You Start\" and Uncle Ray contributed \"Measure Twice, Cut Once\" about careful decision-making.",
    sources: ["Always Finish What You Start", "Workshop Wisdom"],
  },
  {
    prompt: "Tell me about Uncle Ray's BBQ techniques",
    response:
      "Uncle Ray's brisket uses a 12-hour oak wood smoke at 225°F. He wraps in butcher paper at the stall and mops with apple cider vinegar every 90 minutes for the first 6 hours.",
    sources: ["How to Smoke a Brisket", "Dry Rub Recipe"],
  },
];

const TRUST_ITEMS = [
  {
    icon: Shield,
    title: "You Own Your Data",
    description:
      "Every story, recipe, and memory belongs to your family. You can export or delete everything at any time. We never claim ownership.",
  },
  {
    icon: Lock,
    title: "Encrypted and Secure",
    description:
      "Your family's knowledge is protected with industry-standard encryption. Access is restricted to invited family members only.",
  },
  {
    icon: EyeOff,
    title: "Never Sold, Never Shared",
    description:
      "We will never sell your family's data or share it with advertisers. Your private memories stay private. Period.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Who can see my family's data?",
    answer:
      "Only members you explicitly invite to your family can view your entries. Each family is a private, isolated space. No one outside your family — including MAI Legacy staff — browses your content.",
  },
  {
    question: "Is my data encrypted?",
    answer:
      "Yes. All data is encrypted in transit and at rest using industry-standard encryption. Your family's entries are stored securely with row-level security ensuring complete isolation between families.",
  },
  {
    question: "Do you sell our family's data?",
    answer:
      "Never. Your family's stories, recipes, and wisdom will never be sold, shared with advertisers, or used for any purpose other than powering your own Griot. Your data is yours.",
  },
  {
    question: "How does the Griot AI work?",
    answer:
      "The Griot uses Retrieval-Augmented Generation (RAG). When you ask a question, it searches your family's entries for relevant information, then uses AI to compose a natural answer grounded in what your family has documented. It always cites its sources.",
  },
  {
    question: "Is the Griot accurate? Does it make things up?",
    answer:
      "The Griot only answers based on entries your family has documented. It cites the specific entries it draws from, so you can always verify. If it doesn't have enough information, it will tell you rather than guess.",
  },
  {
    question: "Can the Griot access information outside our family?",
    answer:
      "No. The Griot only searches your family's entries. It does not browse the internet or access other families' data. Every answer comes exclusively from your documented knowledge.",
  },
  {
    question: "How do I invite family members?",
    answer:
      "From your family dashboard, you can send magic link invitations via email. When a family member clicks the link, they're automatically added to your family and can start contributing right away.",
  },
  {
    question: "How many family members can I add?",
    answer:
      "There's no limit on family members during our free tier. Invite as many relatives as you'd like. The more contributors you have, the richer your family's knowledge base becomes.",
  },
  {
    question: "What kinds of knowledge can I document?",
    answer:
      "You can document stories, recipes, skills, life lessons, family connections, and general knowledge. Each entry type has a tailored form that helps you capture the right details. You can also import knowledge from elder interviews.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ----------------------------------------------------------------- */}
      {/* Sticky Header                                                     */}
      {/* ----------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-6xl mx-auto">
          <span className="font-serif text-2xl font-bold text-primary">
            MAI Legacy
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="flex flex-col items-center text-center px-6 py-20 sm:py-24 max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Your family&apos;s wisdom,
          <br />
          <span className="text-muted-foreground">preserved forever.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl">
          MAI Legacy is the knowledge platform for families. Document your
          stories, skills, recipes, and lessons. Then ask the Griot — your
          family&apos;s AI — anything.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Your Legacy
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/demo">See Demo</Link>
          </Button>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* How It Works                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center">
          How It Works
        </h2>
        <p className="text-center text-base text-muted-foreground mt-2 mb-10">
          From setup to your first question — in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 sm:gap-0">
          {HOW_IT_WORKS.map((step, i) => (
            <React.Fragment key={step.title}>
              <HowItWorksStep
                step={i + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden sm:flex items-center px-2 pt-6">
                  <div className="w-8 md:w-12 lg:w-16 border-t-2 border-dashed border-border" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Feature Cards                                                     */}
      {/* ----------------------------------------------------------------- */}
      <section id="features" className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center">
          What You Can Do
        </h2>
        <p className="text-center text-base text-muted-foreground mt-2 mb-10">
          Everything your family needs to preserve and share its collective
          wisdom.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map((feature) => (
            <Link key={feature.title} href={feature.href} className="group">
              <Card className="border-0 shadow-none bg-muted/50 transition-all group-hover:shadow-md group-hover:bg-muted/80 h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-muted-foreground mt-1 text-base leading-relaxed">
                        {feature.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium group-hover:gap-2 transition-all">
                        See in demo
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Inline Product Previews                                           */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <GriotPreview />
          <DashboardPreview />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Mid-Page CTA                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-12 text-center max-w-2xl mx-auto">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold">
          Ready to start preserving?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Create your family in under a minute. Free to start, no credit card
          required.
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/signup">
            Start Your Legacy
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Social Proof                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-center">
          Join 50+ families preserving their legacy
        </h2>
        <p className="text-center text-muted-foreground mt-2 mb-10">
          Families across the country trust MAI Legacy to keep their wisdom
          alive.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.family} className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-base leading-relaxed italic text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className="text-xs font-semibold text-white bg-primary"
                    >
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold">{t.family}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Privacy / Trust                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="bg-muted/50 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center">
            Your family&apos;s data belongs to your family.
          </h2>
          <p className="text-center text-muted-foreground mt-2 mb-10">
            Privacy and trust are the foundation of everything we build.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {TRUST_ITEMS.map((item) => (
              <TrustItem
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FAQ                                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Everything you need to know about MAI Legacy.
        </p>
        <Card>
          <CardContent className="pt-6 pb-2">
            {FAQ_ITEMS.map((item) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom CTA                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto bg-primary text-primary-foreground rounded-2xl p-8 sm:p-12 shadow-md">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">
            Every family has a story worth keeping.
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            Start documenting your family&apos;s legacy today. Free to start,
            no credit card required.
          </p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link href="/signup">
              Create Your Family
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span className="font-serif text-xl font-bold text-primary">
              MAI Legacy
            </span>
            <p className="mt-2 text-base text-muted-foreground">
              Built for families, by families.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-base font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-base text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className="hover:text-foreground transition-colors"
                >
                  Demo
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-base font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-base text-muted-foreground">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />
        <p className="text-center text-sm text-muted-foreground">
          &copy; 2026 MAI Legacy. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function HowItWorksStep({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-[160px]">
      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-3">
        {step}
      </div>
      <Icon className="h-5 w-5 text-primary mb-2" />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function GriotPreview() {
  const [activePrompt, setActivePrompt] = React.useState(0);
  const [phase, setPhase] = React.useState<
    "idle" | "fading" | "dots" | "streaming"
  >("idle");
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
          const words = GRIOT_PREVIEW_PROMPTS[index].response.split(" ");
          const tickMs = Math.max(20, Math.min(40, 1200 / words.length));
          let i = 0;

          timers.current.interval = setInterval(() => {
            i += 1;
            setStreamIndex(i);
            if (i >= words.length) {
              if (timers.current.interval)
                clearInterval(timers.current.interval);
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

  const active = GRIOT_PREVIEW_PROMPTS[activePrompt];
  const isFading = phase === "fading";
  const isDots = phase === "dots";
  const isStreaming = phase === "streaming";
  const isIdle = phase === "idle";

  // Build the visible text
  let displayText = active.response;
  let showCursor = false;
  if (isStreaming) {
    const words = active.response.split(" ");
    displayText = words.slice(0, streamIndex).join(" ");
    showCursor = streamIndex < words.length;
  }

  return (
    <div>
      <h3 className="font-serif text-xl font-semibold mb-2">
        Meet the Griot
      </h3>
      <p className="text-base text-muted-foreground mb-4">
        Your family&apos;s AI answers questions using your documented knowledge.
      </p>
      <Card className="overflow-hidden">
        <CardContent className="pt-5 pb-4">
          <div className="space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div
                className="rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground text-base max-w-[85%] transition-opacity duration-200"
                style={{ opacity: isFading ? 0 : 1 }}
              >
                {active.prompt}
              </div>
            </div>

            {/* AI response area */}
            {isDots ? (
              <div className="flex justify-start">
                <div className="rounded-2xl px-5 py-3 bg-muted">
                  <div className="flex items-center gap-1.5 py-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
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
                <div className="rounded-2xl px-4 py-2.5 bg-muted text-base max-w-[85%]">
                  <span>{displayText}</span>
                  {showCursor && (
                    <span className="inline-block w-[2px] h-[1.1em] ml-0.5 align-middle bg-foreground/40 animate-pulse" />
                  )}
                  {isIdle && (
                    <div className="mt-2 pt-2 border-t border-border/30 flex gap-1 flex-wrap transition-opacity duration-300">
                      {active.sources.map((src) => (
                        <Badge key={src} variant="outline" className="text-xs">
                          {src}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clickable prompt suggestions */}
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Try asking:
            </p>
            <div className="flex flex-col gap-1.5">
              {GRIOT_PREVIEW_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(i)}
                  disabled={!isIdle}
                  className={`text-left rounded-lg border px-3 py-2 text-sm transition-all ${
                    activePrompt === i
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                  } ${!isIdle ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  &ldquo;{p.prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div>
      <h3 className="font-serif text-xl font-semibold mb-2">
        Your Family Dashboard
      </h3>
      <p className="text-base text-muted-foreground mb-4">
        See your family&apos;s activity, members, and recent knowledge at a
        glance.
      </p>
      <Card className="overflow-hidden">
        <CardContent className="pt-5 pb-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { value: "24", label: "Entries" },
              { value: "7", label: "Members" },
              { value: "8", label: "Conversations" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <Separator className="mb-4" />

          {/* Members */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {[
                { initials: "GR" },
                { initials: "KP" },
                { initials: "UR" },
              ].map((m) => (
                <Avatar
                  key={m.initials}
                  className="h-8 w-8 ring-2 ring-background"
                >
                  <AvatarFallback
                    className="text-xs font-semibold text-white bg-primary"
                  >
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">+4 more</span>
          </div>

          {/* Recent entries */}
          <div className="space-y-2">
            {[
              { title: "Grandma Rose's Sweet Potato Pie", type: "recipe" },
              { title: "The Summer We Drove to Mississippi", type: "story" },
              { title: "Always Finish What You Start", type: "lesson" },
            ].map((entry) => (
              <div key={entry.title} className="flex items-center gap-2 py-1">
                <Badge
                  variant="secondary"
                  className="text-xs capitalize shrink-0"
                >
                  {entry.type}
                </Badge>
                <span className="text-base truncate">{entry.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="mx-auto sm:mx-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-base text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left text-base font-medium hover:text-primary transition-colors gap-4"
      >
        <span>{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-base text-muted-foreground leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
