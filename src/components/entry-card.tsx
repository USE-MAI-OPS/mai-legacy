"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, FileText, Clock } from "lucide-react";
import { typeConfig } from "@/lib/entry-type-config";
import type {
  EntryType,
  EntryStructuredData,
  SkillData,
  RecipeData,
  StoryData,
  LessonData,
  ConnectionData,
} from "@/types/database";

export interface EntryCardProps {
  id: string;
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  authorName: string;
  date: string;
  structured_data?: EntryStructuredData;
  is_mature?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek} week${diffWeek > 1 ? "s" : ""} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? "s" : ""} ago`;
}

function truncate(text: string, maxLength: number = 140): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Get the difficulty/level badge for an entry */
function getDifficultyBadge(
  type: EntryType,
  structured_data?: EntryStructuredData
): { label: string; color: string } | null {
  if (!structured_data?.data) return null;

  if (type === "skill") {
    const d = (structured_data.data as SkillData).difficulty;
    if (!d) return null;
    const colors: Record<string, string> = {
      beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return { label: d.charAt(0).toUpperCase() + d.slice(1), color: colors[d] ?? "" };
  }

  if (type === "recipe") {
    const d = (structured_data.data as RecipeData).difficulty;
    if (!d) return null;
    const colors: Record<string, string> = {
      easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return { label: d.charAt(0).toUpperCase() + d.slice(1), color: colors[d] ?? "" };
  }

  return null;
}

/** Get type-specific metadata for the card footer */
function getEntryMetadata(
  type: EntryType,
  structured_data?: EntryStructuredData
): { icon: "steps" | "time"; parts: string[] } | null {
  if (!structured_data?.data) return null;

  switch (type) {
    case "skill": {
      const s = structured_data.data as SkillData;
      const parts: string[] = [];
      if (s.steps?.length) parts.push(`${s.steps.length} steps`);
      if (s.steps?.length) parts.push(`~${s.steps.length * 10} min estimated`);
      return parts.length > 0 ? { icon: "steps", parts } : null;
    }
    case "recipe": {
      const r = structured_data.data as RecipeData;
      const parts: string[] = [];
      if (r.ingredients?.length) parts.push(`${r.ingredients.length} ingredients`);
      if (r.prep_time) parts.push(`${r.prep_time} prep`);
      else if (r.cook_time) parts.push(`${r.cook_time} cook`);
      return parts.length > 0 ? { icon: "steps", parts } : null;
    }
    case "story": {
      const st = structured_data.data as StoryData;
      const parts: string[] = [];
      if (st.location) parts.push(st.location);
      if (st.year) parts.push(st.year);
      return parts.length > 0 ? { icon: "time", parts } : null;
    }
    case "lesson": {
      const l = structured_data.data as LessonData;
      if (l.taught_by?.trim()) return { icon: "time", parts: [`Taught by ${l.taught_by.trim()}`] };
      return null;
    }
    case "connection": {
      const c = structured_data.data as ConnectionData;
      if (c.relationship?.trim()) return { icon: "time", parts: [c.relationship.trim()] };
      return null;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntryCard({
  id,
  title,
  content,
  type,
  tags,
  authorName,
  date,
  structured_data,
  is_mature,
}: EntryCardProps) {
  const config = typeConfig[type];
  const router = useRouter();
  const diffBadge = getDifficultyBadge(type, structured_data);
  const metadata = getEntryMetadata(type, structured_data);

  // Cover image from structured data
  const firstImage =
    structured_data?.data && "images" in structured_data.data
      ? (structured_data.data as { images?: string[] }).images?.[0]
      : undefined;

  // Fallback cover color
  const colors = [
    "bg-[#2C4835] text-white",
    "bg-[#8B4513] text-white",
    "bg-amber-700 text-white",
    "bg-stone-800 text-white",
  ];
  const coverColor = colors[title.length % colors.length];

  return (
    <Link
      href={`/entries/${id}`}
      className="group block rounded-xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Left: Content */}
        <div className="flex-1 p-5 flex flex-col gap-2.5 min-w-0">
          {/* Type + difficulty badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}
              >
                {config.emoji} {config.label}
              </Badge>
              {is_mature && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  21+
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {diffBadge && (
                <Badge
                  variant="secondary"
                  className={`text-xs capitalize ${diffBadge.color}`}
                >
                  {diffBadge.label}
                </Badge>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/entries/${id}/edit`);
                }}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Edit ${title}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-serif font-bold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {truncate(content, 160)}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 mt-auto pt-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground">
                {getInitials(authorName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <span className="font-medium text-foreground">{authorName}</span>
              <span className="text-muted-foreground ml-1.5">{timeAgo(date)}</span>
            </div>
          </div>

          {/* Metadata */}
          {metadata && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {metadata.parts[0]}
              </span>
              {metadata.parts[1] && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {metadata.parts[1]}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Image */}
        <div className="w-full h-48 sm:w-[40%] sm:h-auto shrink-0 relative order-first sm:order-last">
          {firstImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center p-6 text-center ${coverColor} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] mix-blend-multiply pointer-events-none" />
              <h4 className="font-serif font-bold text-lg sm:text-xl leading-tight opacity-90 line-clamp-3 relative z-10 break-words">
                {title}
              </h4>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export { typeConfig } from "@/lib/entry-type-config";
