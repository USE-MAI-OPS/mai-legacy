"use client";

import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, UserCheck, Mail } from "lucide-react";
import Link from "next/link";
import type { HubNode } from "./legacy-hub-types";

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

// ---------------------------------------------------------------------------
// Ring color by connection type & self
// ---------------------------------------------------------------------------
function ringStyle(node: HubNode): string {
  if (node.isMe) {
    return "ring-[3px] ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/25";
  }
  if (node.connectionType === "spouse") {
    return "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background";
  }
  if (node.connectionType === "friend") {
    return "ring-2 ring-sky-400/50 ring-offset-2 ring-offset-background";
  }
  if (node.isClaimed) {
    return "ring-2 ring-primary/50 ring-offset-2 ring-offset-background";
  }
  return "ring-2 ring-dashed ring-muted-foreground/30 ring-offset-2 ring-offset-background";
}

function fallbackStyle(node: HubNode): string {
  if (node.isMe) return "bg-primary text-primary-foreground text-base font-bold";
  if (node.connectionType === "spouse") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-sm font-semibold";
  if (node.connectionType === "friend") return "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 text-sm font-semibold";
  if (node.isClaimed) return "bg-primary/90 text-primary-foreground text-sm font-semibold";
  return "bg-muted text-muted-foreground text-sm font-semibold";
}

// ---------------------------------------------------------------------------
// Connection type badge
// ---------------------------------------------------------------------------
function connectionBadge(node: HubNode): { label: string; className: string } | null {
  if (node.isMe) return null;

  if (node.relationshipLabel) {
    return {
      label: node.relationshipLabel,
      className: "text-[9px] font-medium text-muted-foreground bg-muted/60 px-2 py-[1px] rounded-full",
    };
  }

  switch (node.connectionType) {
    case "dna":
      return { label: "Family", className: "text-[9px] font-medium text-muted-foreground bg-muted/60 px-2 py-[1px] rounded-full" };
    case "friend":
      return { label: "Friend", className: "text-[9px] font-medium text-sky-600 bg-sky-100/60 dark:text-sky-300 dark:bg-sky-900/30 px-2 py-[1px] rounded-full" };
    case "spouse":
      return { label: "Spouse", className: "text-[9px] font-medium text-amber-600 bg-amber-100/60 dark:text-amber-300 dark:bg-amber-900/30 px-2 py-[1px] rounded-full" };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface LegacyHubNodeProps {
  node: HubNode;
  currentUserMemberId: string | null;
  onEdit: (node: HubNode) => void;
  onDelete: (id: string) => void;
  onInvite: (name: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const LegacyHubNode = memo(function LegacyHubNode({
  node,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
}: LegacyHubNodeProps) {
  const profileHref = node.isMe
    ? "/profile"
    : node.isClaimed && node.linkedMemberId
    ? `/family/member/${node.linkedMemberId}`
    : undefined;

  const badge = connectionBadge(node);

  const cardContent = (
    <div className="flex flex-col items-center gap-1 min-w-0 select-none">
      {/* ─── Avatar ─── */}
      <div className="relative">
        <Avatar
          className={`h-16 w-16 ${ringStyle(node)} ${
            node.isDeceased ? "opacity-50 grayscale-[30%]" : ""
          } transition-shadow`}
        >
          {node.avatarUrl && (
            <AvatarImage src={node.avatarUrl} alt={node.displayName} />
          )}
          <AvatarFallback className={fallbackStyle(node)}>
            {getInitials(node.displayName)}
          </AvatarFallback>
        </Avatar>

        {/* "Me" chip */}
        {node.isMe && (
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-2 py-[1px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold tracking-wide shadow-sm">
            Me
          </span>
        )}

        {/* Deceased marker */}
        {node.isDeceased && (
          <span className="absolute -top-0.5 -right-0.5 text-[10px] text-muted-foreground font-bold">
            ✝
          </span>
        )}
      </div>

      {/* ─── Name ─── */}
      <p className="text-[11px] font-semibold text-center leading-tight max-w-[110px] truncate mt-0.5">
        {node.displayName}
      </p>

      {/* ─── Connection badge ─── */}
      {badge && (
        <span className={badge.className}>
          {badge.label}
        </span>
      )}

      {/* ─── Birth year ─── */}
      {node.birthYear && (
        <span className="text-[9px] text-muted-foreground/70">
          b. {node.birthYear}
        </span>
      )}

      {/* ─── Claim status ─── */}
      {!node.isClaimed && !node.isMe && (
        <span className="text-[8px] text-muted-foreground/50 italic">
          Not yet claimed
        </span>
      )}
    </div>
  );

  return (
    <div className="relative group flex flex-col items-center">
      {/* ─── Kebab menu ─── */}
      <div className="absolute -top-1 -right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Open node menu" className="h-5 w-5 flex items-center justify-center rounded-full bg-background/90 border shadow-sm hover:bg-accent">
              <MoreVertical className="h-2.5 w-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit(node)}>
              <Pencil className="mr-2 h-3 w-3" />
              Edit
            </DropdownMenuItem>
            {!node.isClaimed && (
              <>
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <UserCheck className="mr-2 h-3 w-3" />
                  Link Member
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onInvite(node.displayName)}>
                  <Mail className="mr-2 h-3 w-3" />
                  Send Invite
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(node.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ─── Card body ─── */}
      {profileHref ? (
        <Link href={profileHref} className="hover:opacity-80 transition-opacity">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </div>
  );
});
