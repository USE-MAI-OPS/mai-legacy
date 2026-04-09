"use client";

import Link from "next/link";
import { Share2, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface MessagesSharedPanelProps {
  otherName: string;
  conversationId: string | null;
}

const MOCK_SHARED_ENTRIES = [
  {
    title: "Grandma Mae's Cornbread",
    type: "Recipe",
    emoji: "\uD83C\uDF5E",
    date: "Mar 15",
    snippet: "The original cornbread recipe passed down from her mother in rural Georgia.",
  },
  {
    title: "Summer Reunion 2024",
    type: "Story",
    emoji: "\uD83D\uDCD6",
    date: "Feb 28",
    snippet: "At the reunion we discussed family history and shared old photographs.",
  },
  {
    title: "How to Fix a Leaky Faucet",
    type: "Skill",
    emoji: "\uD83D\uDD27",
    date: "Jan 10",
    snippet: "Uncle Robert's step-by-step guide learned from Grandpa James.",
  },
  {
    title: "Holiday Sweet Potato Pie",
    type: "Recipe",
    emoji: "\uD83E\uDD67",
    date: "Dec 22",
    snippet: "Mama's famous sweet potato pie, a Thanksgiving staple since 1975.",
  },
];

const TYPE_COLORS: Record<string, string> = {
  Recipe: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Story: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Skill: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export function MessagesSharedPanel({
  otherName,
  conversationId,
}: MessagesSharedPanelProps) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-border bg-card/50 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Share2 className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider truncate">
          {conversationId ? `Shared with ${otherName}` : "Shared Entries"}
        </span>
      </div>

      <ScrollArea className="flex-1">
        {!conversationId ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-serif italic text-muted-foreground leading-relaxed">
              Select a conversation to see shared entries
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {MOCK_SHARED_ENTRIES.map((entry) => (
              <Link
                key={entry.title}
                href="/entries"
                className="block rounded-lg border border-border bg-background p-3 hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{entry.emoji}</span>
                  <span className="text-sm font-semibold text-foreground truncate">
                    {entry.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed ml-7">
                  {entry.snippet}
                </p>
                <div className="flex items-center gap-2 mt-1.5 ml-7">
                  <Badge
                    variant="secondary"
                    className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS[entry.type] ?? ""}`}
                  >
                    {entry.type.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {entry.date}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
