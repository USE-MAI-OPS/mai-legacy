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
    slidePhase,
    slideDirection,
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
      return;
    }

    const t1 = setTimeout(() => setPeekOffset(-40), 500);
    const t2 = setTimeout(() => setPeekOffset(0), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading, totalHubs]);

  if (loading || totalHubs <= 1) {
    return <>{children}</>;
  }

  // Compute transform and transition based on current phase
  let transform = "translateX(0)";
  let transition = "none";

  switch (slidePhase) {
    case "dragging":
      // Follow the finger — no transition, direct offset
      transform = `translateX(${swipeOffset}px)`;
      break;

    case "sliding-out":
      // Animate current content off-screen in the swipe direction
      transform = `translateX(${slideDirection * 100}%)`;
      transition = "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)";
      break;

    case "waiting-for-data":
      // Keep content off-screen while server loads new data
      transform = `translateX(${slideDirection * 100}%)`;
      break;

    case "sliding-in":
      // Position new content off-screen on the OPPOSITE side (no transition — instant placement)
      // The next rAF frame will set phase to "idle" which animates to center
      transform = `translateX(${-slideDirection * 100}%)`;
      break;

    case "idle":
      // At rest in the center — animate if coming from sliding-in
      if (peekOffset !== 0) {
        transform = `translateX(${peekOffset}px)`;
        transition = "transform 300ms ease-out";
      } else {
        transform = "translateX(0)";
        transition = "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)";
      }
      break;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Touch container */}
      <div
        {...swipeHandlers}
        style={{ transform, transition }}
      >
        {children}
      </div>

      {/* Desktop arrow buttons */}
      {hasPrev && slidePhase === "idle" && (
        <button
          onClick={goPrev}
          className="hidden md:flex absolute left-0 top-1/3 -translate-x-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-card border shadow-sm hover:bg-accent transition-colors"
          aria-label="Previous hub"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && slidePhase === "idle" && (
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
