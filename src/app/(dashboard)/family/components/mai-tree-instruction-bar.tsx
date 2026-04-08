"use client";

import { Sparkles } from "lucide-react";

export function MaiTreeInstructionBar() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm pointer-events-none">
      <Sparkles className="h-3 w-3 text-orange-500 shrink-0" />
      <span>Pinch to zoom, drag nodes to reorganize connections.</span>
    </div>
  );
}
