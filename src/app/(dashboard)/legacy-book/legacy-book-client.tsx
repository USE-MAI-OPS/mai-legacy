"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Download, Lock, CheckSquare, Square, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { LegacyBookEntryItem } from "./page";
import type { PlanTierKey } from "@/lib/stripe";

// ---------------------------------------------------------------------------
// Entry type display helpers
// ---------------------------------------------------------------------------
const TYPE_LABELS: Record<string, string> = {
  story: "Story",
  skill: "Skill",
  recipe: "Recipe",
  lesson: "Lesson",
  connection: "Connection",
  general: "General",
};

const TYPE_COLORS: Record<string, string> = {
  story: "bg-blue-100 text-blue-800",
  skill: "bg-green-100 text-green-800",
  recipe: "bg-orange-100 text-orange-800",
  lesson: "bg-purple-100 text-purple-800",
  connection: "bg-pink-100 text-pink-800",
  general: "bg-gray-100 text-gray-800",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface LegacyBookClientProps {
  familyId: string;
  familyName: string;
  entries: LegacyBookEntryItem[];
  isLocked: boolean;
  currentTier: PlanTierKey;
}

// ---------------------------------------------------------------------------
// Paywall screen
// ---------------------------------------------------------------------------
function PaywallScreen({ currentTier }: { currentTier: PlanTierKey }) {
  return (
    <div className="container mx-auto max-w-3xl py-16 px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
        <Lock className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Legacy Book</h1>
      <p className="text-muted-foreground text-lg mb-2">
        Turn your family&apos;s stories into a beautiful keepsake PDF book.
      </p>
      <p className="text-muted-foreground mb-8">
        Available on the <strong>Roots</strong> plan and above.
        {currentTier === "seedling" && " You&apos;re currently on the free Seedling plan."}
      </p>

      <div className="bg-card border rounded-xl p-8 mb-8 text-left space-y-4 max-w-md mx-auto">
        <h2 className="font-semibold text-lg text-center mb-2">What&apos;s included</h2>
        {[
          "Beautifully formatted cover page",
          "Auto-generated table of contents",
          "One page per entry with full text",
          "Author attribution and dates",
          "Entry tags and categories",
          "Print-ready A4 PDF format",
        ].map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <Button asChild size="lg" className="gap-2">
        <Link href="/pricing">
          Upgrade to Roots — $9/mo
        </Link>
      </Button>
      <p className="text-xs text-muted-foreground mt-4">Cancel anytime. No commitment.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function LegacyBookClient({
  familyId,
  familyName,
  entries,
  isLocked,
  currentTier,
}: LegacyBookClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(entries.map((e) => e.id))
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const allSelected = selectedIds.size === entries.length;
  const selectedCount = selectedIds.size;

  const selectedEntries = useMemo(
    () => entries.filter((e) => selectedIds.has(e.id)),
    [entries, selectedIds]
  );

  if (isLocked) {
    return <PaywallScreen currentTier={currentTier} />;
  }

  function toggleEntry(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e.id)));
    }
  }

  async function handleGenerate() {
    if (selectedCount === 0) {
      toast.error("Select at least one entry to include.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/legacy-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          entryIds: allSelected ? undefined : Array.from(selectedIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate PDF");
      }

      // Stream download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `${familyName}_Legacy_Book.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Legacy Book downloaded!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  if (entries.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl py-16 px-4 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Legacy Book</h1>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have any memories yet. Add some stories, recipes, or skills to create your Legacy Book.
        </p>
        <Button asChild>
          <Link href="/entries/new">Add Your First Memory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-6 w-6 text-amber-600" />
            <h1 className="text-3xl font-bold">Legacy Book</h1>
          </div>
          <p className="text-muted-foreground">
            Select the entries to include in your keepsake PDF.
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2 shrink-0"
          onClick={handleGenerate}
          disabled={isGenerating || selectedCount === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF ({selectedCount})
            </>
          )}
        </Button>
      </div>

      {/* Preview card */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1b69] rounded-xl p-6 mb-8 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c8a96e] mb-1">
            Preview
          </p>
          <h2 className="text-xl font-bold">{familyName}</h2>
          <p className="text-sm text-white/70 mt-1">Legacy Book · {selectedCount} {selectedCount === 1 ? "memory" : "memories"}</p>
        </div>
        <BookOpen className="h-12 w-12 text-[#c8a96e] opacity-80" />
      </div>

      {/* Select all */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {selectedCount} of {entries.length} entries selected
        </p>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Entry list */}
      <div className="space-y-2">
        {entries.map((entry) => {
          const isSelected = selectedIds.has(entry.id);
          return (
            <button
              key={entry.id}
              onClick={() => toggleEntry(entry.id)}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium truncate">{entry.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      TYPE_COLORS[entry.type] ?? TYPE_COLORS.general
                    }`}
                  >
                    {TYPE_LABELS[entry.type] ?? entry.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {entry.authorName} · {formatDate(entry.date)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom CTA */}
      {selectedCount > 0 && (
        <div className="sticky bottom-6 mt-8 flex justify-center">
          <Button
            size="lg"
            className="gap-2 shadow-lg"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating your Legacy Book…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Legacy Book ({selectedCount} {selectedCount === 1 ? "memory" : "memories"})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
