"use client";

import { useState } from "react";
import {
  BookOpen,
  UtensilsCrossed,
  Lightbulb,
  Wrench,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReviewableEntry } from "@/lib/interview/types";

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  story: { label: "Story", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: BookOpen },
  recipe: { label: "Recipe", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: UtensilsCrossed },
  lesson: { label: "Lesson", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Lightbulb },
  skill: { label: "Skill", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Wrench },
  connection: { label: "Connection", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400", icon: Users },
  general: { label: "General", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: FileText },
};

interface EntryReviewCardProps {
  entry: ReviewableEntry;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateContent: (id: string, content: string) => void;
}

export function EntryReviewCard({
  entry,
  onToggleSelect,
  onRemove,
  onUpdateTitle,
  onUpdateContent,
}: EntryReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.general;
  const Icon = config.icon;

  // Preview: first 2 lines
  const contentLines = entry.content.split("\n").filter(Boolean);
  const preview = contentLines.slice(0, 2).join(" ");
  const hasMoreContent = contentLines.length > 2 || entry.content.length > 200;

  return (
    <Card
      className={`transition-all ${
        entry.selected
          ? "border-primary/30 bg-background"
          : "border-border/50 bg-muted/20 opacity-60"
      }`}
    >
      <CardContent className="p-4">
        {/* Top Row */}
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onToggleSelect(entry.id)}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              entry.selected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary/50"
            }`}
          >
            {entry.selected && <Check className="w-3 h-3" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Type Badge + Title */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </span>

              {editingTitle ? (
                <input
                  type="text"
                  defaultValue={entry.title}
                  autoFocus
                  className="text-sm font-semibold bg-muted/50 border border-border rounded px-2 py-0.5 flex-1 min-w-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
                  onBlur={(e) => {
                    onUpdateTitle(entry.id, e.target.value);
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onUpdateTitle(entry.id, e.currentTarget.value);
                      setEditingTitle(false);
                    }
                    if (e.key === "Escape") {
                      setEditingTitle(false);
                    }
                  }}
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left"
                  title="Click to edit title"
                >
                  {entry.title}
                </button>
              )}
            </div>

            {/* Content Preview / Full */}
            {expanded ? (
              <textarea
                value={entry.content}
                onChange={(e) => onUpdateContent(entry.id, e.target.value)}
                className="w-full mt-2 p-3 text-sm bg-muted/30 border border-border rounded-lg resize-y min-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {preview}
              </p>
            )}

            {/* Tags */}
            {entry.tags.length > 0 && expanded && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Structured Data Preview */}
            {expanded &&
              entry.structured_data &&
              Object.keys(entry.structured_data).length > 0 && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Structured Data
                  </p>
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {JSON.stringify(entry.structured_data, null, 2)}
                  </pre>
                </div>
              )}

            {/* Expand Toggle */}
            {hasMoreContent && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(entry.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
