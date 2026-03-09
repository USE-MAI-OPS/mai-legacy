"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
  MapPin,
  Sparkles,
  Heart,
  Trophy,
  Shield,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtractedProfileUpdates } from "@/lib/interview/types";

interface ProfileItem {
  category: string;
  label: string;
  value: unknown;
  selected: boolean;
}

interface ProfileUpdatesSectionProps {
  subjectName: string;
  updates: ExtractedProfileUpdates;
  selectedItems: Record<string, boolean>;
  onToggleItem: (key: string) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  career: { label: "Career", icon: Briefcase },
  education: { label: "Education", icon: GraduationCap },
  places_lived: { label: "Places Lived", icon: MapPin },
  skills: { label: "Skills", icon: Sparkles },
  hobbies: { label: "Hobbies", icon: Heart },
  milestones: { label: "Milestones", icon: Trophy },
  military: { label: "Military Service", icon: Shield },
};

function formatItemDisplay(category: string, item: unknown): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return String(item);

  const obj = item as Record<string, string>;

  switch (category) {
    case "career":
      return `${obj.job_title || "Unknown Role"}${obj.company ? ` at ${obj.company}` : ""}${obj.years ? ` (${obj.years})` : ""}`;
    case "education":
      return `${obj.school || "Unknown School"}${obj.degree ? ` — ${obj.degree}` : ""}${obj.year ? ` (${obj.year})` : ""}`;
    case "places_lived":
      return `${obj.location || "Unknown Location"}${obj.years ? ` (${obj.years})` : ""}`;
    case "milestones":
      return `${obj.event || "Unknown Event"}${obj.year ? ` (${obj.year})` : ""}`;
    case "military":
      return `${obj.branch || "Unknown Branch"}${obj.rank ? ` — ${obj.rank}` : ""}${obj.years ? ` (${obj.years})` : ""}`;
    default:
      return JSON.stringify(item);
  }
}

export function ProfileUpdatesSection({
  subjectName,
  updates,
  selectedItems,
  onToggleItem,
}: ProfileUpdatesSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Build flat list of all profile update items
  const allItems: ProfileItem[] = [];

  for (const [category, value] of Object.entries(updates)) {
    if (Array.isArray(value) && value.length > 0) {
      value.forEach((item, index) => {
        const key = `${category}.${index}`;
        allItems.push({
          category,
          label: formatItemDisplay(category, item),
          value: item,
          selected: selectedItems[key] !== false, // default to selected
        });
      });
    } else if (
      category === "military" &&
      value !== null &&
      value !== undefined
    ) {
      const key = "military.0";
      allItems.push({
        category,
        label: formatItemDisplay(category, value),
        value,
        selected: selectedItems[key] !== false,
      });
    }
  }

  if (allItems.length === 0) return null;

  const selectedCount = allItems.filter((item) => item.selected).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full"
        >
          <CardTitle className="text-base">
            Suggested profile updates for {subjectName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedCount} of {allItems.length} selected
            </span>
            {collapsed ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {Object.entries(CATEGORY_CONFIG).map(
              ([category, { label, icon: Icon }]) => {
                const categoryItems = allItems.filter(
                  (item) => item.category === category
                );
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {label}
                      </span>
                    </div>
                    <div className="space-y-1 ml-6">
                      {categoryItems.map((item, idx) => {
                        const key = `${category}.${idx}`;
                        const isSelected = selectedItems[key] !== false;

                        return (
                          <button
                            key={key}
                            onClick={() => onToggleItem(key)}
                            className="flex items-center gap-2 w-full text-left py-1 group"
                          >
                            <span
                              className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-muted-foreground/30 group-hover:border-primary/50"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </span>
                            <span
                              className={`text-sm ${
                                isSelected
                                  ? "text-foreground"
                                  : "text-muted-foreground line-through"
                              }`}
                            >
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
