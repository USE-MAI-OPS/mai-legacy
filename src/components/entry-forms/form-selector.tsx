"use client";

import {
  UtensilsCrossed,
  BookOpen,
  Wrench,
  GraduationCap,
  Users,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { EntryType } from "@/types/database";

interface EntryTypeOption {
  value: EntryType;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

const entryTypes: EntryTypeOption[] = [
  {
    value: "recipe",
    label: "Recipe",
    icon: UtensilsCrossed,
    description: "Share a family recipe",
    color: "text-orange-500",
  },
  {
    value: "story",
    label: "Story",
    icon: BookOpen,
    description: "Preserve a family memory",
    color: "text-blue-500",
  },
  {
    value: "skill",
    label: "Skill",
    icon: Wrench,
    description: "Document a how-to guide",
    color: "text-green-500",
  },
  {
    value: "lesson",
    label: "Lesson",
    icon: GraduationCap,
    description: "Capture wisdom & lessons",
    color: "text-purple-500",
  },
  {
    value: "connection",
    label: "Connection",
    icon: Users,
    description: "Family contacts & relationships",
    color: "text-pink-500",
  },
  {
    value: "general",
    label: "General",
    icon: FileText,
    description: "Any family knowledge",
    color: "text-gray-500",
  },
];

interface FormSelectorProps {
  onSelect: (type: EntryType) => void;
}

export default function FormSelector({ onSelect }: FormSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {entryTypes.map((entry) => {
        const Icon = entry.icon;
        return (
          <button
            key={entry.value}
            type="button"
            onClick={() => onSelect(entry.value)}
            className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div
              className={`rounded-full bg-muted p-3 transition-colors group-hover:bg-primary/10 ${entry.color}`}
            >
              <Icon className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">{entry.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {entry.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
