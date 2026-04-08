"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FamilyMember {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface FamilyStripProps {
  members: FamilyMember[];
  onFilterByMember?: (userId: string | null) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Rotating avatar background colors
const avatarColors = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
];

export function FamilyStrip({ members, onFilterByMember }: FamilyStripProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleTap(userId: string) {
    const next = activeId === userId ? null : userId;
    setActiveId(next);
    onFilterByMember?.(next);
  }

  return (
    <div className="relative -mx-4 px-4 mb-4">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Invite button — first position */}
        <button
          className="flex flex-col items-center gap-1.5 shrink-0"
          onClick={() => (window.location.href = "/family")}
        >
          <div className="h-14 w-14 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center hover:border-primary/70 transition-colors">
            <Plus className="h-5 w-5 text-primary/60" />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium w-14 text-center truncate">
            Invite
          </span>
        </button>

        {/* Family members */}
        {members.map((member, i) => {
          const isActive = activeId === member.user_id;
          const colorClass = avatarColors[i % avatarColors.length];

          return (
            <button
              key={member.id}
              className="flex flex-col items-center gap-1.5 shrink-0"
              onClick={() => handleTap(member.user_id)}
            >
              <div
                className={cn(
                  "h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "ring-2 ring-[#C17B54] ring-offset-2 ring-offset-background scale-105"
                    : "hover:scale-105"
                )}
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.display_name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "h-14 w-14 rounded-full flex items-center justify-center text-sm font-bold",
                      colorClass
                    )}
                  >
                    {getInitials(member.display_name)}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium w-14 text-center truncate",
                  isActive ? "text-[#C17B54]" : "text-muted-foreground"
                )}
              >
                {member.display_name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
