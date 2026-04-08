"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface FeedGriotInsight {
  kind: "griot_insight";
  id: string;
  title: string;
  body: string;
  related_members: string[];
  created_at: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function GriotInsightCard({ item }: { item: FeedGriotInsight }) {
  return (
    <Link href="/griot" className="block group">
      <Card className="overflow-hidden transition-all hover:shadow-lg duration-300 border-0">
        <div className="relative bg-gradient-to-br from-purple-500 to-violet-600 p-5 text-white overflow-hidden">
          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/90">
              Griot Insight
            </span>
          </div>

          {/* Quote / body text */}
          <p className="italic text-base font-serif leading-relaxed mb-2 text-white line-clamp-4">
            &ldquo;{item.body}&rdquo;
          </p>

          <h3 className="text-sm font-semibold text-white/80 mb-4">
            {item.title}
          </h3>

          {/* Bottom row */}
          <div className="flex items-end justify-between">
            {/* Avatar stack */}
            {item.related_members.length > 0 && (
              <div className="flex items-center">
                {item.related_members.slice(0, 3).map((name, i) => (
                  <div
                    key={name}
                    className={`h-7 w-7 rounded-full border-2 border-white/30 bg-white/30 text-[10px] font-bold flex items-center justify-center ${i > 0 ? "-ml-2" : ""}`}
                  >
                    {getInitials(name)}
                  </div>
                ))}
                {item.related_members.length > 3 && (
                  <div className="h-7 w-7 -ml-2 rounded-full border-2 border-white/30 bg-white/30 text-[10px] font-bold flex items-center justify-center">
                    +{item.related_members.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* CTA button */}
            <span className="bg-white text-gray-900 rounded-full px-4 py-1.5 text-xs font-bold group-hover:bg-white/90 transition-colors">
              INTERVIEW PROMPT
            </span>
          </div>

          {/* Decorative sparkles */}
          <Sparkles className="absolute bottom-3 right-3 h-16 w-16 text-white/10 pointer-events-none" />
        </div>
      </Card>
    </Link>
  );
}
