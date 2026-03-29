"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
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
  Clock,
  Search,
  CheckCircle2,
  TreeDeciduous,
  Quote
} from "lucide-react";

// ---------------------------------------------------------------------------
// EmailCaptureForm
// ---------------------------------------------------------------------------

function EmailCaptureForm({ source = "landing", className = "" }: { source?: string; className?: string }) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [hp, setHp] = React.useState(""); // honeypot
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source, _hp: hp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={`flex items-center gap-2 text-sm font-medium text-emerald-400 ${className}`}>
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        You&apos;re on the list! Check your inbox for a confirmation.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`} noValidate>
      {/* Honeypot — visually hidden */}
      <input
        type="text"
        name="_hp"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
      />
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 rounded-full px-4 py-3 text-sm bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 min-w-0 rounded-full px-4 py-3 text-sm bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
        <Button
          type="submit"
          size="sm"
          disabled={status === "loading"}
          className="rounded-full px-6 h-[46px] font-semibold shrink-0 bg-white text-primary hover:bg-white/90"
        >
          {status === "loading" ? "Joining…" : "Join Waitlist"}
        </Button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-300 pl-1">{errorMsg}</p>
      )}
    </form>
  );
}

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
    prompt: "What life lessons has the family documented?",
    response: "Your family has recorded several key lessons. Grandma Rose shared \"Always Finish What You Start\" and Uncle Ray contributed \"Measure Twice, Cut Once\" about careful decision-making.",
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
    description: "Every story, recipe, and memory belongs to your family. You can export or delete everything at any time. We never claim ownership.",
  },
  {
    icon: Lock,
    title: "Encrypted and Secure",
    description: "Your family's knowledge is protected with industry-standard encryption. Access is restricted to invited family members only.",
  },
  {
    icon: EyeOff,
    title: "Never Sold, Never Shared",
    description: "We will never sell your family's data or share it with advertisers. Your private memories stay private. Period.",
  },
];

const FAQ_ITEMS = [
  { question: "Who can see my family's data?", answer: "Only members you explicitly invite to your family can view your entries. Each family is a private, isolated space. No one outside your family — including MAI Legacy staff — browses your content." },
  { question: "Is my data encrypted?", answer: "Yes. All data is encrypted in transit and at rest using industry-standard encryption. Your family's entries are stored securely with row-level security ensuring complete isolation between families." },
  { question: "Do you sell our family's data?", answer: "Never. Your family's stories, recipes, and wisdom will never be sold, shared with advertisers, or used for any purpose other than powering your own Griot. Your data is yours." },
  { question: "How does the Griot AI work?", answer: "The Griot uses Retrieval-Augmented Generation (RAG). When you ask a question, it searches your family's entries for relevant information, then uses AI to compose a natural answer grounded in what your family has documented. It always cites its sources." },
  { question: "How do I invite family members?", answer: "From your family dashboard, you can send magic link invitations via email. When a family member clicks the link, they're automatically added to your family and can start contributing right away." },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all duration-300">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="font-serif text-2xl font-bold text-primary hover:opacity-90 transition-opacity">
            MAI Legacy
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5 shadow-sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Hero Section - Immersive & Emotional                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 min-h-[90vh] md:min-h-[85vh] overflow-hidden pt-20">
        {/* Background Image Setup */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2940&auto=format&fit=crop"
            alt="A warm family gathering around a dinner table, representing shared stories and heritage"
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
            The Interactive Museum of Your Family
          </Badge>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            Your family&apos;s wisdom, <br className="hidden md:block"/>
            <span className="text-white italic font-medium">preserved forever.</span>
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg">
            Document your stories, skills, recipes, and lessons in a private sanctuary. Then ask the Griot — your family&apos;s AI — anything.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center w-full sm:w-auto">
            <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-xl transition-transform hover:scale-105" asChild>
              <Link href="/signup">
                Start Your Legacy
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full bg-white text-primary border-white hover:bg-white/90 transition-all shadow-lg" asChild>
              <Link href="/demo">Explore the Demo</Link>
            </Button>
          </div>
          <div className="mt-8 w-full max-w-xl mx-auto">
            <p className="text-white/60 text-sm mb-3">Not ready to sign up? Join the waitlist — we&apos;ll let you know when it&apos;s your turn.</p>
            <EmailCaptureForm source="hero" />
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
              { label: "Family-Only Access", value: "By Design" },
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
            More than a journal. <br/> A living archive.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Experience a beautiful, structured environment designed to make documenting family history effortless and engaging for multiple generations.
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
                      <h4 className="font-serif font-semibold text-sm">Grandma Rose's Pie</h4>
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
                  <h3 className="font-serif text-2xl font-bold">Living Knowledge Base</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Document stories, recipes, skills, life lessons, and family connections in one beautifully searchable place. Every entry is indexed and ready for the Griot.
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-primary transition-all group-hover:gap-2 gap-1">
                  Explore Entries <ArrowRight className="h-4 w-4" />
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
                  <h3 className="font-serif text-2xl font-bold">Interactive Family Tree</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Visualize your entire family lineage. Invite members with a magic link so everyone gets their own profile and can add to the shared legacy.
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-primary transition-all group-hover:gap-2 gap-1">
                  View the Tree <ArrowRight className="h-4 w-4" />
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
            Three simple steps to preserve your family&apos;s legacy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              step: "1",
              icon: UserPlus,
              title: "Create Your Family",
              description: "Sign up, name your family, and invite members with a magic link. Everyone gets their own profile instantly.",
            },
            {
              step: "2",
              icon: BookOpen,
              title: "Document Your Knowledge",
              description: "Add stories, recipes, skills, and life lessons. Each entry is saved, searchable, and preserved for future generations.",
            },
            {
              step: "3",
              icon: MessageCircle,
              title: "Ask the Griot Anything",
              description: "Your family\u2019s AI searches everything you\u2019ve documented and answers questions with cited sources. Like having a family historian on call.",
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
      {/* The Griot Section                                                 */}
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
                Meet The Griot. <br/> Your family&apos;s brain.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Stop losing recipes in group chats. The Griot uses the latest AI to search exclusively through the stories, recipes, and lessons your family has documented, providing direct answers with cited sources.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  "Answers instantly from your private vault",
                  "Always cites sources (e.g., 'Grandma Rose's Pie')",
                  "Never accesses public internet or other families' data"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-foreground">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button size="lg" className="rounded-full font-semibold px-8" asChild>
                <Link href="/demo#griot">Try the Chatbot Demo</Link>
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
            Be among the first families
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            MAI Legacy is just getting started. Join early and help shape the product — your family&apos;s story deserves to be told right.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">Start Your Legacy</Link>
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
              A private vault, not a social network.
            </h2>
            <p className="text-lg text-muted-foreground">
              Privacy and trust are the foundation of everything we build. Your stories stay with your family.
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
               Every family has a story <br className="hidden md:block"/> worth keeping.
             </h2>
             <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 font-light">
               Start documenting your family&apos;s legacy today. Free to start, no credit card required.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold rounded-full shadow-lg hover:scale-105 transition-transform" asChild>
                 <Link href="/signup">
                   Create Your Free Account
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
          {/* Brand + footer waitlist */}
          <div className="sm:col-span-2">
            <span className="font-serif text-2xl font-bold text-primary">
              MAI Legacy
            </span>
            <p className="mt-4 text-base text-muted-foreground w-full max-w-sm leading-relaxed">
              Built for families, by families. The interactive museum and intelligent archive for your family's most precious wisdom.
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground mb-2">Join the waitlist</p>
              <FooterEmailCaptureForm />
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/demo" className="hover:text-primary transition-colors">Interactive Demo</Link></li>
              <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
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
          &copy; {new Date().getFullYear()} MAI Legacy. All rights reserved.
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

function FooterEmailCaptureForm() {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [hp, setHp] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source: "footer", _hp: hp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        You&apos;re on the list!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm">
      <input
        type="text"
        name="_hp"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
      />
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
        />
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
          <Button type="submit" size="sm" disabled={status === "loading"} className="shrink-0">
            {status === "loading" ? "…" : "Join"}
          </Button>
        </div>
      </div>
      {status === "error" && <p className="mt-1.5 text-xs text-destructive">{errorMsg}</p>}
    </form>
  );
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
