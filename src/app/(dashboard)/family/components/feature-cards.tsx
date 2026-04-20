"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChefHat, Wrench, GraduationCap, Search } from "lucide-react";
import type { EntryType, HubType } from "@/types/database";

interface FeatureCardConfig {
  type: EntryType;
  title: string;
  countLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  placeholder: string;
}

/**
 * Build the three feature card configs, picking labels that match the
 * current hub type. Circles use "Our <X>" phrasing so the hub reads
 * as a shared space for whoever is in the circle, while families keep
 * the warmer "Family Kitchen / Shared Skills / Life Lessons" labels.
 */
function buildFeatureCards(hubType: HubType): FeatureCardConfig[] {
  const isCircle = hubType === "circle";
  return [
    {
      type: "recipe",
      title: isCircle ? "Our Kitchen" : "Family Kitchen",
      countLabel: "Recipes",
      icon: <ChefHat className="h-5 w-5" />,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      placeholder: "Search recipes...",
    },
    {
      type: "skill",
      title: isCircle ? "Our Skills" : "Shared Skills",
      countLabel: "Skills",
      icon: <Wrench className="h-5 w-5" />,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      placeholder: "Search skills...",
    },
    {
      type: "lesson",
      title: isCircle ? "Our Lessons" : "Life Lessons",
      countLabel: "Lessons",
      icon: <GraduationCap className="h-5 w-5" />,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      placeholder: "Search lessons...",
    },
  ];
}

interface FeatureCardsProps {
  entryCounts: Record<string, number>;
  hubType: HubType;
}

function FeatureCard({
  config,
  count,
}: {
  config: FeatureCardConfig;
  count: number;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("type", config.type);
    if (query.trim()) params.set("q", query.trim());
    router.push(`/entries?${params.toString()}`);
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4 space-y-3">
        {/* Icon + count row */}
        <div className="flex items-center justify-between">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bgColor} ${config.color}`}
          >
            {config.icon}
          </div>
          <p className="text-sm text-muted-foreground">
            {count} {config.countLabel}
          </p>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold">{config.title}</h3>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={config.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </form>
      </CardContent>
    </Card>
  );
}

export function FeatureCards({ entryCounts, hubType }: FeatureCardsProps) {
  const cards = buildFeatureCards(hubType);
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((config) => (
        <FeatureCard
          key={config.type}
          config={config}
          count={entryCounts[config.type] ?? 0}
        />
      ))}
    </div>
  );
}
