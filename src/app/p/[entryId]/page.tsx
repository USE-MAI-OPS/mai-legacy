import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User } from "lucide-react";
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const coverGradients: Record<string, string> = {
  recipe: "bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900",
  story: "bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900",
  skill: "bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900",
  lesson: "bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900",
};

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

  // Extract hero image from structured data if available
  const sd = entry.structuredData;
  const firstImage =
    sd?.data && "images" in sd.data
      ? (sd.data as { images?: string[] }).images?.[0]
      : undefined;

  const gradient =
    coverGradients[entry.type] ??
    "bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900";

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Nav */}
      <header>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif font-bold text-lg text-[#C17B54]">
            MAI Legacy
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[#C17B54] hover:text-[#C17B54]/80"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Image */}
        <div className="max-w-2xl mx-auto mt-8 px-4">
          {firstImage ? (
            <div className="rounded-xl overflow-hidden shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={firstImage}
                alt={entry.title}
                className="aspect-video object-cover w-full"
              />
            </div>
          ) : (
            <div
              className={`rounded-xl overflow-hidden shadow-sm aspect-video flex items-center justify-center ${gradient}`}
            >
              <span className="text-6xl opacity-40">{config.emoji}</span>
            </div>
          )}
        </div>

        {/* Content Card */}
        <div className="max-w-2xl mx-auto mt-8 px-4">
          {/* Type badge */}
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold inline-block ${config.color}`}
          >
            {config.emoji} {config.label}
          </span>

          {/* Title */}
          <h1 className="text-3xl font-serif font-bold mt-3">
            {entry.title}
          </h1>

          {/* Author + Date */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3 mb-6">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" />
              {entry.authorName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {formatDate(entry.date)}
            </span>
          </div>

          {/* Body */}
          <article className="prose prose-lg dark:prose-invert max-w-none font-serif">
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
              <div>
                {entry.content.split("\n\n").map((paragraph: string, index: number) => {
                  const trimmed = paragraph.trim();
                  if (
                    trimmed.startsWith(">") ||
                    (trimmed.startsWith('"') && trimmed.endsWith('"'))
                  ) {
                    const text = trimmed.startsWith(">")
                      ? trimmed.slice(1).trim()
                      : trimmed.slice(1, -1);
                    return (
                      <blockquote
                        key={index}
                        className="border-l-4 border-[#C17B54] pl-4 italic font-serif text-lg my-4"
                      >
                        {text}
                      </blockquote>
                    );
                  }
                  return (
                    <p
                      key={index}
                      className="font-serif text-base leading-relaxed mb-4"
                    >
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            )}
          </article>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {entry.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="max-w-2xl mx-auto mt-16 text-center px-4">
          <h2 className="text-2xl font-serif font-bold">
            Start preserving your family&apos;s stories
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Create a lasting heirloom of memories, wisdom, and connections for
            the next generation.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-[#C17B54] hover:bg-[#C17B54]/90 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors inline-flex items-center justify-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/explore"
              className="border border-input rounded-full px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors inline-flex items-center justify-center"
            >
              Explore More Memories
            </Link>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-6">
            SHARED VIA 📖 MAI LEGACY · THE FAMILY KNOWLEDGE PLATFORM
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 pt-8 pb-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div>
            <p className="font-serif font-bold">MAI Legacy</p>
            <p className="text-xs text-muted-foreground">
              © 2024 MAI Legacy. Preserving the soul of the digital heirloom.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
