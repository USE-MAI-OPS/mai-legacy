"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(text: string, maxLength: number = 140): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Build a card summary that describes what the entry IS or what you'll learn.
 * Avoids showing the personal story/narrative — focuses on substance.
 */
function getSummary(
  type: EntryType,
  structured_data: EntryStructuredData | undefined,
  content: string
): string {
  if (!structured_data || !structured_data.data) {
    return truncate(content);
  }

  const d = structured_data.data;

  switch (type) {
    case "skill": {
      const s = d as SkillData;
      const parts: string[] = [];
      // Lead with difficulty
      const diff = s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1);
      // Summarise what you'll learn from the steps
      if (s.steps?.length > 0) {
        const stepNames = s.steps.map((st) => st.title).filter(Boolean);
        if (stepNames.length > 0) {
          parts.push(`${diff}-level · ${s.steps.length} steps: ${stepNames.join(", ")}`);
        } else {
          parts.push(`${diff}-level skill with ${s.steps.length} step${s.steps.length > 1 ? "s" : ""}`);
        }
      } else {
        parts.push(`${diff}-level skill`);
      }
      if (s.what_you_need?.length > 0)
        parts.push(`Requires: ${s.what_you_need.slice(0, 4).join(", ")}${s.what_you_need.length > 4 ? "…" : ""}`);
      if (s.prerequisites?.length > 0)
        parts.push(`Prerequisites: ${s.prerequisites.join(", ")}`);
      return truncate(parts.join(". ") + ".");
    }
    case "recipe": {
      const r = d as RecipeData;
      const parts: string[] = [];
      if (r.cuisine) parts.push(r.cuisine);
      if (r.difficulty) parts.push(r.difficulty);
      const meta: string[] = [];
      if (r.servings) meta.push(`Serves ${r.servings}`);
      if (r.prep_time) meta.push(`${r.prep_time} prep`);
      if (r.cook_time) meta.push(`${r.cook_time} cook`);
      if (meta.length > 0) parts.push(meta.join(" · "));
      if (r.ingredients?.length > 0)
        parts.push(`${r.ingredients.length} ingredient${r.ingredients.length > 1 ? "s" : ""}`);
      if (r.instructions?.length > 0)
        parts.push(`${r.instructions.length} step${r.instructions.length > 1 ? "s" : ""}`);
      return parts.length > 0
        ? truncate(parts.join(" · ") + ".")
        : truncate(content);
    }
    case "story": {
      const st = d as StoryData;
      const parts: string[] = [];
      if (st.location) parts.push(st.location);
      if (st.year) parts.push(st.year);
      if (st.people_involved?.length > 0)
        parts.push(`Featuring ${st.people_involved.join(", ")}`);
      // If we have enough context, use it; otherwise fall back to content
      if (parts.length > 0) return truncate(parts.join(" · "));
      return truncate(content);
    }
    case "lesson": {
      const l = d as LessonData;
      const parts: string[] = [];
      // Lead with the actual lesson
      if (l.lesson_text?.trim()) parts.push(l.lesson_text.trim());
      else if (l.key_takeaways?.length > 0)
        parts.push(l.key_takeaways.join(". "));
      // Add who taught it
      if (l.taught_by?.trim()) parts.push(`Taught by ${l.taught_by.trim()}`);
      if (l.when_learned?.trim()) parts.push(l.when_learned.trim());
      return parts.length > 0 ? truncate(parts.join(" · ")) : truncate(content);
    }
    case "connection": {
      const c = d as ConnectionData;
      const parts: string[] = [];
      if (c.name) parts.push(c.name);
      if (c.relationship) parts.push(c.relationship);
      if (c.birthday) parts.push(`Birthday: ${c.birthday}`);
      if (c.notes?.trim()) parts.push(c.notes.trim());
      return parts.length > 0 ? truncate(parts.join(" · ")) : truncate(content);
    }
    default:
      return truncate(content);
  }
}

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
  const summary = getSummary(type, structured_data, content);
  const router = useRouter();

  // Generate a pseudo-random brand color for the fallback cover
  const colors = [
    "bg-[#2C4835] text-white", // Forest Green
    "bg-[#8B4513] text-white", // Terracotta
    "bg-amber-700 text-white", // Warm Amber
    "bg-stone-800 text-white"  // Slate/Charcoal
  ];
  const colorIndex = title.length % colors.length;
  const coverColor = colors[colorIndex];

  // Extract first image from structured_data if available
  const firstImage = structured_data?.data && 'images' in structured_data.data
    ? (structured_data.data as any).images?.[0] as string | undefined
    : undefined;

  return (
    <Link href={`/entries/${id}`} className="group flex flex-col sm:flex-row gap-6 border-b border-border/60 pb-8 mb-8 last:border-0 last:mb-0 transition-all hover:bg-muted/30 p-4 -mx-4 rounded-xl">

      {/* Cover: show entry image if available, otherwise colored fallback */}
      {firstImage ? (
        <div className="w-full sm:w-56 h-48 sm:h-auto rounded-xl shrink-0 shadow-sm relative overflow-hidden">
          <img src={firstImage} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`w-full sm:w-56 h-48 sm:h-auto rounded-xl flex items-center justify-center p-6 text-center shrink-0 shadow-sm ${coverColor} relative overflow-hidden`}>
          {/* Subtle noise/texture overlay for premium feel */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] mix-blend-multiply pointer-events-none" />
          <h3 className="font-serif font-bold text-xl sm:text-2xl leading-tight opacity-95 line-clamp-4 relative z-10 w-full break-words">
            {title}
          </h3>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 py-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-2xl font-bold font-serif leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/entries/${id}/edit`);
              }}
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Edit ${title}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            {is_mature && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">21+</Badge>
            )}
            <Badge variant="secondary" className={`text-xs px-2.5 py-0.5 rounded-full ${config.color}`}>
              {config.emoji} {config.label}
            </Badge>
          </div>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed line-clamp-3 mb-6 pr-4">
          {summary}
        </p>

        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[11px] px-2 py-0.5 rounded-full bg-background"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-muted-foreground self-center">+{tags.length - 3} more</span>
              )}
            </div>
          ) : (
            <div />
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold shrink-0">
            <span className="truncate max-w-[120px]">{authorName}</span>
            <span aria-hidden="true" className="text-muted-foreground/40">&bull;</span>
            <span className="whitespace-nowrap">{formatDate(date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export { typeConfig } from "@/lib/entry-type-config";
