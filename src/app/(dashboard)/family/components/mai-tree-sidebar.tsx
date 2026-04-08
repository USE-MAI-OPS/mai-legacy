"use client";

import { Users, Heart, Briefcase, GraduationCap, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Filter view presets
// ---------------------------------------------------------------------------
const FILTER_VIEWS = [
  { value: "family", label: "Family", description: "Bloodline and extended family", icon: Users },
  { value: "friends", label: "Friends", description: "Friend connections", icon: Heart },
  { value: "work", label: "Work", description: "Professional network", icon: Briefcase },
  { value: "school", label: "School", description: "School and classmate connections", icon: GraduationCap },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MaiTreeSidebarProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  onAddNew: () => void;
}

// ---------------------------------------------------------------------------
// Sidebar content (shared between desktop inline + mobile Sheet)
// ---------------------------------------------------------------------------
function SidebarContent({
  activeFilter,
  onFilterChange,
  onAddNew,
}: MaiTreeSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h2 className="font-serif font-bold text-lg">Legacy Network</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your family tapestry
        </p>
      </div>

      {/* Filter views */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {FILTER_VIEWS.map((view) => {
            const Icon = view.icon;
            const isActive = activeFilter === view.value;
            return (
              <button
                key={view.value}
                onClick={() =>
                  onFilterChange(isActive ? null : view.value)
                }
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{view.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {view.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Add Member CTA */}
      <div className="p-4 border-t">
        <Button onClick={onAddNew} className="w-full rounded-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component — desktop inline or mobile Sheet
// ---------------------------------------------------------------------------
export function MaiTreeSidebar(props: MaiTreeSidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 left-3 z-20 bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Legacy Network</SheetTitle>
          </SheetHeader>
          <SidebarContent {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-64 border-r bg-card shrink-0 h-full hidden md:flex flex-col">
      <SidebarContent {...props} />
    </div>
  );
}
