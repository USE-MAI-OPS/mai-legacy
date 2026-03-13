import type { EntryType } from "@/types/database";

/**
 * Shared type configuration for entry badges.
 * Kept in a plain (non-"use client") module so both server and client
 * components can import and use it.
 */
export const typeConfig: Record<
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
