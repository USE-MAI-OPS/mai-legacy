import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EntryType } from "@/types/database";

export interface EntryCardProps {
  id: string;
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  authorName: string;
  date: string;
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

function truncateContent(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function EntryCard({
  id,
  title,
  content,
  type,
  tags,
  authorName,
  date,
}: EntryCardProps) {
  const config = typeConfig[type];

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
            {truncateContent(content)}
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
