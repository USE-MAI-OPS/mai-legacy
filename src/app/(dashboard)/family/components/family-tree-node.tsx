"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  spouse_id: string | null;
  linked_member_id: string | null;
  birth_year: number | null;
  is_deceased: boolean;
  avatar_url: string | null;
}

interface FamilyTreeNodeProps {
  node: TreeNodeData;
  currentUserId: string;
  /** The family_members row id that corresponds to the current user, if any */
  currentUserMemberId: string | null;
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

export function FamilyTreeNode({
  node,
  currentUserMemberId,
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

  const nodeContent = (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      {/* Avatar */}
      <Avatar
        className={`h-16 w-16 ${
          isClaimed
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
            : "ring-2 ring-dashed ring-muted-foreground/40 ring-offset-2 ring-offset-background"
        } ${node.is_deceased ? "opacity-60" : ""}`}
      >
        {node.avatar_url && (
          <AvatarImage src={node.avatar_url} alt={node.display_name} />
        )}
        <AvatarFallback
          className={`text-sm font-semibold ${
            isClaimed
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {getInitials(node.display_name)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p className="text-sm font-medium text-center leading-tight max-w-[130px] truncate">
        {node.display_name}
        {node.is_deceased && " \u2020"}
      </p>

      {/* "Me" badge */}
      {isSelf && (
        <Badge className="text-xs px-1.5 py-0 bg-primary text-primary-foreground">
          Me
        </Badge>
      )}

      {/* Relationship label */}
      {node.relationship_label && !isSelf && (
        <Badge
          variant="secondary"
          className="text-xs px-1.5 py-0"
        >
          {node.relationship_label}
        </Badge>
      )}

      {/* Birth year */}
      {node.birth_year && (
        <span className="text-xs text-muted-foreground">
          b. {node.birth_year}
        </span>
      )}

      {/* Claim status */}
      {!isClaimed && (
        <span className="text-xs text-muted-foreground/60 italic">
          Not yet claimed
        </span>
      )}
    </div>
  );

  return (
    <div className="relative group flex flex-col items-center">
      {/* Kebab menu */}
      <div className="absolute -top-1 -right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 sm:h-6 sm:w-6 flex items-center justify-center rounded-full bg-background border shadow-sm hover:bg-accent">
              <MoreVertical className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
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

      {/* Node content — clickable if linked */}
      {profileHref ? (
        <Link href={profileHref} className="hover:opacity-80 transition-opacity">
          {nodeContent}
        </Link>
      ) : (
        nodeContent
      )}
    </div>
  );
}
