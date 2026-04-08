"use client";

import { useState, useCallback, useRef, useEffect, useTransition } from "react";
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
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Link2,
  TrendingUp,
  Clock,
  HelpCircle,
  Trophy,
  Share2,
  Bookmark,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { typeConfig } from "@/lib/entry-type-config";
import { toggleReaction, addComment } from "@/app/(dashboard)/entries/social-actions";
import type { ReactionType } from "@/app/(dashboard)/entries/social-actions";
import type { FeedItem, FeedEntry, FeedPrompt, FeedEvent, FeedDiscovery, FeedGoal, FeedGriotInsight } from "@/app/api/feed/route";
import type { EntryType, EntryStructuredData } from "@/types/database";
import { GoalCard } from "./goal-card";
import { GriotInsightCard } from "./griot-insight-card";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FeedListProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  filterType?: string;
  searchQuery?: string;
  filterEventOnly?: boolean;
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
// Cover gradients — warm, rich defaults per entry type
// Each entry ALWAYS has a visual. If user uploaded a photo, show that.
// Otherwise show a beautiful gradient with the entry title overlaid.
// ---------------------------------------------------------------------------
const coverGradients: Record<string, string> = {
  recipe:
    "bg-gradient-to-br from-amber-800 via-orange-700 to-yellow-900",
  story:
    "bg-gradient-to-br from-stone-800 via-amber-900 to-stone-700",
  skill:
    "bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900",
  lesson:
    "bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900",
  connection:
    "bg-gradient-to-br from-rose-900 via-pink-800 to-red-900",
  general:
    "bg-gradient-to-br from-slate-800 via-gray-700 to-zinc-800",
};

const coverEmojis: Record<string, string> = {
  recipe: "\uD83C\uDF73",
  story: "\uD83D\uDCD6",
  skill: "\uD83D\uDEE0\uFE0F",
  lesson: "\uD83C\uDF93",
  connection: "\uD83E\uDD1D",
  general: "\uD83D\uDCDD",
};

// ---------------------------------------------------------------------------
// Inline reaction config
// ---------------------------------------------------------------------------
const FEED_REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "heart", emoji: "\u2764\uFE0F", label: "Love" },
  { type: "pray", emoji: "\uD83D\uDE4F", label: "Amen" },
  { type: "laugh", emoji: "\uD83D\uDE02", label: "Haha" },
  { type: "cry", emoji: "\uD83D\uDE22", label: "Touched" },
  { type: "fire", emoji: "\uD83D\uDD25", label: "Fire" },
];

// ---------------------------------------------------------------------------
// Feed Entry Card — image-first, with inline reactions + quick comment
// ---------------------------------------------------------------------------
function FeedEntryCard({ item }: { item: FeedEntry }) {
  const config = typeConfig[item.type as EntryType] ?? typeConfig.general;
  const summary = getEntrySummary(item);
  const [isPending, startTransition] = useTransition();
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  const [localReactionCount, setLocalReactionCount] = useState(item.reaction_count);
  const [localCommentCount, setLocalCommentCount] = useState(item.comment_count);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Extract first image from structured_data
  const sd = item.structured_data as EntryStructuredData | null;
  const firstImage =
    sd?.data && "images" in sd.data
      ? (sd.data as { images?: string[] }).images?.[0]
      : undefined;

  const gradient = coverGradients[item.type] ?? coverGradients.general;
  const emoji = coverEmojis[item.type] ?? coverEmojis.general;

  function handleReaction(e: React.MouseEvent, type: ReactionType) {
    e.preventDefault();
    e.stopPropagation();
    const wasActive = activeReaction === type;
    setActiveReaction(wasActive ? null : type);
    setLocalReactionCount((c) => c + (wasActive ? -1 : activeReaction ? 0 : 1));
    startTransition(async () => {
      await toggleReaction(item.id, type);
    });
  }

  function handleCommentToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowCommentInput(!showCommentInput);
    if (!showCommentInput) {
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  }

  function handleSubmitComment(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!commentText.trim()) return;
    startTransition(async () => {
      await addComment(item.id, commentText);
      setCommentText("");
      setLocalCommentCount((c) => c + 1);
      setShowCommentInput(false);
    });
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 duration-300">
      {/* Clickable hero + content area */}
      <Link href={`/entries/${item.id}`} className="block group">
        {/* TOP BAR — author avatar + name + timestamp | type badge */}
        <CardContent className="p-3 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {item.author_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <span className="font-medium text-foreground">{item.author_name}</span>
              <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
            </div>
            <Badge className={cn("text-xs px-2.5 py-0.5 rounded-full", config.color ?? "bg-primary/10 text-primary")}>
              {config.emoji} {config.label}
            </Badge>
          </div>
        </CardContent>

        {/* HERO IMAGE */}
        {firstImage ? (
          <div className="relative h-56 overflow-hidden mt-3">
            <img
              src={firstImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
            {item.is_mature && (
              <div className="absolute top-3 right-3">
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shadow-sm">21+</Badge>
              </div>
            )}
          </div>
        ) : (
          <div className={`relative h-56 overflow-hidden mt-3 ${gradient}`}>
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <div className="absolute top-4 right-4 text-5xl opacity-20 select-none">{emoji}</div>
            {item.is_mature && (
              <div className="absolute top-3 right-3">
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shadow-sm">21+</Badge>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="text-lg text-white/70 font-serif italic text-center line-clamp-2">
                {item.type === "recipe" ? "A family recipe" :
                 item.type === "story" ? "A family story" :
                 item.type === "skill" ? "A family skill" :
                 item.type === "lesson" ? "A life lesson" :
                 item.type === "connection" ? "A family connection" :
                 "A family entry"}
              </p>
            </div>
          </div>
        )}

        {/* Below image — title + preview */}
        <CardContent className="p-4 pb-2">
          <h3 className="text-lg font-semibold leading-snug mb-1 line-clamp-2">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-2">
            {summary}
          </p>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Link>

      {/* Reaction + comment counts */}
      {(localReactionCount > 0 || localCommentCount > 0) && (
        <div className="px-5 pb-1 flex items-center gap-3 text-xs text-muted-foreground">
          {localReactionCount > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
              {localReactionCount}
            </span>
          )}
          {localCommentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {localCommentCount}
            </span>
          )}
        </div>
      )}

      {/* Engagement row — reactions + share/bookmark */}
      <div className="px-3 py-2 border-t flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {FEED_REACTIONS.map(({ type, emoji: rxEmoji }) => (
            <button
              key={type}
              onClick={(e) => handleReaction(e, type)}
              disabled={isPending}
              className={cn(
                "px-2 py-1 rounded-full text-base transition-all hover:scale-110",
                activeReaction === type
                  ? "bg-primary/10 scale-110"
                  : "hover:bg-muted"
              )}
              title={type}
            >
              {rxEmoji}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCommentToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            title="Bookmark"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick comment input */}
      {showCommentInput && (
        <div className="px-4 pb-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitComment(e);
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Write a comment..."
            className="flex-1 text-sm bg-muted/50 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSubmitComment}
            disabled={isPending || !commentText.trim()}
            className="rounded-full h-8 w-8 p-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Event Card
// ---------------------------------------------------------------------------
function FeedEventCard({ item }: { item: FeedEvent }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        {/* Top: System Notification label + EVENT badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">System Notification</span>
          </div>
          <Badge className="bg-[#C17B54] text-white text-[10px] px-2 py-0.5 rounded-full border-0">
            EVENT
          </Badge>
        </div>

        {/* Center: event name + date/location */}
        <Link href="/family" className="block group">
          <h3 className="text-xl font-bold font-serif leading-snug mb-2 group-hover:text-[#C17B54] transition-colors line-clamp-2">
            {item.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-[#C17B54] mb-4">
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
        </Link>

        {/* Buttons: RSVP Yes + Details */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => toast("RSVP sent!", { description: `You RSVP'd Yes to ${item.title}` })}
            className="bg-[#C17B54] text-white rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-[#A8684A] transition-colors"
          >
            RSVP Yes
          </button>
          <button
            onClick={() => toast("Event details coming soon!")}
            className="rounded-full px-4 py-1.5 text-xs font-semibold border border-border hover:bg-muted transition-colors"
          >
            Details
          </button>
        </div>

        {/* Bottom: engagement row */}
        <div className="flex items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            0
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            0
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
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
// Discovery Card — AI-generated Griot insight
// ---------------------------------------------------------------------------
const discoveryIcons: Record<string, React.ReactNode> = {
  connection: <Link2 className="h-5 w-5" />,
  pattern: <TrendingUp className="h-5 w-5" />,
  on_this_day: <Clock className="h-5 w-5" />,
  missing_piece: <HelpCircle className="h-5 w-5" />,
  milestone: <Trophy className="h-5 w-5" />,
};

const discoveryLabels: Record<string, string> = {
  connection: "Griot found a connection",
  pattern: "Griot spotted a pattern",
  on_this_day: "On this day",
  missing_piece: "A piece of your story is missing",
  milestone: "Family milestone",
};

const discoveryGradients: Record<string, string> = {
  connection: "from-indigo-600 via-purple-600 to-blue-700",
  pattern: "from-teal-600 via-cyan-600 to-emerald-700",
  on_this_day: "from-amber-600 via-orange-600 to-yellow-700",
  missing_piece: "from-rose-600 via-pink-600 to-red-700",
  milestone: "from-yellow-500 via-amber-500 to-orange-600",
};

function FeedDiscoveryCard({ item }: { item: FeedDiscovery }) {
  const icon = discoveryIcons[item.discovery_type] ?? <Sparkles className="h-5 w-5" />;
  const label = discoveryLabels[item.discovery_type] ?? "Griot Discovery";
  const gradient = discoveryGradients[item.discovery_type] ?? "from-indigo-600 to-purple-700";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg duration-300 border-0">
      <div className={`bg-gradient-to-br ${gradient} p-5 text-white`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
            {label}
          </span>
        </div>

        <h3 className="text-lg font-bold font-serif leading-snug mb-2">
          {item.title}
        </h3>

        <p className="text-sm text-white/85 leading-relaxed mb-4">
          {item.body}
        </p>

        {item.related_members.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.related_members.map((name) => (
              <Badge
                key={name}
                className="bg-white/20 text-white border-white/30 text-[10px] px-2 py-0 rounded-full backdrop-blur-sm"
              >
                {name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/60">
            {icon}
            <span className="text-xs">{formatDate(item.created_at)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Feed List (with infinite scroll)
// ---------------------------------------------------------------------------
export function FeedList({ initialItems, initialCursor, filterType, searchQuery, filterEventOnly }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(
    // If we got no initial items but have a filter/search, we need to fetch
    initialItems.length === 0 && (!!filterType || !!searchQuery || !!filterEventOnly)
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);

  // Build the query string for API calls
  const buildUrl = useCallback(
    (pageCursor?: string) => {
      const params = new URLSearchParams();
      if (pageCursor) params.set("cursor", pageCursor);
      params.set("limit", "20");
      if (filterType) params.set("type", filterType);
      if (searchQuery) params.set("q", searchQuery);
      return `/api/feed?${params.toString()}`;
    },
    [filterType, searchQuery]
  );

  // Initial fetch when filter/search is active (since we start with empty items)
  useEffect(() => {
    if (!initialLoading || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    (async () => {
      try {
        const res = await fetch(buildUrl());
        if (!res.ok) throw new Error("Feed fetch failed");
        const data = await res.json();
        let fetchedItems: FeedItem[] = data.items;
        if (filterEventOnly) {
          fetchedItems = fetchedItems.filter((item: FeedItem) => item.kind === "event");
        }
        setItems(fetchedItems);
        setCursor(filterEventOnly ? null : data.nextCursor);
      } catch (err) {
        console.error("Initial filter fetch error:", err);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [initialLoading, buildUrl, filterEventOnly]);

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return;
    setLoading(true);

    try {
      const res = await fetch(buildUrl(cursor));
      if (!res.ok) throw new Error("Feed fetch failed");
      const data = await res.json();
      let newItems: FeedItem[] = data.items;
      if (filterEventOnly) {
        newItems = newItems.filter((item: FeedItem) => item.kind === "event");
      }
      setItems((prev) => [...prev, ...newItems]);
      setCursor(filterEventOnly ? null : data.nextCursor);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, buildUrl, filterEventOnly]);

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

  if (initialLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    const isSearching = !!filterType || !!searchQuery || !!filterEventOnly;
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold mb-1">
            {isSearching ? "No results found" : "Your feed is empty"}
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            {isSearching
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Start by adding entries to your family legacy. Your family's stories, recipes, skills, and lessons will appear here."}
          </p>
          {!isSearching && (
            <Button asChild>
              <Link href="/entries/new">Add your first entry</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => {
        switch (item.kind) {
          case "entry":
            return <FeedEntryCard key={item.id} item={item} />;
          case "event":
            return <FeedEventCard key={`event-${item.id}`} item={item} />;
          case "prompt":
            return <FeedPromptCard key={item.id} item={item} />;
          case "discovery":
            return <FeedDiscoveryCard key={`discovery-${item.id}`} item={item} />;
          case "goal":
            return <GoalCard key={`goal-${item.id}`} item={item} />;
          case "griot_insight":
            return <GriotInsightCard key={`insight-${item.id}`} item={item} />;
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
