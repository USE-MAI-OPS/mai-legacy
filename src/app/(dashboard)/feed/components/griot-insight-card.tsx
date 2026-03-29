"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface FeedGriotInsight {
  kind: "griot_insight";
  id: string;
  title: string;
  body: string;
  related_members: string[];
  created_at: string;
}

export function GriotInsightCard({ item }: { item: FeedGriotInsight }) {
  return (
    <Link href="/griot" className="block group">
      <Card className="overflow-hidden transition-all hover:shadow-lg duration-300 border-0">
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Griot Suggestion
            </span>
          </div>

          <h3 className="text-lg font-bold font-serif leading-snug mb-2">
            {item.title}
          </h3>

          <p className="text-sm text-white/85 leading-relaxed mb-3 line-clamp-3">
            {item.body}
          </p>

          {item.related_members.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.related_members.map((name) => (
                <Badge
                  key={name}
                  className="bg-white/20 text-white border-white/30 text-[10px] px-2 py-0 rounded-full backdrop-blur-sm"
                >
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
