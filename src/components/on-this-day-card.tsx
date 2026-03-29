"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, X, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { typeConfig } from "@/lib/entry-type-config";
import type { OnThisDayEntry } from "@/app/api/on-this-day/route";
import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDismissKey(): string {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `on-this-day-dismissed-${today.getFullYear()}-${mm}-${dd}`;
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

// ---------------------------------------------------------------------------
// OnThisDayCard
// ---------------------------------------------------------------------------
export function OnThisDayCard() {
  const [items, setItems] = useState<OnThisDayEntry[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage dismissal for today
    if (typeof window !== "undefined") {
      const key = getDismissKey();
      if (localStorage.getItem(key) === "1") {
        setDismissed(true);
        setLoaded(true);
        return;
      }
    }

    fetch("/api/on-this-day")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      localStorage.setItem(getDismissKey(), "1");
    }
    setDismissed(true);
  }

  // Don't render until loaded; don't render if dismissed or no items
  if (!loaded || dismissed || items.length === 0) return null;

  const today = new Date();
  const monthName = today.toLocaleDateString("en-US", { month: "long" });
  const dayNum = today.getDate();

  return (
    <Card className="overflow-hidden border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              On This Day
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70">
              {monthName} {dayNum} in family history
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="h-7 w-7 rounded-full flex items-center justify-center text-amber-500/60 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Entries */}
      <CardContent className="px-4 pb-4 pt-1 space-y-2">
        {items.map((item) => {
          const config = typeConfig[item.type as EntryType] ?? typeConfig.general;
          const yearsLabel =
            item.years_ago === 1 ? "1 year ago" : `${item.years_ago} years ago`;

          return (
            <Link
              key={item.id}
              href={`/entries/${item.id}`}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/70 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 border border-amber-100 dark:border-amber-800/30 transition-all group"
            >
              {/* Year badge */}
              <div className="shrink-0 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 whitespace-nowrap">
                  {yearsLabel}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 rounded-full border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400"
                  >
                    {config.emoji} {config.label}
                  </Badge>
                  {item.is_mature && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0">
                      21+
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold font-serif leading-snug line-clamp-1 text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {truncate(item.content)}
                </p>
                <p className="text-[10px] text-amber-600/60 dark:text-amber-500/60 mt-1">
                  by {item.author_name}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-amber-400 dark:text-amber-600 shrink-0 mt-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
