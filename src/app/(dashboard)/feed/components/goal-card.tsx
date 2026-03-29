"use client";

import Link from "next/link";
import { Target, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface FeedGoal {
  kind: "goal";
  id: string;
  title: string;
  description: string;
  target_count: number;
  current_count: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

export function GoalCard({ item }: { item: FeedGoal }) {
  const progress =
    item.target_count > 0
      ? Math.min(Math.round((item.current_count / item.target_count) * 100), 100)
      : 0;
  const isComplete = item.status === "completed" || progress >= 100;

  return (
    <Link href="/goals" className="block group">
      <Card className="overflow-hidden border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              {isComplete ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Target className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                {isComplete ? "Goal Complete!" : "Family Goal"}
              </p>
              <h3 className="text-lg font-bold font-serif leading-snug mb-1 line-clamp-1">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Progress value={progress} className="flex-1 h-2" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                  {item.current_count}/{item.target_count}
                </span>
              </div>
              {item.due_date && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Due{" "}
                  {new Date(item.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
