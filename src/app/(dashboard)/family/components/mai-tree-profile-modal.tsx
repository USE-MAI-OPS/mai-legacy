"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ChevronRight, MessageCircle } from "lucide-react";
import type { HubNode } from "./legacy-hub-types";
import type { MockMemberProfile } from "./mai-tree-mock-data";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MaiTreeProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: HubNode | null;
  mockProfile: MockMemberProfile | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFirstName(name: string): string {
  return name.split(" ")[0];
}

// ---------------------------------------------------------------------------
// Entry type badge colors
// ---------------------------------------------------------------------------
const TYPE_COLORS: Record<string, string> = {
  Story: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Recipe: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Lesson: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Skill: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Tradition: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MaiTreeProfileModal({
  open,
  onOpenChange,
  node,
  mockProfile,
}: MaiTreeProfileModalProps) {
  if (!node || !mockProfile) return null;

  const firstName = getFirstName(node.displayName);
  const relationshipLabel =
    node.relationshipLabel ??
    (node.connectionType === "spouse"
      ? "Spouse"
      : node.connectionType === "friend"
      ? "Friend"
      : "Family");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">
          {node.displayName} Profile
        </DialogTitle>

        <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3">
          {/* Avatar */}
          <Avatar className="h-24 w-24 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            {node.avatarUrl && (
              <AvatarImage src={node.avatarUrl} alt={node.displayName} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {getInitials(node.displayName)}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <h2 className="font-serif text-xl font-bold text-center">
            {node.displayName}
          </h2>

          {/* Relationship badge */}
          <Badge className="bg-[#C17B54]/10 text-[#C17B54] border-[#C17B54]/20 text-[10px] uppercase tracking-wider font-bold hover:bg-[#C17B54]/10">
            {relationshipLabel}
          </Badge>

          {/* Details */}
          <p className="text-sm text-muted-foreground text-center">
            {mockProfile.age} years old &middot; {mockProfile.occupation}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            {mockProfile.location}
          </p>

          {/* Bio */}
          <p className="text-sm text-muted-foreground/80 text-center italic leading-relaxed mt-1 max-w-xs">
            &ldquo;{mockProfile.bio}&rdquo;
          </p>
        </div>

        <Separator />

        {/* Contributions */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold mb-3">Contributions</h3>
          <div className="grid grid-cols-2 gap-2">
            {mockProfile.entryCounts.map((entry) => (
              <div
                key={entry.type}
                className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5"
              >
                <span className="text-base">{entry.emoji}</span>
                <div>
                  <p className="text-sm font-bold leading-tight">
                    {entry.count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {entry.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Recent entries */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold mb-3">
            Recent from {firstName}
          </h3>
          <div className="space-y-2">
            {mockProfile.recentEntries.map((entry) => (
              <div
                key={entry.title}
                className="flex items-center justify-between gap-2 rounded-lg hover:bg-accent px-3 py-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{entry.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="secondary"
                      className={`text-[9px] px-1.5 py-0 ${
                        TYPE_COLORS[entry.type] ?? ""
                      }`}
                    >
                      {entry.type.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {entry.timestamp}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 space-y-2">
          <Button className="w-full rounded-full" asChild>
            <Link href="/entries/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry About {firstName}
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full text-xs"
              asChild
            >
              <Link href="/entries">View All Entries</Link>
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-full text-xs"
              asChild
            >
              <Link href="/messages">
                <MessageCircle className="h-3 w-3 mr-1.5" />
                Message
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
