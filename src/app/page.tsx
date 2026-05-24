"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
import { PublicHeader } from "@/components/public-header";
import {
  BookOpen,
  MessageCircle,
  UserPlus,
  ArrowRight,
  Shield,
  Lock,
  EyeOff,
  ChevronDown,
  Search,
  CheckCircle2,
  TreeDeciduous,
  Quote
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------


const GRIOT_PREVIEW_PROMPTS = [
  {
    prompt: "What was Grandma's secret to her sweet potato pie?",
    response: "According to Grandma Rose's entry, the secret is letting the sweet potatoes cool completely before mixing. She also adds a pinch of nutmeg that most recipes skip.",
    sources: ["Grandma Rose's Pie", "Holiday Tips"],
  },
  {
    prompt: "What life lessons have I saved?",
    response: "Your context vault has several useful lessons. Grandma Rose shared \"Always Finish What You Start\" and Uncle Ray contributed \"Measure Twice, Cut Once\" about careful decision-making.",
    sources: ["Always Finish What You Start", "Workshop Wisdom"],
  },
  {
    prompt: "Tell me about Uncle Ray's BBQ techniques",
    response: "Uncle Ray's brisket uses a 12-hour oak wood smoke at 225°F. He wraps in butcher paper at the stall and mops with apple cider vinegar every 90 minutes for the first 6 hours.",
    sources: ["How to Smoke a Brisket", "Dry Rub Recipe"],
  },
];

const TRUST_ITEMS = [
  {
    icon: Shield,
    title: "You Own Your Data",
    description: "Every thought, memory, note, and context entry belongs to you. You can export or delete everything at any time. We never claim ownership.",
  },
  {
    icon: Lock,
    title: "Encrypted and Secure",
    description: "Your private context is protected with industry-standard encryption. Access is restricted to the people and spaces you explicitly allow.",
  },
  {
    icon: EyeOff,
    title: "Never Sold, Never Shared",
    description: "We will never sell your context data or share it with advertisers. Your private thoughts and memories stay private. Period.",
  },
];

const FAQ_ITEMS = [
  { question: "Who can see my MAI Bot data?", answer: "Only people you explicitly invite to a space can view its entries. Each space is private and isolated. No one outside that space — including MAI Bot staff — browses your content." },
  { question: "Is my data encrypted?", answer: "Yes. All data is encrypted in transit and at rest using industry-standard encryption. Your entries are stored securely with row-level security helping isolate private spaces from each other." },
  { question: "Do you sell my context data?", answer: "Never. Your thoughts, context, memories, and source-linked knowledge will never be sold, shared with advertisers, or used for any purpose other than powering your own MAI Bot and Griot experience. Your data is yours." },
  { question: "How does Griot work?", answer: "Griot uses Retrieval-Augmented Generation (RAG). When you ask a question, it searches your private context entries for relevant information, then uses AI to compose an answer grounded in what you have saved. It cites its sources." },
  { question: "How do I invite other people?", answer: "From your dashboard, you can send magic link invitations by email. When someone clicks the link, they are added to the right space and can start contributing context right away." },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <PublicHeader />

      {/* ----------------------------------------------------------------- */}
      {/* Hero Section - Immersive & Emotional                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 min-h-[90vh] md:min-h-[85vh] overflow-hidden pt-20">
        {/* Background Image Setup */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2940&auto=format&fit=crop"
            alt="A warm gathering around a dinner table, representing shared context, stories, and meaning"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Gradients to ensure text readability and blend into the next section */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Badge variant="outline" className="text-white border-white/20 bg-black/20 backdrop-blur-md mb-8 py-1.5 px-4 font-medium tracking-wide">
            We’re a data company
          </Badge>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            Store thoughts. <br className="hidden md:block"/>
            <span className="text-white italic font-medium">Preserve context.</span>
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg">
            Other platforms store records and files. MAI Bot stores thoughts, context, decisions, stories, and the meaning around them — then lets you ask Griot anything grounded in your own data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center w-full sm:w-auto">
            <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-xl transition-transform hover:scale-105" asChild>
              <Link href="/signup">
                Start Storing Context
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full bg-white text-primary border-white hover:bg-white/90 transition-all shadow-lg" asChild>
              <Link href="/demo">Explore the Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Product Demo Video (renders null until DEMO_VIDEO_ENABLED = true)  */}
      {/* ----------------------------------------------------------------- */}
      <DemoVideoSection />

      {/* ----------------------------------------------------------------- */}
      {/* Social Proof Banner                                                 */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/50">
            {[
              { label: "Data Ownership", value: "100%" },
              { label: "Encrypted at Rest", value: "Always" },
              { label: "Ads Served", value: "Zero" },
              { label: "Private Context Access", value: "By Design" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center">
                <span className="text-3xl font-serif font-bold text-foreground mb-1">{stat.value}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Show, Don't Tell - Feature Bento Grid                               */}
      {/* ----------------------------------------------------------------- */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            More than storage. <br/> A context layer.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Capture thoughts, conversations, decisions, media, memories, and relationships in a private context layer your agent can reason over.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          
          {/* Bento Item 1: The Knowledge Base */}
          <Link href="/demo#knowledge-entries" className="group block">
            <div className="h-full flex flex-col rounded-3xl bg-card border border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-border">
              {/* Visual Mockup Area */}
              <div className="relative h-64 bg-muted/30 p-8 flex items-center justify-center overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                
                {/* Floating Mockup Card */}
                <div className="relative z-10 w-full max-w-xs bg-background rounded-xl shadow-2xl border border-border/50 p-5 transform transition-transform group-hover:scale-105 group-hover:-rotate-1 duration-500">
                  <div className="flex items-center gap-3 mb-4 border-b pb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">GR</div>
                    <div>
                      <h4 className="font-serif font-semibold text-sm">Grandma Rose&apos;s Pie</h4>
                      <p className="text-xs text-muted-foreground">Recipe • Dec 2023</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 bg-muted rounded-full" />
                    <div className="h-2 w-full bg-muted rounded-full" />
                    <div className="h-2 w-5/6 bg-muted rounded-full" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="secondary" className="text-[10px]">Dessert</Badge>
                    <Badge variant="secondary" className="text-[10px]">Holidays</Badge>
                  </div>
                </div>
              </div>
              {/* Text Area */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold">Thought & Context Store</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Capture notes, media, conversations, decisions, memories, and relationships in one searchable place. Every context entry is indexed and ready for Griot.
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-primary transition-all group-hover:gap-2 gap-1">
                  Explore Context <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>

          {/* Bento Item 2: The Family Tree */}
          <Link href="/demo#dashboard" className="group block">
            <div className="h-full flex flex-col rounded-3xl bg-card border border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-border">
              {/* Visual Mockup Area */}
              <div className="relative h-64 bg-muted/30 p-8 flex items-center justify-center overflow-hidden">
                {/* Mock Tree Structure */}
                <div className="relative z-10 w-full flex flex-col items-center justify-center gap-4 transform transition-transform group-hover:scale-105 duration-500">
                  <div className="flex items-center gap-3 bg-background rounded-full pl-2 pr-4 py-2 shadow-lg border border-border/50">
                     <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">J</AvatarFallback>
                     </Avatar>
                     <span className="text-sm font-medium">James Powell</span>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="flex gap-12">
                     <div className="flex items-center gap-2 bg-background rounded-full pl-1.5 pr-3 py-1.5 shadow-md border border-border/50 relative">
                        <div className="absolute -top-6 left-1/2 w-px h-6 bg-border" />
                        <div className="absolute -top-6 -right-[3rem] w-[4.5rem] h-px bg-border" />
                        <Avatar className="h-6 w-6"><AvatarFallback className="bg-blue-100 text-blue-700 text-xs">A</AvatarFallback></Avatar>
                        <span className="text-xs font-medium">Alice</span>
                     </div>
                     <div className="flex items-center gap-2 bg-background rounded-full pl-1.5 pr-3 py-1.5 shadow-md border border-border/50 relative">
                        <div className="absolute -top-6 left-1/2 w-px h-6 bg-border" />
                        <Avatar className="h-6 w-6"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">M</AvatarFallback></Avatar>
                        <span className="text-xs font-medium">Marcus</span>
                     </div>
                  </div>
                </div>
              </div>
              {/* Text Area */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <TreeDeciduous className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold">Context Graph</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Map people, relationships, projects, memories, and the context that connects them. Invite trusted people when shared context matters.
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-primary transition-all group-hover:gap-2 gap-1">
                  View the Graph <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* How It Works                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Three simple steps to build your private context layer.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              step: "1",
              icon: UserPlus,
              title: "Create Your Space",
              description: "Sign up, name your private space, and decide who can contribute context with you.",
            },
            {
              step: "2",
              icon: BookOpen,
              title: "Capture Thoughts & Context",
              description: "Drop in thoughts, media, notes, memories, motivations, and decisions. MAI Bot turns them into searchable context.",
            },
            {
              step: "3",
              icon: MessageCircle,
              title: "Ask Griot Anything",
              description: "Griot searches your private context layer and answers questions with cited sources. It becomes the chat interface to your MAI Bot.",
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-sm">
                  {item.step}
                </span>
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Griot Section                                                 */}
      {/* ----------------------------------------------------------------- */}
      <section className="bg-muted/30 py-24 px-6 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Search className="h-4 w-4" /> Powered by AI
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6 text-foreground">
                Meet Griot. <br/> Your MAI Bot interface.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Stop losing context across chats, notes, files, and apps. Griot searches your private MAI Bot vault and helps you understand, organize, and eventually act on the context you have saved.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  "Answers from your private thought/context vault",
                  "Always cites sources from your saved context",
                  "Designed around private, permissioned context"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-foreground">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button size="lg" className="rounded-full font-semibold px-8" asChild>
                <Link href="/demo#griot">Try the Griot Demo</Link>
              </Button>
            </div>

            {/* Interactive Preview */}
            <div className="w-full relative">
               <div className="relative w-full rounded-2xl border border-border bg-card shadow-xl p-1 md:p-6 overflow-hidden">
                  <DarkGriotPreview />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Early Access CTA                                                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-4">Early Access</Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
            Be among the first context builders
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            MAI Bot is building the private thought layer for people, families, creators, and businesses. Join early and help shape the system your future agent will use.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">Start Storing Context</Link>
          </Button>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Privacy / Trust                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="bg-muted/30 px-6 py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              A private context layer, not another file dump.
            </h2>
            <p className="text-lg text-muted-foreground">
              Privacy and trust are the foundation of everything we build. Your thoughts, context, and source-linked memories stay under your control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="bg-card rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">{item.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FAQ                                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-24 max-w-3xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom CTA                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 z-0" />
        <div className="max-w-4xl mx-auto relative z-10 bg-primary text-primary-foreground rounded-3xl p-10 sm:p-16 shadow-2xl">
          {/* Aesthetic background pattern inside CTA */}
          <div className="absolute inset-0 opacity-10 rounded-3xl" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="relative z-10">
             <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-6 drop-shadow-sm">
               Your thoughts are data <br className="hidden md:block"/> worth keeping.
             </h2>
             <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 font-light">
               Start building the private context layer your AI agent can reason over. Free to start, no credit card required.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold rounded-full shadow-lg hover:scale-105 transition-transform" asChild>
                 <Link href="/signup">
                   Create Your MAI Bot Account
                   <ArrowRight className="ml-2 h-5 w-5" />
                 </Link>
               </Button>
               <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold rounded-full bg-white text-primary border-white hover:bg-white/90 transition-all shadow-lg" asChild>
                 <Link href="/demo">Explore the Demo</Link>
               </Button>
             </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-border/50 bg-background px-6 pt-16 pb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="sm:col-span-2">
            <span className="font-serif text-2xl font-bold text-primary">
              MAI Bot
            </span>
            <p className="mt-4 text-base text-muted-foreground w-full max-w-sm leading-relaxed">
              We’re a data company for thoughts and context — the private layer that makes your memories, decisions, media, and relationships useful to your AI agent.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/demo" className="hover:text-primary transition-colors">Demo</Link></li>
              <li><Link href="/explore" className="hover:text-primary transition-colors">Use Cases</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/signup" className="hover:text-primary transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 opacity-50" />
        <p className="text-center text-sm text-muted-foreground/80">
          &copy; {new Date().getFullYear()} MAI Bot. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function DarkGriotPreview() {
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

      setPhase("fading");
      timers.current.timeout = setTimeout(() => {
        setActivePrompt(index);
        setStreamIndex(0);
        setPhase("dots");

        timers.current.timeout = setTimeout(() => {
          setPhase("streaming");
          const words = GRIOT_PREVIEW_PROMPTS[index].response.split(" ");
          const tickMs = 30;
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

  const active = GRIOT_PREVIEW_PROMPTS[activePrompt];
  const isFading = phase === "fading";
  const isDots = phase === "dots";
  const isStreaming = phase === "streaming";
  const isIdle = phase === "idle";

  let displayText = active.response;
  let showCursor = false;
  if (isStreaming) {
    const words = active.response.split(" ");
    displayText = words.slice(0, streamIndex).join(" ");
    showCursor = streamIndex < words.length;
  }

  return (
    <div className="flex flex-col h-full rounded-xl bg-muted/30 p-4">
       {/* Chat Area */}
       <div className="flex-grow space-y-4 min-h-[220px]">
         {/* User message */}
         <div className="flex justify-end">
           <div
             className="rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground text-sm max-w-[85%] shadow-sm transition-opacity duration-200"
             style={{ opacity: isFading ? 0 : 1 }}
           >
             {active.prompt}
           </div>
         </div>

         {/* AI Response area */}
         {isDots ? (
           <div className="flex justify-start">
             <div className="rounded-2xl px-4 py-3 bg-background border border-border">
               <div className="flex items-center gap-1.5 py-0.5">
                 {[0, 1, 2].map((i) => (
                   <span
                     key={i}
                     className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce"
                     style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.7s" }}
                   />
                 ))}
               </div>
             </div>
           </div>
         ) : (
           <div className="flex justify-start transition-opacity duration-200" style={{ opacity: isFading ? 0 : 1 }}>
             <div className="rounded-2xl px-4 py-3 bg-background border border-border text-foreground text-sm max-w-[95%] shadow-sm leading-relaxed">
               <span>{displayText}</span>
               {showCursor && (
                 <span className="inline-block w-[2px] h-[1.1em] ml-0.5 align-middle bg-primary/50 animate-pulse" />
               )}
               {isIdle && (
                 <div className="mt-3 pt-2.5 border-t border-border flex gap-2 flex-wrap transition-opacity duration-300">
                   <div className="text-[10px] text-muted-foreground flex items-center mr-1">
                      <BookOpen className="h-3 w-3 mr-1" /> Sources:
                   </div>
                   {active.sources.map((src) => (
                     <span key={src} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border flex items-center gap-1">
                        <Quote className="h-2.5 w-2.5" /> {src}
                     </span>
                   ))}
                 </div>
               )}
             </div>
           </div>
         )}
       </div>

       {/* Interactive Prompt Buttons */}
       <div className="mt-6">
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider pl-1">Interactive Demo: Try asking</p>
          <div className="flex flex-col gap-1.5">
            {GRIOT_PREVIEW_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(i)}
                disabled={!isIdle}
                className={`text-left rounded-xl border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  activePrompt === i
                    ? "border-primary/30 bg-primary/5 text-foreground font-medium shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-foreground"
                } ${!isIdle ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
              >
                &ldquo;{p.prompt}&rdquo;
              </button>
            ))}
          </div>
       </div>
    </div>
  )
}


function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border border-border/50 bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-6 text-left text-lg font-serif font-medium hover:text-primary transition-colors gap-4"
      >
        <span>{question}</span>
        <div className={`p-2 rounded-full bg-muted/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
           <ChevronDown className="h-4 w-4 shrink-0 text-foreground" />
        </div>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${ open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0" }`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-base text-muted-foreground leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
