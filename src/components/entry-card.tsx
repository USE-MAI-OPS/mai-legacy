import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

const typeConfig: Record<
  EntryType,
  { label: string; emoji: string; color: string }
> = {
  story: {
    label: "Story",
    emoji: "\uD83D\uDCD6",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  skill: {
    label: "Skill",
    emoji: "\uD83D\uDEE0\uFE0F",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  recipe: {
    label: "Recipe",
    emoji: "\uD83C\uDF73",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  lesson: {
    label: "Lesson",
    emoji: "\uD83C\uDF93",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  connection: {
    label: "Connection",
    emoji: "\uD83E\uDD1D",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  },
  general: {
    label: "General",
    emoji: "\uD83D\uDCDD",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300",
  },
};

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
}: EntryCardProps) {
  const config = typeConfig[type];
  const summary = getSummary(type, structured_data, content);

  return (
    <Link href={`/entries/${id}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug group-hover:text-primary/80 transition-colors">
              {title}
            </CardTitle>
            <Badge
              variant="secondary"
              className={`shrink-0 text-xs ${config.color}`}
            >
              {config.emoji} {config.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {summary}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[11px] px-1.5 py-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
            <span className="font-medium">{authorName}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{formatDate(date)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export { typeConfig };
