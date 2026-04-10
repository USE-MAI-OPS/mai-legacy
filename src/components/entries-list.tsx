"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  Wrench,
  ChefHat,
  GraduationCap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EntryCard } from "@/components/entry-card";
import { typeConfig } from "@/lib/entry-type-config";
import type { EntryType, EntryStructuredData, SkillData, RecipeData, LessonData } from "@/types/database";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface EntryListItem {
  id: string;
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  authorName: string;
  date: string;
  structured_data?: EntryStructuredData;
  is_mature?: boolean;
}

interface EntriesListProps {
  entries: EntryListItem[];
}

// ---------------------------------------------------------------------------
// Icon map (resolved at client level since typeConfig stores strings)
// ---------------------------------------------------------------------------
const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Wrench,
  ChefHat,
  GraduationCap,
  Users,
  FileText,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStoryLengthCategory(content: string): string {
  const len = content.length;
  if (len < 500) return "short";
  if (len < 1500) return "medium";
  return "long";
}

function getDifficulty(entry: EntryListItem): string | null {
  if (!entry.structured_data?.data) return null;
  if (entry.type === "skill") return (entry.structured_data.data as SkillData).difficulty ?? null;
  if (entry.type === "recipe") return (entry.structured_data.data as RecipeData).difficulty ?? null;
  return null;
}

function getTaughtBy(entry: EntryListItem): string | null {
  if (entry.type !== "lesson" || !entry.structured_data?.data) return null;
  return (entry.structured_data.data as LessonData).taught_by?.trim() || null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EntriesList({ entries }: EntriesListProps) {
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type") ?? "";
  const urlQuery = searchParams.get("q") ?? "";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [typeFilter, setTypeFilter] = useState<string>(urlType || "all");
  const [subFilter, setSubFilter] = useState<string>("all");

  // Sync state when URL params change
  useEffect(() => {
    if (urlType) setTypeFilter(urlType);
    if (urlQuery) setSearchQuery(urlQuery);
  }, [urlType, urlQuery]);

  // Reset sub-filter when type changes
  useEffect(() => {
    setSubFilter("all");
  }, [typeFilter]);

  // Build dynamic lesson filters from taught_by values
  const lessonFilters = useMemo(() => {
    if (typeFilter !== "lesson") return null;
    const lessonEntries = entries.filter((e) => e.type === "lesson");
    const taughtBySet = new Set<string>();
    for (const e of lessonEntries) {
      const tb = getTaughtBy(e);
      if (tb) taughtBySet.add(tb);
    }
    if (taughtBySet.size === 0) return null;
    return [
      { value: "all", label: "All" },
      ...[...taughtBySet].sort().map((name) => ({ value: name, label: name })),
    ];
  }, [entries, typeFilter]);

  // Get active filter options for current type
  const activeFilterOptions = useMemo(() => {
    if (typeFilter === "all") return null;
    if (typeFilter === "lesson") return lessonFilters;
    const config = typeConfig[typeFilter as EntryType];
    return config?.filterOptions ?? null;
  }, [typeFilter, lessonFilters]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesType = typeFilter === "all" || entry.type === typeFilter;

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        query === "" ||
        entry.title.toLowerCase().includes(query) ||
        entry.content.toLowerCase().includes(query) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        entry.authorName.toLowerCase().includes(query);

      if (!matchesType || !matchesSearch) return false;

      // Sub-filter
      if (subFilter !== "all" && typeFilter !== "all") {
        if (typeFilter === "skill" || typeFilter === "recipe") {
          const difficulty = getDifficulty(entry);
          if (difficulty !== subFilter) return false;
        }
        if (typeFilter === "story") {
          const category = getStoryLengthCategory(entry.content);
          if (category !== subFilter) return false;
        }
        if (typeFilter === "lesson") {
          const tb = getTaughtBy(entry);
          if (tb !== subFilter) return false;
        }
      }

      return true;
    });
  }, [entries, searchQuery, typeFilter, subFilter]);

  const isFiltered = typeFilter !== "all";
  const activeConfig = isFiltered ? typeConfig[typeFilter as EntryType] : null;
  const TypeIcon = activeConfig ? iconMap[activeConfig.iconName] : null;
  const typeCount = isFiltered
    ? entries.filter((e) => e.type === typeFilter).length
    : entries.length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {isFiltered && activeConfig ? (
        /* ---- Type-specific directory header ---- */
        <div className="space-y-6 mb-8">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              {TypeIcon && (
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <TypeIcon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold font-serif tracking-tight">
                    {activeConfig.directoryTitle}
                  </h1>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold">
                    {typeCount} {activeConfig.pluralLabel}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {activeConfig.subtitle}
                </p>
              </div>
            </div>
            <Button className="rounded-full shrink-0" asChild>
              <Link href={`/entries/new`}>
                <Plus className="h-4 w-4 mr-2" />
                {activeConfig.addLabel}
              </Link>
            </Button>
          </div>

          {/* Search + filter pills */}
          <div className="space-y-3">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeConfig.pluralLabel.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {activeFilterOptions && activeFilterOptions.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {activeFilterOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={subFilter === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSubFilter(opt.value)}
                    className="rounded-full capitalize"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ---- Generic "Archives" header ---- */
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold font-serif tracking-tight">Archives</h1>
              <p className="text-muted-foreground mt-1">
                Stories, skills, recipes, and wisdom passed down through your family.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/entries/import-interview">
                  <FileText className="size-4 mr-2" />
                  Import Interview
                </Link>
              </Button>
              <Button asChild>
                <Link href="/entries/new">
                  <Plus className="size-4 mr-2" />
                  Add Memory
                </Link>
              </Button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="story">
                  <span className="flex items-center gap-2">📖 Stories</span>
                </SelectItem>
                <SelectItem value="skill">
                  <span className="flex items-center gap-2">🛠️ Skills</span>
                </SelectItem>
                <SelectItem value="recipe">
                  <span className="flex items-center gap-2">🍳 Recipes</span>
                </SelectItem>
                <SelectItem value="lesson">
                  <span className="flex items-center gap-2">🎓 Lessons</span>
                </SelectItem>
                <SelectItem value="connection">
                  <span className="flex items-center gap-2">🤝 Connections</span>
                </SelectItem>
                <SelectItem value="general">
                  <span className="flex items-center gap-2">📝 General</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Entries grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              id={entry.id}
              title={entry.title}
              content={entry.content}
              type={entry.type}
              tags={entry.tags}
              authorName={entry.authorName}
              date={entry.date}
              structured_data={entry.structured_data}
              is_mature={entry.is_mature}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-4 text-center md:col-span-2">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BookOpen className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No memories found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {searchQuery || typeFilter !== "all"
              ? "Try adjusting your search or filter to find what you're looking for."
              : "Start preserving your family's knowledge by adding your first memory."}
          </p>
          {!searchQuery && typeFilter === "all" && (
            <Button asChild>
              <Link href="/entries/new">
                <Plus className="size-4 mr-2" />
                Create your first memory
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton (for Suspense)
// ---------------------------------------------------------------------------
export function EntriesPageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 p-5 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex items-center gap-2 pt-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="w-full h-40 sm:w-[40%] sm:h-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
