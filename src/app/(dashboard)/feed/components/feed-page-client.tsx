"use client";

import { useState, useCallback } from "react";
import { FamilyStrip } from "./family-strip";
import { StatsStrip } from "./stats-strip";
import { WelcomeCard } from "./welcome-card";
import { FeedList } from "./feed-list";
import { OnThisDayCard } from "@/components/on-this-day-card";
import type { FamilyMember } from "./family-strip";
import type { FeedStats } from "./stats-strip";
import type { FeedItem } from "@/app/api/feed/route";

interface FeedPageClientProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  members: FamilyMember[];
  stats: FeedStats;
  familyName: string;
}

export function FeedPageClient({
  initialItems,
  initialCursor,
  members,
  stats,
  familyName,
}: FeedPageClientProps) {
  const [filteredMemberId, setFilteredMemberId] = useState<string | null>(null);

  // Filter items by selected member
  const displayItems = filteredMemberId
    ? initialItems.filter(
        (item) =>
          item.kind !== "entry" || item.author_id === filteredMemberId
      )
    : initialItems;

  const handleFilterByMember = useCallback((userId: string | null) => {
    setFilteredMemberId(userId);
  }, []);

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

      {/* On This Day */}
      <OnThisDayCard />

      {/* Feed */}
      <FeedList
        initialItems={displayItems}
        initialCursor={filteredMemberId ? null : initialCursor}
      />
    </>
  );
}
