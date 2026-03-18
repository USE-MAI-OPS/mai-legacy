"use client";

import React, { useState, useEffect } from "react";
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
  Play
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
  { name: "Kobe Powell", initials: "KP", role: "admin", highlight: "Software Engineer", location: "Atlanta, GA", skills: ["Coding", "Woodworking", "Grilling"] },
  { name: "Grandma Rose", initials: "GR", role: "elder", highlight: "Retired Teacher", location: "Memphis, TN", skills: ["Cooking", "Gardening", "Sewing"] },
  { name: "Uncle Ray", initials: "UR", role: "member", highlight: "BBQ Pitmaster", location: "Memphis, TN", skills: ["BBQ", "Smoking Meats", "Guitar"] },
];

const DEMO_TRADITIONS = [
  { name: "Sunday Dinner", frequency: "Weekly", emoji: "🍽️" },
  { name: "Family Reunion", frequency: "Annual", emoji: "🎉" },
  { name: "Xmas Stories", frequency: "Annual", emoji: "📖" },
  { name: "NY Cornbread", frequency: "Annual", emoji: "🌽" },
];

const DEMO_ENTRIES = [
  { title: "Grandma Rose's Sweet Potato Pie", type: "recipe", author: "Grandma Rose", date: "2 hrs ago" },
  { title: "How Dad Fixed Everything with WD-40", type: "skill", author: "Uncle Ray", date: "Yesterday" },
  { title: "The Summer We Drove to Mississippi", type: "story", author: "Kobe Powell", date: "2 days ago" },
  { title: "Always Finish What You Start", type: "lesson", author: "Grandma Rose", date: "3 days ago" },
];

const DEMO_GRIOT_PROMPTS = [
  {
    prompt: "What's Grandma Rose's sweet potato pie recipe?",
    response: "Based on your family's entries, Grandma Rose's Sweet Potato Pie calls for 3 large sweet potatoes (boiled and mashed), 1 cup sugar, ½ cup butter, 2 eggs, ½ cup milk, 1 tsp vanilla, ½ tsp cinnamon, and ½ tsp nutmeg. She always says the secret is letting the potatoes cool completely before mixing.",
    sources: ["Grandma Rose's Sweet Potato Pie", "Holiday Cooking Tips"],
  },
  {
    prompt: "What life lessons has the family documented?",
    response: "Your family has documented several key life lessons. Grandma Rose shared \"Always Finish What You Start\" — a value she learned during hard times. Uncle Ray contributed \"Measure Twice, Cut Once\" which applies to both woodworking and life.",
    sources: ["Always Finish What You Start", "Uncle Ray's Woodworking"],
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

const NAV_SECTIONS = [
  { id: "dashboard", label: "The Hub", icon: BarChart3 },
  { id: "family-tree", label: "The Lineage", icon: TreePine },
  { id: "knowledge-entries", label: "The Archive", icon: BookOpen },
  { id: "griot", label: "The Oracle", icon: MessageCircle },
  { id: "import-interview", label: "The Bridge", icon: Mic },
];

// ---------------------------------------------------------------------------
// Demo Page
// ---------------------------------------------------------------------------
export default function DemoPage() {
  const [activeSection, setActiveSection] = useState("dashboard");

  // Intersection Observer for sticky nav highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" } // trigger when near top
    );

    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
            <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
               <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="text-xl font-serif font-bold text-foreground">MAI Legacy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 font-medium bg-primary/5 text-primary border-primary/20 hidden sm:flex">
              <Play className="h-3.5 w-3.5 fill-primary" />
              Interactive Tour
            </Badge>
            <Button className="rounded-full px-6 shadow-sm" asChild>
              <Link href="/signup">
                Start Your Legacy
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="relative overflow-hidden border-b">
         {/* Background Image */}
         <div className="absolute inset-0 z-0">
           <img
             src="https://images.pexels.com/photos/5728209/pexels-photo-5728209.jpeg?auto=compress&cs=tinysrgb&w=1920"
             alt="Happy Black family sitting together"
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-primary/70" />
         </div>
         <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10 text-primary-foreground">
            <div className="max-w-2xl">
               <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-6">Interactive Demo</Badge>
               <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 drop-shadow-md">
                 Meet the Powell Family
               </h1>
               <p className="text-lg sm:text-xl text-primary-foreground/90 leading-relaxed font-light">
                 Take a guided tour through Grandma Rose's recipes, Uncle Ray's wisdom, and Kobe's mission to preserve their legacy for the next generation.
               </p>
            </div>
            <div className="hidden md:flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl w-72">
               <Avatar className="h-24 w-24 ring-4 ring-white/30 mb-4 shadow-lg">
                  <AvatarFallback className="text-2xl font-serif font-bold bg-white text-primary">GR</AvatarFallback>
               </Avatar>
               <h3 className="text-xl font-semibold mb-1">Grandma Rose</h3>
               <p className="text-sm text-primary-foreground/80 font-medium">Matriarch • 24 Entries</p>
            </div>
         </div>
      </section>

      {/* Main Layout: Sticky Nav + Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* Left Side: Sticky Tour Navigation */}
        <div className="hidden lg:block w-72 shrink-0">
          <nav className="sticky top-32 space-y-1 bg-muted/30 p-2 rounded-2xl border border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2">Tour Stops</p>
            {NAV_SECTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all font-medium ${
                  activeSection === item.id 
                    ? "bg-background text-primary shadow-sm border border-border/50" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <item.icon className={`h-4 w-4 ${activeSection === item.id ? "text-primary" : "opacity-70"}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Side: Tour Content */}
        <div className="flex-1 space-y-24 md:space-y-32 pb-32">
          
          {/* ---- STOP 1: Dashboard ---- */}
          <SectionContainer id="dashboard" title="The Hub: Family Dashboard" description="A bird's eye view of the family's overall activity, total knowledge collected, and upcoming traditions.">
            <div className="bg-card rounded-3xl border border-border/60 shadow-sm p-6 sm:p-8">
               {/* Stats Row */}
               <div className="grid grid-cols-3 gap-4 mb-8">
               {DEMO_STATS.map((stat) => (
                  <div key={stat.label} className="bg-muted/30 rounded-2xl p-5 border border-transparent hover:border-border transition-colors">
                     <div className="flex items-center justify-between mb-2">
                        <stat.icon className={`h-5 w-5 ${stat.color} opacity-70`} />
                     </div>
                     <p className="text-3xl font-serif font-bold mb-1">{stat.value}</p>
                     <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  </div>
               ))}
               </div>
               
               {/* Members Grid */}
               <h3 className="text-lg font-semibold mb-4 border-b pb-2">Active Members</h3>
               <div className="grid sm:grid-cols-3 gap-6">
               {DEMO_MEMBERS.map((member) => (
                  <div key={member.name} className="flex flex-col gap-3">
                     <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                           <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{member.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                           <p className="font-semibold text-sm leading-tight">{member.name}</p>
                           <p className="text-xs text-muted-foreground">{member.role === 'admin' ? 'Admin' : 'Member'}</p>
                        </div>
                     </div>
                     <div className="flex gap-1 flex-wrap">
                        {member.skills.slice(0,2).map(s => <Badge variant="secondary" className="text-[10px] bg-muted" key={s}>{s}</Badge>)}
                     </div>
                  </div>
               ))}
               </div>
            </div>
          </SectionContainer>

          {/* ---- STOP 2: Family Tree ---- */}
          <SectionContainer id="family-tree" title="The Lineage: Interactive Tree" description="Track the lineage in an elegant, infinite-canvas style view.">
            <div className="bg-card rounded-3xl border border-border/60 shadow-sm p-8 overflow-hidden relative">
               <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }} />
               <div className="relative z-10 flex flex-col items-center">
                 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">First Generation</p>
                 <div className="flex items-center gap-4 mb-3">
                   <TreeNode name="James Powell" label="Grandfather" initials="JP" year="1943-2018" deceased />
                   <div className="w-8 h-px bg-border" />
                   <TreeNode name="Rose Powell" label="Grandmother" initials="RP" year="1945" highlight />
                 </div>
                 <div className="w-px h-8 bg-border border-dashed border-l" />
                 <div className="w-48 h-px bg-border border-dashed border-t" />
                 <div className="flex gap-48">
                   <div className="w-px h-8 bg-border border-dashed border-l" />
                   <div className="w-px h-8 bg-border border-dashed border-l" />
                 </div>
                 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 mt-2">Second Generation</p>
                 <div className="flex items-start gap-32">
                   <TreeNode name="David Powell" label="Son" initials="DP" year="1968" />
                   <TreeNode name="Ray Powell" label="Son" initials="RP" year="1971" />
                 </div>
               </div>
            </div>
          </SectionContainer>

          {/* ---- STOP 3: Entries ---- */}
          <SectionContainer id="knowledge-entries" title="The Archive: Knowledge Flow" description="A clean, structured feed of memories, grouped by taxonomy to ensure nothing is lost.">
            <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
               <div className="bg-muted/40 p-4 border-b border-border/60 flex items-center justify-between">
                  <h3 className="font-medium text-sm">Latest Additions</h3>
                  <Button variant="outline" size="sm" className="h-8 text-xs">Filter by Type</Button>
               </div>
               <div className="divide-y divide-border/40">
               {DEMO_ENTRIES.map((entry) => (
                  <div key={entry.title} className="p-5 hover:bg-muted/20 transition-colors flex items-start sm:items-center justify-between gap-4">
                     <div className="flex items-start sm:items-center gap-4">
                        <div className={`mt-0.5 sm:mt-0 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${typeColors[entry.type]}`}>
                           {entry.type}
                        </div>
                        <div>
                           <h4 className="font-semibold text-base mb-0.5">{entry.title}</h4>
                           <p className="text-sm text-muted-foreground">Added by {entry.author}</p>
                        </div>
                     </div>
                     <p className="hidden sm:block text-xs font-medium text-muted-foreground">{entry.date}</p>
                  </div>
               ))}
               </div>
            </div>
          </SectionContainer>

          {/* ---- STOP 4: Griot ---- */}
          <SectionContainer id="griot" title="The Oracle: Meet The Griot" description="The Griot searches exclusively through your family's documented knowledge. No made-up answers. Only your own stories.">
            <div className="rounded-3xl border border-border bg-card p-2 sm:p-8 shadow-xl relative overflow-hidden">
               <GriotDemo />
            </div>
          </SectionContainer>

          {/* ---- STOP 5: Import ---- */}
          <SectionContainer id="import-interview" title="The Bridge: Audio Import" description="Not everyone types well. The Import tool lets you upload an audio transcript of a family elder, and AI extracts the wisdom into structured cards automatically.">
            <div className="bg-card rounded-3xl border border-border/60 shadow-sm p-8">
               <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center p-4">
                     <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-5 w-5 text-primary" />
                     </div>
                     <h4 className="font-semibold mb-2">1. Paste Transcript</h4>
                     <p className="text-sm text-muted-foreground">Upload the transcript from a long conversation with Grandma.</p>
                  </div>
                  <div className="text-center p-4 relative">
                     <div className="hidden md:block absolute top-10 -left-6 w-12 h-px bg-border border-dashed border-t" />
                     <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-primary/20">
                        <Sparkles className="h-5 w-5 text-primary" />
                     </div>
                     <h4 className="font-semibold mb-2">2. AI Extracts</h4>
                     <p className="text-sm text-muted-foreground">The system automatically flags recipes, stories, and life lessons.</p>
                     <div className="hidden md:block absolute top-10 -right-6 w-12 h-px bg-border border-dashed border-t" />
                  </div>
                  <div className="text-center p-4">
                     <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                     </div>
                     <h4 className="font-semibold mb-2">3. Approve & Save</h4>
                     <p className="text-sm text-muted-foreground">Review the extracted cards and save them securely to your family's knowledge base.</p>
                  </div>
               </div>
            </div>
          </SectionContainer>

           {/* Final CTA Strip inside right rail */}
           <div className="bg-primary text-primary-foreground rounded-3xl p-10 text-center shadow-xl">
             <h2 className="font-serif text-3xl font-bold mb-4">Your family deserves a legacy like this.</h2>
             <p className="text-primary-foreground/90 mb-8 max-w-md mx-auto">Skip the generic group chats. Build a lasting interactive museum of your family.</p>
             <Button variant="secondary" size="lg" className="rounded-full shadow-lg h-14 px-8" asChild>
                <Link href="/signup">Create Your Family Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
             </Button>
           </div>

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function SectionContainer({ id, title, description, children }: { id: string, title: string, description: string, children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
       <div className="mb-8 max-w-lg">
         <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">{title}</h2>
         <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>
       </div>
       {children}
    </section>
  )
}

function TreeNode({ name, label, initials, year, deceased, highlight }: { name: string, label: string, initials: string, year: string, deceased?: boolean, highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 bg-background p-4 rounded-xl border ${highlight ? "border-primary shadow-md scale-105" : "border-border/60 shadow-sm"} ${deceased ? "opacity-75" : ""} transition-transform z-10 relative`}>
      <Avatar className={`h-12 w-12 ${highlight ? "bg-primary text-white" : ""}`}>
        <AvatarFallback className={`text-sm font-semibold ${highlight ? "bg-primary text-white" : "bg-muted text-foreground"}`}>{initials}</AvatarFallback>
      </Avatar>
      <div className="text-center">
        <p className={`text-sm font-bold ${deceased ? "text-muted-foreground" : "text-foreground"}`}>{name}</p>
        <p className="text-xs text-primary font-medium mt-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-1">{year}</p>
      </div>
    </div>
  )
}

function GriotDemo() {
  const [activePrompt, setActivePrompt] = useState(0);
  const [phase, setPhase] = useState<"idle" | "streaming">("idle");
  const [streamIndex, setStreamIndex] = useState(Infinity);
  
  const prompts = DEMO_GRIOT_PROMPTS;

  const handlePrompt = (i: number) => {
    if (phase !== "idle") return;
    setActivePrompt(i);
    setPhase("streaming");
    setStreamIndex(0);

    const words = prompts[i].response.split(" ");
    let curr = 0;
    const interval = setInterval(() => {
      curr += 1;
      setStreamIndex(curr);
      if (curr >= words.length) {
        clearInterval(interval);
        setTimeout(() => {
           setStreamIndex(Infinity);
           setPhase("idle");
        }, 100);
      }
    }, 40);
  };

  const active = prompts[activePrompt];
  const isStreaming = phase === "streaming";
  const words = active.response.split(" ");
  const visible = isStreaming && streamIndex < words.length ? words.slice(0, streamIndex).join(" ") : active.response;

  return (
    <div className="relative z-10 rounded-2xl bg-muted/30 border border-border p-6 flex flex-col md:flex-row gap-6 min-h-[360px]">

      {/* Left side: The Chat */}
      <div className="flex-1 flex flex-col justify-between">
         <div className="space-y-4">
            <div className="flex justify-end">
               <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[85%] shadow-sm">
                  {active.prompt}
               </div>
            </div>
            <div className="flex justify-start">
               <div className="bg-background border border-border text-foreground px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[95%] shadow-sm leading-relaxed">
                  {visible}
                  {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-primary/50 ml-1 animate-pulse align-middle" />}

                  {phase === "idle" && (
                    <div className="mt-3 pt-2.5 border-t border-border flex gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center mr-1"><BookOpen className="h-3 w-3 mr-1"/>Sources</span>
                      {active.sources.map(s => (
                         <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">{s}</span>
                      ))}
                    </div>
                  )}
               </div>
            </div>
         </div>
         <div className="mt-6 border border-border bg-background rounded-full px-4 py-2.5 flex items-center text-muted-foreground text-sm">
            Ask the Griot a question...
            <ArrowRight className="h-4 w-4 ml-auto" />
         </div>
      </div>

      {/* Right side: Interactive Prompts */}
      <div className="w-full md:w-56 shrink-0 flex flex-col gap-2">
         <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1 pl-2">Try these queries</p>
         {prompts.map((p, i) => (
            <button
               key={i}
               onClick={() => handlePrompt(i)}
               disabled={phase !== "idle"}
               className={`text-left text-sm px-3 py-2.5 rounded-xl border transition-all ${
                  activePrompt === i
                     ? "border-primary/30 bg-primary/5 text-foreground font-medium shadow-sm"
                     : "border-border bg-background text-muted-foreground hover:bg-primary/5 hover:border-primary/20 hover:text-foreground"
               } ${phase !== "idle" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
               &ldquo;{p.prompt}&rdquo;
            </button>
         ))}
      </div>
    </div>
  )
}
