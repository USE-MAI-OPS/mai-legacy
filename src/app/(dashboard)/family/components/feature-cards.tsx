"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChefHat, Wrench, GraduationCap, Search } from "lucide-react";
import type { EntryType } from "@/types/database";

interface FeatureCardConfig {
  type: EntryType;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  placeholder: string;
}

const FEATURE_CARDS: FeatureCardConfig[] = [
  {
    type: "recipe",
    title: "Recipes",
    icon: <ChefHat className="h-5 w-5" />,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    placeholder: "Search recipes...",
  },
  {
    type: "skill",
    title: "Skills",
    icon: <Wrench className="h-5 w-5" />,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    placeholder: "Search skills...",
  },
  {
    type: "lesson",
    title: "Lessons",
    icon: <GraduationCap className="h-5 w-5" />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    placeholder: "Search lessons...",
  },
];

interface FeatureCardsProps {
  entryCounts: Record<string, number>;
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
        {/* Icon + title + count */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bgColor} ${config.color}`}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{config.title}</h3>
            <p className="text-xs text-muted-foreground">
              {count} entr{count === 1 ? "y" : "ies"}
            </p>
          </div>
        </div>

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

export function FeatureCards({ entryCounts }: FeatureCardsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Quick Search</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURE_CARDS.map((config) => (
          <FeatureCard
            key={config.type}
            config={config}
            count={entryCounts[config.type] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
