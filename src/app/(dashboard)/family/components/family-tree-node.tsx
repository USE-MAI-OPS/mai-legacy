"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, UserCheck, Mail } from "lucide-react";
import Link from "next/link";

export interface TreeNodeData {
  id: string;
  display_name: string;
  relationship_label: string | null;
  parent_id: string | null;
  parent2_id?: string | null;
  spouse_id: string | null;
  linked_member_id: string | null;
  birth_year: number | null;
  is_deceased: boolean;
  avatar_url: string | null;
  position_x?: number | null;
  position_y?: number | null;
  connection_type?: string | null;
}

interface FamilyTreeNodeProps {
  node: TreeNodeData;
  currentUserId: string;
  currentUserMemberId: string | null;
  isSpouse?: boolean;
  onEdit: (node: TreeNodeData) => void;
  onDelete: (id: string) => void;
  onInvite: (memberName: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Circular "Lineage Card" ─────────────────────────────────
// Clean circular boundary containing avatar, name, relationship, birth year
export function FamilyTreeNode({
  node,
  currentUserMemberId,
  isSpouse = false,
  onEdit,
  onDelete,
  onInvite,
}: FamilyTreeNodeProps) {
  const isClaimed = !!node.linked_member_id;
  const isSelf = node.linked_member_id === currentUserMemberId;

  const profileHref = isSelf
    ? "/profile"
    : isClaimed
    ? `/family/member/${node.linked_member_id}`
    : undefined;

  // ─── Ring color logic ─────────────────
  const ringClass = isSelf
    ? "ring-[3px] ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20"
    : isSpouse
    ? "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background"
    : isClaimed
    ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background"
    : "ring-2 ring-dashed ring-muted-foreground/30 ring-offset-2 ring-offset-background";

  // ─── Avatar fallback color ────────────
  const fallbackClass = isSelf
    ? "bg-primary text-primary-foreground text-base font-bold"
    : isSpouse
    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-sm font-semibold"
    : isClaimed
    ? "bg-primary/90 text-primary-foreground text-sm font-semibold"
    : "bg-muted text-muted-foreground text-sm font-semibold";

  const cardContent = (
    <div className="flex flex-col items-center gap-1 min-w-0 select-none">
      {/* ─── Circular Avatar (the core visual) ─── */}
      <div className="relative">
        <Avatar
          className={`h-16 w-16 ${ringClass} ${node.is_deceased ? "opacity-50 grayscale-[30%]" : ""}`}
        >
          {node.avatar_url && (
            <AvatarImage src={node.avatar_url} alt={node.display_name} />
          )}
          <AvatarFallback className={fallbackClass}>
            {getInitials(node.display_name)}
          </AvatarFallback>
        </Avatar>

        {/* "Me" indicator — small dot badge on the avatar */}
        {isSelf && (
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-2 py-[1px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold tracking-wide shadow-sm">
            Me
          </span>
        )}

        {/* Deceased cross */}
        {node.is_deceased && (
          <span className="absolute -top-0.5 -right-0.5 text-[10px] text-muted-foreground font-bold">
            ✝
          </span>
        )}
      </div>

      {/* ─── Name ─── */}
      <p className="text-[11px] font-semibold text-center leading-tight max-w-[110px] truncate mt-0.5">
        {node.display_name}
      </p>

      {/* ─── Relationship tag ─── */}
      {node.relationship_label && !isSelf && (
        <span className="text-[9px] font-medium text-muted-foreground bg-muted/60 px-2 py-[1px] rounded-full">
          {node.relationship_label}
        </span>
      )}

      {/* ─── Birth year ─── */}
      {node.birth_year && (
        <span className="text-[9px] text-muted-foreground/70">
          b. {node.birth_year}
        </span>
      )}

      {/* ─── Claim status ─── */}
      {!isClaimed && !isSelf && (
        <span className="text-[8px] text-muted-foreground/50 italic">
          Not yet claimed
        </span>
      )}
    </div>
  );

  return (
    <div className="relative group flex flex-col items-center">
      {/* ─── Kebab menu (hover) ─── */}
      <div className="absolute -top-1 -right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Open member menu" className="h-5 w-5 flex items-center justify-center rounded-full bg-background/90 border shadow-sm hover:bg-accent">
              <MoreVertical className="h-2.5 w-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit(node)}>
              <Pencil className="mr-2 h-3 w-3" />
              Edit
            </DropdownMenuItem>
            {!isClaimed && (
              <>
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <UserCheck className="mr-2 h-3 w-3" />
                  Link Member
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onInvite(node.display_name)}>
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

      {/* ─── Card content — clickable if linked ─── */}
      {profileHref ? (
        <Link href={profileHref} className="hover:opacity-80 transition-opacity">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </div>
  );
}
