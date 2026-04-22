"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationPreview } from "../actions";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ConversationListProps {
  conversations: ConversationPreview[];
  activeId: string | null;
  onSelect: (conv: ConversationPreview) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => {
        const isActive = activeId === conv.id;
        const isGroup = conv.type === "family_group";
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors text-left",
              isActive
                ? "bg-accent border-l-2 border-l-primary"
                : "hover:bg-accent/50 border-l-2 border-l-transparent"
            )}
          >
            <Avatar
              className={cn(
                "h-10 w-10 shrink-0",
                isGroup && "bg-primary/10"
              )}
            >
              <AvatarFallback className={cn("text-sm", isGroup && "bg-primary/10 text-primary")}>
                {isGroup ? <Users className="h-5 w-5" /> : getInitials(conv.otherParticipantName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate text-foreground">
                  {conv.otherParticipantName}
                </span>
                {conv.lastMessageAt && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-sm text-muted-foreground truncate">
                  {conv.lastMessageContent ??
                    (isGroup
                      ? `Group chat · ${conv.participantCount ?? 0} members`
                      : "No messages yet")}
                </p>
                {conv.unreadCount > 0 && (
                  <Badge
                    variant="default"
                    className="shrink-0 h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full"
                  >
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
