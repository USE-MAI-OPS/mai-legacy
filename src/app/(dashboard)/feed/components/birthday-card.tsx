"use client";

import Link from "next/link";
import { Cake, MessageCircle, BookPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FeedBirthday {
  kind: "birthday";
  id: string;
  tree_member_id: string;
  linked_user_id: string | null;
  display_name: string;
  hub_id: string;
  hub_name: string;
  birth_date: string;
  created_at: string;
}

function computeAge(birthDate: string): number | null {
  const bd = new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return null;
  const now = new Date();
  const year = now.getUTCFullYear() - bd.getUTCFullYear();
  // birth_date's month/day already matches today (that's how we surfaced
  // the card) so no need to subtract for not-yet-reached birthdays.
  return year > 0 ? year : null;
}

export function BirthdayCard({ item }: { item: FeedBirthday }) {
  const age = computeAge(item.birth_date);
  const ctaHref = item.linked_user_id
    ? `/messages?recipient=${item.linked_user_id}`
    : `/entries/new?subject=${item.tree_member_id}`;
  const ctaLabel = item.linked_user_id ? "Send a message" : "Share a memory";
  const CtaIcon = item.linked_user_id ? MessageCircle : BookPlus;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg duration-300 border-0">
      <div className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 p-5 text-white overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Cake className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Birthday today
          </span>
          <Badge className="ml-auto bg-white/20 text-white border-white/30 text-[10px] px-2 py-0 rounded-full backdrop-blur-sm">
            {item.hub_name}
          </Badge>
        </div>

        <h3 className="text-xl font-bold font-serif leading-snug mb-1">
          🎂 Today is {item.display_name}&apos;s birthday
        </h3>
        <p className="text-sm text-white/85 leading-relaxed mb-4">
          {age
            ? `Celebrating ${age} years. Say something — a short note goes a long way.`
            : `Drop a note — a short message goes a long way.`}
        </p>

        <Button
          asChild
          size="sm"
          variant="secondary"
          className="rounded-full bg-white text-gray-900 hover:bg-white/90"
        >
          <Link href={ctaHref}>
            <CtaIcon className="mr-1.5 h-3.5 w-3.5" />
            {ctaLabel}
          </Link>
        </Button>

        <Cake className="absolute bottom-3 right-3 h-16 w-16 text-white/10 pointer-events-none" />
      </div>
      <CardContent className="p-0" />
    </Card>
  );
}
