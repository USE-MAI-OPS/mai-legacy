"use client";

import { type ReactNode, useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHubSwipe } from "@/hooks/use-hub-swipe";
import { useFamilyContext } from "@/components/providers/family-provider";
import { cn } from "@/lib/utils";

interface HubSwipeWrapperProps {
  children: ReactNode;
}

export function HubSwipeWrapper({ children }: HubSwipeWrapperProps) {
  const { hubs, loading } = useFamilyContext();
  const {
    currentIndex,
    totalHubs,
    goNext,
    goPrev,
    hasNext,
    hasPrev,
    swipeHandlers,
    swipeOffset,
    isSwiping,
  } = useHubSwipe();

  // Peek animation: slide left briefly on first visit to hint at swiping
  const [peekOffset, setPeekOffset] = useState(0);
  const peekTriggered = useRef(false);

  useEffect(() => {
    if (loading || totalHubs <= 1 || peekTriggered.current) return;
    peekTriggered.current = true;

    try {
      if (sessionStorage.getItem("mai-hub-peek-shown")) return;
      sessionStorage.setItem("mai-hub-peek-shown", "1");
    } catch {
      return; // sessionStorage unavailable (e.g. private browsing)
    }

    const t1 = setTimeout(() => setPeekOffset(-40), 500);
    const t2 = setTimeout(() => setPeekOffset(0), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading, totalHubs]);

  if (loading || totalHubs <= 1) {
    return <>{children}</>;
  }

  const activeOffset = isSwiping ? swipeOffset : peekOffset;
  const shouldAnimate = !isSwiping;

  return (
    <div className="relative">
      {/* Touch container */}
      <div
        {...swipeHandlers}
        style={{
          transform: activeOffset !== 0 ? `translateX(${activeOffset}px)` : undefined,
          transition: shouldAnimate ? "transform 0.3s ease-out" : "none",
        }}
      >
        {children}
      </div>

      {/* Desktop arrow buttons */}
      {hasPrev && (
        <button
          onClick={goPrev}
          className="hidden md:flex absolute left-0 top-1/3 -translate-x-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-card border shadow-sm hover:bg-accent transition-colors"
          aria-label="Previous hub"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={goNext}
          className="hidden md:flex absolute right-0 top-1/3 translate-x-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-card border shadow-sm hover:bg-accent transition-colors"
          aria-label="Next hub"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 py-3">
        {hubs.map((hub, i) => (
          <div
            key={hub.id}
            className={cn(
              "rounded-full transition-all duration-300",
              i === currentIndex
                ? "w-5 h-1.5 bg-primary"
                : "w-1.5 h-1.5 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
