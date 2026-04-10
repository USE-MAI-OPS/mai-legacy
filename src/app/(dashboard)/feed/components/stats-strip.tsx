"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, Flame, Target, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeedStats {
  entries: number;
  members: number;
  traditions: number;
  goals: number;
  events: number;
}

interface StatsStripProps {
  stats: FeedStats;
}

const statItems: {
  key: keyof FeedStats;
  label: string;
  icon: React.ReactNode;
  href: string;
}[] = [
  { key: "entries", label: "Memories", icon: <BookOpen className="h-4 w-4" />, href: "/entries" },
  { key: "members", label: "Members", icon: <Users className="h-4 w-4" />, href: "/family" },
  { key: "traditions", label: "Traditions", icon: <Flame className="h-4 w-4" />, href: "/family?tab=traditions" },
  { key: "goals", label: "Goals", icon: <Target className="h-4 w-4" />, href: "/goals" },
  { key: "events", label: "Events", icon: <Calendar className="h-4 w-4" />, href: "/family?tab=events" },
];

export function StatsStrip({ stats }: StatsStripProps) {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY > lastScrollY && currentY > 100) {
        setVisible(false);
      } else if (currentY < lastScrollY || currentY < 50) {
        setVisible(true);
      }
      setLastScrollY(currentY);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={cn(
        "relative -mx-4 px-4 mb-4 transition-all duration-300",
        visible ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden mb-0"
      )}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {statItems.map(({ key, label, icon, href }) => (
          <Link
            key={key}
            href={href}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-background hover:bg-muted transition-colors shrink-0 group"
          >
            <span className="text-muted-foreground group-hover:text-[#C17B54] transition-colors">
              {icon}
            </span>
            <span className="text-sm font-bold tabular-nums">{stats[key]}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
