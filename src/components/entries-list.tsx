"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { EntryType, EntryStructuredData } from "@/types/database";

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
}

interface EntriesListProps {
  entries: EntryListItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EntriesList({ entries }: EntriesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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

      return matchesType && matchesSearch;
    });
  }, [entries, searchQuery, typeFilter]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Entries</h1>
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
              Add Entry
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
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
              <span className="flex items-center gap-2">
                {"\uD83D\uDCD6"} Stories
              </span>
            </SelectItem>
            <SelectItem value="skill">
              <span className="flex items-center gap-2">
                {"\uD83D\uDEE0\uFE0F"} Skills
              </span>
            </SelectItem>
            <SelectItem value="recipe">
              <span className="flex items-center gap-2">
                {"\uD83C\uDF73"} Recipes
              </span>
            </SelectItem>
            <SelectItem value="lesson">
              <span className="flex items-center gap-2">
                {"\uD83C\uDF93"} Lessons
              </span>
            </SelectItem>
            <SelectItem value="connection">
              <span className="flex items-center gap-2">
                {"\uD83E\uDD1D"} Connections
              </span>
            </SelectItem>
            <SelectItem value="general">
              <span className="flex items-center gap-2">
                {"\uD83D\uDCDD"} General
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entries grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BookOpen className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No entries found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {searchQuery || typeFilter !== "all"
              ? "Try adjusting your search or filter to find what you're looking for."
              : "Start preserving your family's knowledge by creating your first entry."}
          </p>
          {!searchQuery && typeFilter === "all" && (
            <Button asChild>
              <Link href="/entries/new">
                <Plus className="size-4 mr-2" />
                Create your first entry
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex gap-2 items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
