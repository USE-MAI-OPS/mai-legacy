import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Explore Family Stories | MAI Legacy",
  description:
    "Discover stories, recipes, and wisdom shared by families on MAI Legacy.",
  openGraph: {
    title: "Explore Family Stories | MAI Legacy",
    description:
      "Discover stories, recipes, and wisdom shared by families on MAI Legacy.",
    url: "/explore",
  },
};

// ---------------------------------------------------------------------------
// Example entries — showcase what the dashboard looks like
// ---------------------------------------------------------------------------
interface ExampleEntry {
  id: string;
  title: string;
  description: string;
  type: "STORY" | "RECIPE" | "SKILL" | "LESSON";
  author: string;
  timeAgo: string;
  image: string;
}

const EXAMPLE_ENTRIES: ExampleEntry[] = [
  {
    id: "1",
    title: "The Summer We Drove to Mississippi",
    description:
      "A journey through the South that changed our family forever. Grandma remembers every stop, every diner, an...",
    type: "STORY",
    author: "Grandma Rose",
    timeAgo: "2 days",
    image: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600&h=400&fit=crop",
  },
  {
    id: "2",
    title: "Mama's Sweet Potato Pie",
    description:
      "The secret is in the nutmeg and the love. This recipe has been passed down through three generations of...",
    type: "RECIPE",
    author: "Mom",
    timeAgo: "3 days",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop",
  },
  {
    id: "3",
    title: "How to Can Peaches",
    description:
      "Capturing the sweetness of summer for the winter months. A practical guide to safe and delicious fruit preservation.",
    type: "SKILL",
    author: "Grandma Rose",
    timeAgo: "5 days",
    image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&h=400&fit=crop",
  },
  {
    id: "4",
    title: "What My Father Taught Me",
    description:
      "Hard work, honesty, and how to fix a leaky faucet. The foundational wisdom that built our household.",
    type: "LESSON",
    author: "Dad",
    timeAgo: "1 week",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop",
  },
  {
    id: "5",
    title: "Moving North: The Great Migration",
    description:
      "Uncle James recounts his first steps from the rural South to the bustling streets of Chicago in 1964...",
    type: "STORY",
    author: "Uncle James",
    timeAgo: "1 week",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop",
  },
  {
    id: "6",
    title: "Uncle James' BBQ Rub",
    description:
      "The legendary dry rub that makes every cookout a celebration. Simple, sweet, and perfectly balanced.",
    type: "RECIPE",
    author: "Uncle James",
    timeAgo: "2 weeks",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop",
  },
];

const typeBadgeColors: Record<string, string> = {
  STORY: "bg-emerald-600 text-white",
  RECIPE: "bg-red-500 text-white",
  SKILL: "bg-emerald-600 text-white",
  LESSON: "bg-purple-600 text-white",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="pt-28 pb-10 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight mb-4">
            Explore Family Stories
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Discover stories, recipes, and wisdom shared by families on MAI
            Legacy. Preserving the essence of our ancestors through the digital
            Griot.
          </p>
        </div>
      </section>

      {/* Example entries grid */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAMPLE_ENTRIES.map((entry) => (
            <div
              key={entry.id}
              className="group bg-card rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-lg"
            >
              {/* Cover image */}
              <div className="relative h-40 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.image}
                  alt={entry.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span
                  className={`absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${typeBadgeColors[entry.type]}`}
                >
                  {entry.type}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold leading-snug line-clamp-2">
                  {entry.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {entry.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      {entry.author.charAt(0)}
                    </div>
                    <span>{entry.author}</span>
                  </div>
                  <span>{entry.timeAgo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center space-y-4">
          <h2 className="text-2xl font-bold font-serif">
            Ready to preserve your family&apos;s legacy?
          </h2>
          <Button size="lg" className="rounded-full shadow-md" asChild>
            <Link href="/signup">
              Get Started Free
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Start documenting your stories today. For the ones who came before,
            and those who come after.
          </p>
        </div>

        {/* Mini footer */}
        <footer className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-serif font-bold text-sm text-foreground">
            MAI Legacy
          </span>
          <p>&copy; {new Date().getFullYear()} MAI Legacy. Preserving heritage for generations.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
