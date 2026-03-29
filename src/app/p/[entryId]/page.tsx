import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { typeConfig } from "@/lib/entry-type-config";
import { createAdminClient } from "@/lib/supabase/server";

import { RecipeView } from "@/components/entry-views/recipe-view";
import { ConnectionView } from "@/components/entry-views/connection-view";
import { SkillView } from "@/components/entry-views/skill-view";
import { StoryView } from "@/components/entry-views/story-view";
import { LessonView } from "@/components/entry-views/lesson-view";
import type { EntryType, EntryStructuredData, EntryVisibility } from "@/types/database";

// ---------------------------------------------------------------------------
// UUID validation
// ---------------------------------------------------------------------------
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "http://localhost:3000";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Data fetching (uses admin client — no auth required)
// ---------------------------------------------------------------------------
async function getPublicEntry(id: string) {
  if (!UUID_REGEX.test(id)) return null;

  try {
    const supabase = createAdminClient();

    const { data: entry, error } = await supabase
      .from("entries")
      .select(
        "id, title, content, type, tags, structured_data, created_at, author_id, family_id, visibility"
      )
      .eq("id", id)
      .single();

    if (error || !entry) return null;

    // Only show entries with visibility = 'link' or 'public'
    const visibility = (entry.visibility as EntryVisibility) ?? "family";
    if (visibility === "family") return null;

    // Resolve author display name
    let authorName = "A family member";
    if (entry.author_id) {
      const { data: member } = await supabase
        .from("family_members")
        .select("display_name")
        .eq("user_id", entry.author_id)
        .eq("family_id", entry.family_id)
        .maybeSingle();
      if (member?.display_name) authorName = member.display_name;
    }

    return {
      id: entry.id as string,
      title: entry.title as string,
      content: entry.content as string,
      type: entry.type as EntryType,
      tags: (entry.tags ?? []) as string[],
      authorName,
      date: entry.created_at as string,
      structuredData: (entry.structured_data ?? null) as EntryStructuredData,
    };
  } catch (err) {
    console.error("Failed to fetch public entry:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// OG metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ entryId: string }>;
}): Promise<Metadata> {
  const { entryId } = await params;

  if (!UUID_REGEX.test(entryId)) {
    return { title: "Entry | MAI Legacy" };
  }

  try {
    const supabase = createAdminClient();
    const { data: entry } = await supabase
      .from("entries")
      .select("title, type, visibility")
      .eq("id", entryId)
      .single();

    if (!entry) return { title: "Entry | MAI Legacy" };

    const visibility = (entry.visibility as string) ?? "family";
    if (visibility === "family") return { title: "Entry | MAI Legacy" };

    const config = typeConfig[entry.type as EntryType] ?? typeConfig.general;
    const siteUrl = getSiteUrl();

    return {
      title: `${entry.title} | MAI Legacy`,
      description: `${config.emoji} ${config.label} preserved on MAI Legacy`,
      openGraph: {
        title: entry.title,
        description: `${config.emoji} ${config.label} preserved on MAI Legacy`,
        images: [
          {
            url: `${siteUrl}/api/share/${entryId}`,
            width: 1200,
            height: 630,
            alt: entry.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: entry.title,
        description: `${config.emoji} ${config.label} preserved on MAI Legacy`,
        images: [`${siteUrl}/api/share/${entryId}`],
      },
    };
  } catch {
    return { title: "Entry | MAI Legacy" };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function PublicEntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const entry = await getPublicEntry(entryId);

  if (!entry) {
    notFound();
  }

  const config = typeConfig[entry.type];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-3xl">
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

      {/* Entry Content */}
      <main className="container mx-auto py-10 px-4 max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="space-y-3">
              <Badge
                variant="secondary"
                className={`text-xs ${config.color}`}
              >
                {config.emoji} {config.label}
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl leading-tight">
                {entry.title}
              </CardTitle>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5">
                <User className="size-3.5" />
                {entry.authorName}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {formatDate(entry.date)}
              </span>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            {/* Type-specific content rendering */}
            {entry.type === "recipe" ? (
              <RecipeView
                entry={{
                  title: entry.title,
                  content: entry.content,
                  structured_data: entry.structuredData,
                }}
              />
            ) : entry.type === "connection" ? (
              <ConnectionView
                entry={{
                  title: entry.title,
                  content: entry.content,
                  structured_data: entry.structuredData,
                }}
              />
            ) : entry.type === "skill" ? (
              <SkillView
                entry={{
                  title: entry.title,
                  content: entry.content,
                  structured_data: entry.structuredData,
                }}
              />
            ) : entry.type === "story" ? (
              <StoryView
                entry={{
                  title: entry.title,
                  content: entry.content,
                  structured_data: entry.structuredData,
                }}
              />
            ) : entry.type === "lesson" ? (
              <LessonView
                entry={{
                  title: entry.title,
                  content: entry.content,
                  structured_data: entry.structuredData,
                }}
              />
            ) : (
              <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
                {entry.content.split("\n\n").map((paragraph: string, index: number) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </CardContent>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <>
              <Separator />
              <CardContent className="pt-4 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Tags:
                  </span>
                  {entry.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center space-y-4 pb-8">
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold font-serif">
            Create your family legacy
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Preserve your family&apos;s stories, recipes, skills, and wisdom for
            generations to come.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Explore Entries
            </Link>
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            Shared via MAI Legacy
          </p>
        </div>
      </main>
    </div>
  );
}
