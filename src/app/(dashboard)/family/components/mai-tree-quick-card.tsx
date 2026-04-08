"use client";

import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { HubNode } from "./legacy-hub-types";
import type { MockMemberProfile } from "./mai-tree-mock-data";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MaiTreeQuickCardProps {
  node: HubNode;
  position: { x: number; y: number };
  mockProfile: MockMemberProfile;
  onClose: () => void;
  onViewProfile: () => void;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MaiTreeQuickCard({
  node,
  position,
  mockProfile,
  onClose,
  onViewProfile,
}: MaiTreeQuickCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Click-outside to dismiss
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid the same click that opened the card
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  // Top 2 entry types
  const topEntries = mockProfile.entryCounts
    .filter((e) => e.count > 0)
    .slice(0, 2);

  const relationshipLabel =
    node.relationshipLabel ?? (node.connectionType === "spouse" ? "Spouse" : node.connectionType === "friend" ? "Friend" : "Family");

  return (
    <div
      ref={cardRef}
      className="absolute z-30 w-56 bg-card border rounded-xl shadow-lg p-4 flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12">
        {node.avatarUrl && (
          <AvatarImage src={node.avatarUrl} alt={node.displayName} />
        )}
        <AvatarFallback className="bg-primary/90 text-primary-foreground text-sm font-bold">
          {getInitials(node.displayName)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p className="font-serif font-bold text-sm text-center leading-tight">
        {node.displayName}
      </p>

      {/* Relationship badge */}
      <Badge className="bg-[#C17B54]/10 text-[#C17B54] border-[#C17B54]/20 text-[10px] uppercase tracking-wider font-bold hover:bg-[#C17B54]/10">
        {relationshipLabel}
      </Badge>

      {/* Age + Occupation */}
      <p className="text-xs text-muted-foreground text-center">
        {mockProfile.age} yrs &middot; {mockProfile.occupation}
      </p>

      {/* Entry count summary */}
      {topEntries.length > 0 && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {topEntries.map((e) => (
            <span key={e.type} className="flex items-center gap-1">
              {e.emoji} {e.count} {e.type}
            </span>
          ))}
        </div>
      )}

      {/* View Full Profile */}
      <Button
        variant="outline"
        size="sm"
        onClick={onViewProfile}
        className="w-full mt-1 rounded-full text-xs border-[#C17B54]/30 text-[#C17B54] hover:bg-[#C17B54]/5"
      >
        View Full Profile
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}
