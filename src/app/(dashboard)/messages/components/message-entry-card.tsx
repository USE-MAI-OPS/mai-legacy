"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface MessageEntryCardProps {
  title: string;
  type: string;
  emoji: string;
  snippet: string;
}

const TYPE_COLORS: Record<string, string> = {
  Recipe: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Story: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Skill: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Lesson: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

export function MessageEntryCard({
  title,
  type,
  emoji,
  snippet,
}: MessageEntryCardProps) {
  return (
    <Link href="/entries" className="block mt-2">
      <div className="rounded-xl border border-border bg-card p-3 hover:bg-accent transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{emoji}</span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 ml-7">
          {snippet}
        </p>
        <div className="flex items-center gap-2 mt-1.5 ml-7">
          <Badge
            variant="secondary"
            className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS[type] ?? ""}`}
          >
            {type.toUpperCase()}
          </Badge>
          <span className="text-xs text-primary font-medium">
            View Entry &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

// Mock detection: check if a message content references an entry
const ENTRY_KEYWORDS: {
  keywords: string[];
  title: string;
  type: string;
  emoji: string;
  snippet: string;
}[] = [
  {
    keywords: ["cornbread", "recipe"],
    title: "Grandma Mae's Cornbread",
    type: "Recipe",
    emoji: "\uD83C\uDF5E",
    snippet: "The original cornbread recipe using buttermilk and a cast iron skillet.",
  },
  {
    keywords: ["reunion", "family reunion"],
    title: "Summer Reunion 2024",
    type: "Story",
    emoji: "\uD83D\uDCD6",
    snippet: "At the reunion we discussed family history and shared photographs.",
  },
  {
    keywords: ["faucet", "plumbing", "repair"],
    title: "How to Fix a Leaky Faucet",
    type: "Skill",
    emoji: "\uD83D\uDD27",
    snippet: "Uncle Robert's step-by-step guide to fixing leaky faucets.",
  },
];

export function detectEntryInMessage(content: string): MessageEntryCardProps | null {
  const lower = content.toLowerCase();
  for (const entry of ENTRY_KEYWORDS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return {
        title: entry.title,
        type: entry.type,
        emoji: entry.emoji,
        snippet: entry.snippet,
      };
    }
  }
  return null;
}
