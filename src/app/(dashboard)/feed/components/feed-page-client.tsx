"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
import { FamilyStrip } from "./family-strip";
import { StatsStrip } from "./stats-strip";
import { WelcomeCard } from "./welcome-card";
import { FeedList } from "./feed-list";
import { OnThisDayCard } from "@/components/on-this-day-card";
import { cn } from "@/lib/utils";
import type { FamilyMember } from "./family-strip";
import type { FeedStats } from "./stats-strip";
import type { FeedItem } from "@/app/api/feed/route";

// ---------------------------------------------------------------------------
// Filter tab config
// ---------------------------------------------------------------------------
const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "story", label: "Stories" },
  { key: "recipe", label: "Recipes" },
  { key: "skill", label: "Skills" },
  { key: "lesson", label: "Lessons" },
  { key: "event", label: "Events" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

interface FeedPageClientProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  members: FamilyMember[];
  stats: FeedStats;
  familyName: string;
  currentUserId: string;
}

export function FeedPageClient({
  initialItems,
  initialCursor,
  members,
  stats,
  familyName,
  currentUserId,
}: FeedPageClientProps) {
  const [filteredMemberId, setFilteredMemberId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  // When a filter or search is active, we pass them to FeedList to refetch from API
  const isFiltered = activeFilter !== "all" || searchQuery.length > 0;

  // For member filtering, we still filter client-side on the initial items
  const displayItems = useMemo(() => {
    if (filteredMemberId) {
      return initialItems.filter(
        (item) =>
          item.kind !== "entry" || item.author_id === filteredMemberId
      );
    }
    return initialItems;
  }, [initialItems, filteredMemberId]);

  const handleFilterByMember = useCallback((userId: string | null) => {
    setFilteredMemberId(userId);
  }, []);

  function handleFilterChange(key: FilterKey) {
    setActiveFilter(key);
    setFilteredMemberId(null);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    // searchQuery state already drives the FeedList re-key
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSearchActive(false);
  }

  // Build API query params for FeedList
  const feedParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (activeFilter !== "all") {
      // "event" filter is special — we still fetch entries but also events show prominently
      if (activeFilter === "event") {
        // No type filter — events are already in the feed
        // We'll handle this by only showing event items client-side
      } else {
        params.type = activeFilter;
      }
    }
    if (searchQuery.trim()) {
      params.q = searchQuery.trim();
    }
    return params;
  }, [activeFilter, searchQuery]);

  // When filtering by "event", filter display items client-side
  const finalItems = useMemo(() => {
    if (activeFilter === "event") {
      return displayItems.filter((item) => item.kind === "event");
    }
    return displayItems;
  }, [displayItems, activeFilter]);

  // Use a key to force FeedList remount when filter/search changes
  const feedKey = `${activeFilter}-${searchQuery}-${filteredMemberId ?? "all"}`;

  return (
    <>
      {/* Welcome card for new users */}
      <WelcomeCard familyName={familyName} entryCount={stats.entries} />

      {/* Family members strip */}
      {members.length > 0 && (
        <FamilyStrip members={members} onFilterByMember={handleFilterByMember} />
      )}

      {/* Stats strip */}
      <StatsStrip stats={stats} />

      {/* Search bar */}
      <div className="mb-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchActive(true)}
            placeholder="Search memories, events, goals..."
            className="w-full bg-muted/50 border rounded-full pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </form>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-1 scrollbar-none -mx-1 px-1">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilterChange(key)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              activeFilter === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* On This Day — only on default view */}
      {!isFiltered && <OnThisDayCard />}

      {/* Feed */}
      <FeedList
        key={feedKey}
        initialItems={isFiltered ? [] : finalItems}
        initialCursor={isFiltered ? null : (filteredMemberId ? null : initialCursor)}
        filterType={activeFilter !== "all" && activeFilter !== "event" ? activeFilter : undefined}
        searchQuery={searchQuery.trim() || undefined}
        filterEventOnly={activeFilter === "event"}
        shareRecipients={members.filter((m) => m.user_id !== currentUserId)}
      />
    </>
  );
}
