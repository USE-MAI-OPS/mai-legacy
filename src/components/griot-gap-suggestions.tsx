"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import posthog from "posthog-js";
import { getCurrentFamilyId } from "@/lib/griot";
import type { GapSuggestion } from "@/lib/gap-detection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GapsApiResponse {
  gaps: GapSuggestion[];
  counts: Record<string, number>;
}

interface GriotGapSuggestionsProps {
  /**
   * Called when the user clicks a gap suggestion's Griot prompt button.
   * The parent (Griot page) can use this to pre-fill the chat input.
   */
  onAskGriot?: (prompt: string) => void;
  /** Whether to show the heading (omit if embedding inline in a larger card) */
  showHeading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function GriotGapSuggestions({
  onAskGriot,
  showHeading = true,
}: GriotGapSuggestionsProps) {
  const [gaps, setGaps] = useState<GapSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const familyId = await getCurrentFamilyId();
        if (!familyId) {
          if (!cancelled) setLoading(false);
          return;
        }
        const res = await fetch(`/api/griot/gaps?familyId=${familyId}`);
        if (!res.ok) throw new Error("Failed to load gaps");
        const data: GapsApiResponse = await res.json();
        if (!cancelled) setGaps(data.gaps);
      } catch {
        // Silently fail — gaps are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || gaps.length === 0) return null;

  function handleCreateClick(gap: GapSuggestion) {
    posthog.capture("griot_gap_create_clicked", {
      entry_type: gap.type,
      current_count: gap.currentCount,
      prompt: gap.prompt,
    });
  }

  function handleAskGriotClick(gap: GapSuggestion) {
    posthog.capture("griot_gap_ask_griot_clicked", {
      entry_type: gap.type,
      current_count: gap.currentCount,
    });
    onAskGriot?.(gap.griotSuggestion);
  }

  return (
    <div className="w-full">
      {showHeading && (
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-foreground">
            Your family&apos;s knowledge gaps
          </p>
        </div>
      )}

      <div className="space-y-2">
        {gaps.map((gap) => (
          <div
            key={gap.type}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20"
          >
            <span className="text-xl shrink-0 mt-0.5" role="img" aria-label={gap.label}>
              {gap.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug mb-2">
                {gap.prompt}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={gap.createHref}
                  onClick={() => handleCreateClick(gap)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add {gap.label.replace(/s$/, "")}
                </Link>
                {onAskGriot && (
                  <button
                    onClick={() => handleAskGriotClick(gap)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="h-3 w-3" />
                    Ask the Griot
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/entries"
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        View all entries
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
