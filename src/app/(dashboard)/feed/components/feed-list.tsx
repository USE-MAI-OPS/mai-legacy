"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  BookOpen,
  GraduationCap,
  Wrench,
  UtensilsCrossed,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { typeConfig } from "@/lib/entry-type-config";
import type { FeedItem, FeedEntry, FeedPrompt, FeedEvent } from "@/app/api/feed/route";
import type { EntryType, EntryStructuredData } from "@/types/database";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FeedListProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return "Yesterday";
  if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string, max: number = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

function getEntrySummary(entry: FeedEntry): string {
  const sd = entry.structured_data as EntryStructuredData | null;
  if (!sd?.data) return truncate(entry.content);

  switch (entry.type) {
    case "recipe": {
      const r = sd.data as { cuisine?: string; difficulty?: string; servings?: string };
      const parts: string[] = [];
      if (r.cuisine) parts.push(r.cuisine);
      if (r.difficulty) parts.push(r.difficulty);
      if (r.servings) parts.push(`Serves ${r.servings}`);
      return parts.length > 0 ? parts.join(" · ") : truncate(entry.content);
    }
    case "story": {
      const s = sd.data as { location?: string; year?: string; people_involved?: string[] };
      const parts: string[] = [];
      if (s.location) parts.push(s.location);
      if (s.year) parts.push(s.year);
      if (s.people_involved?.length) parts.push(`Featuring ${s.people_involved.join(", ")}`);
      return parts.length > 0 ? parts.join(" · ") : truncate(entry.content);
    }
    default:
      return truncate(entry.content);
  }
}

const promptIcons: Record<string, React.ReactNode> = {
  utensils: <UtensilsCrossed className="h-5 w-5" />,
  wrench: <Wrench className="h-5 w-5" />,
  "book-open": <BookOpen className="h-5 w-5" />,
  "graduation-cap": <GraduationCap className="h-5 w-5" />,
};

// ---------------------------------------------------------------------------
// Feed Entry Card
// ---------------------------------------------------------------------------
function FeedEntryCard({ item }: { item: FeedEntry }) {
  const config = typeConfig[item.type as EntryType] ?? typeConfig.general;
  const summary = getEntrySummary(item);

  // Extract first image
  const sd = item.structured_data as EntryStructuredData | null;
  const firstImage =
    sd?.data && "images" in sd.data
      ? (sd.data as { images?: string[] }).images?.[0]
      : undefined;

  return (
    <Link href={`/entries/${item.id}`} className="block group">
      <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
        {firstImage && (
          <div className="h-48 overflow-hidden">
            <img
              src={firstImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        )}
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="secondary"
              className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}
            >
              {config.emoji} {config.label}
            </Badge>
            {item.is_mature && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                21+
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-bold font-serif leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
            {summary}
          </p>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 rounded-full"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{item.author_name}</span>
            <span className="text-muted-foreground/40">&bull;</span>
            <span>{formatDate(item.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Event Card
// ---------------------------------------------------------------------------
function FeedEventCard({ item }: { item: FeedEvent }) {
  return (
    <Link href="/family" className="block group">
      <Card className="overflow-hidden border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                Upcoming Event
              </p>
              <h3 className="text-lg font-bold font-serif leading-snug mb-1 line-clamp-1">
                {item.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatEventDate(item.event_date)}
                </span>
                {item.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {item.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Prompt Card
// ---------------------------------------------------------------------------
function FeedPromptCard({ item }: { item: FeedPrompt }) {
  return (
    <Card className="overflow-hidden border-dashed border-2 border-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04] transition-all hover:border-primary/40">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            {promptIcons[item.icon] ?? <BookOpen className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold font-serif leading-snug mb-1">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {item.body}
            </p>
            <Button size="sm" variant="outline" className="rounded-full" asChild>
              <Link href={item.action_url}>
                Get started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Feed List (with infinite scroll)
// ---------------------------------------------------------------------------
export function FeedList({ initialItems, initialCursor }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}&limit=20`);
      if (!res.ok) throw new Error("Feed fetch failed");
      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold mb-1">Your feed is empty</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            Start by adding entries to your family legacy. Your family's
            stories, recipes, skills, and lessons will appear here.
          </p>
          <Button asChild>
            <Link href="/entries/new">Add your first entry</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        switch (item.kind) {
          case "entry":
            return <FeedEntryCard key={item.id} item={item} />;
          case "event":
            return <FeedEventCard key={`event-${item.id}`} item={item} />;
          case "prompt":
            return <FeedPromptCard key={item.id} item={item} />;
          default:
            return null;
        }
      })}

      {/* Infinite scroll sentinel */}
      {cursor && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
