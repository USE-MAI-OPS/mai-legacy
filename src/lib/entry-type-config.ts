import type { EntryType } from "@/types/database";

/**
 * Shared type configuration for entry badges and directory views.
 * Kept in a plain (non-"use client") module so both server and client
 * components can import and use it.
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface TypeConfigEntry {
  label: string;
  emoji: string;
  color: string;
  pluralLabel: string;
  directoryTitle: string;
  subtitle: string;
  addLabel: string;
  iconName: string;
  filterOptions: FilterOption[] | null;
  hidden?: boolean;
}

export const typeConfig: Record<EntryType, TypeConfigEntry> = {
  story: {
    label: "Story",
    emoji: "\uD83D\uDCD6",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    pluralLabel: "Stories",
    directoryTitle: "Stories Archive",
    subtitle: "The narratives that shape who we are as a family.",
    addLabel: "Add a Story",
    iconName: "BookOpen",
    filterOptions: [
      { value: "all", label: "All" },
      { value: "short", label: "Short" },
      { value: "medium", label: "Medium" },
      { value: "long", label: "Long" },
    ],
  },
  skill: {
    label: "Skill",
    emoji: "\uD83D\uDEE0\uFE0F",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    pluralLabel: "Skills",
    directoryTitle: "Skills Directory",
    subtitle: "Preserving the practical wisdom of our ancestors.",
    addLabel: "Add a Skill",
    iconName: "Wrench",
    filterOptions: [
      { value: "all", label: "All" },
      { value: "beginner", label: "Beginner" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
    ],
  },
  recipe: {
    label: "Recipe",
    emoji: "\uD83C\uDF73",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    pluralLabel: "Recipes",
    directoryTitle: "Recipe Collection",
    subtitle: "Culinary traditions passed down through generations.",
    addLabel: "Add a Recipe",
    iconName: "ChefHat",
    filterOptions: [
      { value: "all", label: "All" },
      { value: "easy", label: "Easy" },
      { value: "medium", label: "Medium" },
      { value: "hard", label: "Hard" },
    ],
  },
  lesson: {
    label: "Lesson",
    emoji: "\uD83C\uDF93",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    pluralLabel: "Lessons",
    directoryTitle: "Life Lessons",
    subtitle: "Wisdom and teachings from those who came before.",
    addLabel: "Add a Lesson",
    iconName: "GraduationCap",
    // Lesson filters are built dynamically from taught_by values
    filterOptions: null,
    hidden: true,
  },
  connection: {
    label: "Connection",
    emoji: "\uD83E\uDD1D",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
    pluralLabel: "Connections",
    directoryTitle: "Family Connections",
    subtitle: "The people and relationships that bind us together.",
    addLabel: "Add a Connection",
    iconName: "Users",
    filterOptions: null,
  },
  general: {
    label: "General",
    emoji: "\uD83D\uDCDD",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300",
    pluralLabel: "General",
    directoryTitle: "General Memories",
    subtitle: "Important notes and reference materials for the family.",
    addLabel: "Add a Memory",
    iconName: "FileText",
    filterOptions: null,
  },
};
