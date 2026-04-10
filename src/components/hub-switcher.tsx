"use client";

import { useState } from "react";
import { Check, ChevronDown, Plus, Users, CircleDot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFamilyContext } from "@/components/providers/family-provider";
import { CreateHubDialog } from "@/components/create-hub-dialog";
import { cn } from "@/lib/utils";

interface HubSwitcherProps {
  /** Compact mode for mobile top bar */
  compact?: boolean;
}

export function HubSwitcher({ compact = false }: HubSwitcherProps) {
  const { hubs, activeHub, switchHub, loading } = useFamilyContext();
  const [createOpen, setCreateOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
      </div>
    );
  }

  if (hubs.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No hubs</span>
      </div>
    );
  }

  // If only one hub, just display the name (no dropdown needed)
  if (hubs.length === 1) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className={cn(
          "font-medium truncate",
          compact ? "text-base max-w-[180px]" : "text-sm max-w-[140px] hidden xl:inline text-muted-foreground"
        )}>
          {activeHub?.name ?? "My Family"}
        </span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent transition-colors outline-none">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className={cn(
            "font-medium truncate",
            compact ? "text-base max-w-[180px]" : "text-sm max-w-[140px] hidden xl:inline text-muted-foreground"
          )}>
            {activeHub?.name ?? "My Family"}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={compact ? "start" : "end"} className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">My Hubs</p>
          </div>
          {hubs.map((hub) => (
            <DropdownMenuItem
              key={hub.id}
              onClick={() => switchHub(hub.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                {hub.type === "circle" ? (
                  <CircleDot className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate flex-1">{hub.name}</span>
                {hub.id === activeHub?.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-primary"
            onSelect={(e) => {
              e.preventDefault();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Hub
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateHubDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
