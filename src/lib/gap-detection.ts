/**
 * Griot Gap Detection
 *
 * Analyzes a family's entry distribution and returns contextual suggestions
 * for missing or sparse entry types.
 */

import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Config: thresholds and messages per entry type
// ---------------------------------------------------------------------------

export interface GapConfig {
  type: EntryType;
  label: string;
  minCount: number; // suggest if below this count
  /** Short prompt shown in the gap card */
  prompt: string;
  /** Longer description shown as Griot suggestion text */
  griotSuggestion: string;
  /** Emoji for the card UI */
  emoji: string;
  /** URL to create a new entry of this type */
  createHref: string;
}

const GAP_CONFIGS: GapConfig[] = [
  {
    type: "recipe",
    label: "Recipes",
    minCount: 2,
    prompt: "Your family has no recipes — want to add one?",
    griotSuggestion:
      "I noticed your family hasn't preserved any recipes yet. Recipes are one of the most meaningful things families pass down — would you like to add one now?",
    emoji: "🍲",
    createHref: "/entries/new?type=recipe",
  },
  {
    type: "story",
    label: "Stories",
    minCount: 2,
    prompt: "No family stories yet — share one to get started.",
    griotSuggestion:
      "Your family's history hasn't been written here yet. Stories connect generations — even a short one can mean everything. Want to add a family story?",
    emoji: "📖",
    createHref: "/entries/new?type=story",
  },
  {
    type: "skill",
    label: "Skills",
    minCount: 1,
    prompt: "Preserve a skill or how-to from someone in your family.",
    griotSuggestion:
      "Your family hasn't documented any skills or how-to guides yet. These are the practical wisdoms that get lost — consider preserving one before it's forgotten.",
    emoji: "🔧",
    createHref: "/entries/new?type=skill",
  },
  {
    type: "lesson",
    label: "Lessons",
    minCount: 1,
    prompt: "No life lessons recorded yet — what wisdom should be passed down?",
    griotSuggestion:
      "Every family has hard-won wisdom to pass on, but none has been recorded here yet. A lesson learned is a gift to every future generation. Want to add one?",
    emoji: "💡",
    createHref: "/entries/new?type=lesson",
  },
  {
    type: "connection",
    label: "Connections",
    minCount: 1,
    prompt: "Document a family connection or relationship story.",
    griotSuggestion:
      "Your family hasn't documented any connection stories yet — the discoveries, reunions, and bonds that define you. These are often the most powerful entries to preserve.",
    emoji: "🤝",
    createHref: "/entries/new?type=connection",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FamilyEntryCounts {
  [type: string]: number;
}

export interface GapSuggestion {
  type: EntryType;
  label: string;
  prompt: string;
  griotSuggestion: string;
  emoji: string;
  createHref: string;
  currentCount: number;
}

// ---------------------------------------------------------------------------
// Core detection function
// ---------------------------------------------------------------------------

/**
 * Given the count of each entry type, return gap suggestions sorted by
 * priority (zero-count types first, then low-count types).
 *
 * @param counts  - map of entry type → count
 * @param maxResults - max number of suggestions to return (default 3)
 */
export function detectGaps(
  counts: FamilyEntryCounts,
  maxResults = 3
): GapSuggestion[] {
  const suggestions: GapSuggestion[] = [];

  for (const config of GAP_CONFIGS) {
    const current = counts[config.type] ?? 0;
    if (current < config.minCount) {
      suggestions.push({
        type: config.type,
        label: config.label,
        prompt: config.prompt,
        griotSuggestion: config.griotSuggestion,
        emoji: config.emoji,
        createHref: config.createHref,
        currentCount: current,
      });
    }
  }

  // Sort: zero-count first, then ascending by count
  suggestions.sort((a, b) => a.currentCount - b.currentCount);

  return suggestions.slice(0, maxResults);
}

/**
 * Build a Griot-friendly prompt string that surfaces the top gap.
 * Suitable for injecting into the Griot chat as a suggested question.
 */
export function buildGapPrompt(gap: GapSuggestion): string {
  return gap.griotSuggestion;
}
