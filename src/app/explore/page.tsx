import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { typeConfig } from "@/lib/entry-type-config";
import { createAdminClient } from "@/lib/supabase/server";
import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Explore",
  description:
    "Discover family stories, recipes, skills, and wisdom shared by families on MAI Legacy.",
  openGraph: {
    title: "Explore Family Stories | MAI Legacy",
    description:
      "Discover family stories, recipes, skills, and wisdom shared by families on MAI Legacy.",
    url: "/explore",
  },
  twitter: {
    title: "Explore Family Stories | MAI Legacy",
    description:
      "Discover family stories, recipes, skills, and wisdom shared by families on MAI Legacy.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
interface PublicEntryCard {
  id: string;
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  authorName: string;
  date: string;
}

async function getPublicEntries(): Promise<PublicEntryCard[]> {
  try {
    const supabase = createAdminClient();

    const { data: entries, error } = await supabase
      .from("entries")
      .select("id, title, content, type, tags, created_at, author_id, family_id")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !entries || entries.length === 0) return [];

    // Batch-resolve author names
    const authorIds = [...new Set(entries.map((e) => e.author_id).filter(Boolean))] as string[];
    const authorMap = new Map<string, string>();

    if (authorIds.length > 0) {
      const { data: members } = await supabase
        .from("family_members")
        .select("user_id, display_name")
        .in("user_id", authorIds);

      if (members) {
        for (const m of members) {
          if (!authorMap.has(m.user_id)) {
            authorMap.set(m.user_id, m.display_name);
          }
        }
      }
    }

    return entries.map((entry: any) => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      type: entry.type as EntryType,
      tags: entry.tags ?? [],
      authorName: authorMap.get(entry.author_id) ?? "A family member",
      date: entry.created_at,
    }));
  } catch (err) {
    console.error("Failed to fetch public entries:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function ExplorePage() {
  const entries = await getPublicEntries();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-5xl">
          <Link href="/" className="text-xl font-bold font-serif tracking-tight">
            MAI Legacy
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-8 max-w-5xl text-center">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight">
          Explore Family Knowledge
        </h1>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Discover stories, recipes, skills, and wisdom shared by families on
          MAI Legacy.
        </p>
      </section>

      {/* Entries grid */}
      <main className="container mx-auto px-4 pb-16 max-w-5xl">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              No public entries yet. Be the first to share!
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors mt-6"
            >
              Get Started Free
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => {
              const config = typeConfig[entry.type] ?? typeConfig.general;
              return (
                <Link key={entry.id} href={`/p/${entry.id}`} className="group">
                  <Card className="h-full transition-shadow hover:shadow-md group-hover:border-primary/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs shrink-0 ${config.color}`}
                        >
                          {config.emoji} {config.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-snug mt-2 group-hover:text-primary transition-colors">
                        {entry.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {truncate(entry.content.replace(/\n+/g, " "), 120)}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {entry.authorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {entry.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{entry.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center space-y-4">
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold font-serif">
            Start preserving your family&apos;s legacy
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Document your family&apos;s stories, recipes, skills, and wisdom
            before they&apos;re forgotten.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </main>
    </div>
  );
}
