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

  const activeHubName = hubs[currentIndex]?.name;
  const prevHubName = hasPrev ? hubs[currentIndex - 1]?.name : undefined;
  const nextHubName = hasNext ? hubs[currentIndex + 1]?.name : undefined;

  return (
    // Outer wrapper is NOT overflow-hidden, so the arrows (which sit
    // outside the animating content) don't get clipped.
    <div className="relative">
      {/* Animating content lives in its own clip container so slide
          transforms don't peek out on either side during transitions. */}
      <div className="overflow-hidden">
        <div {...swipeHandlers} style={{ transform, transition }}>
          {children}
        </div>
      </div>

      {/* Desktop arrow buttons — hidden on mobile (use swipe instead).
          Positioned on top of the content, padded slightly inside the
          viewport so they don't crowd the edge. Each arrow shows a
          tooltip with the target hub name so users know what they're
          switching to. */}
      {hasPrev && slidePhase === "idle" && (
        <button
          onClick={goPrev}
          className="hidden md:flex absolute left-2 lg:left-4 top-1/3 z-20 w-10 h-10 items-center justify-center rounded-full bg-card border border-border shadow-md hover:bg-accent hover:shadow-lg transition-all"
          aria-label={prevHubName ? `Switch to ${prevHubName}` : "Previous hub"}
          title={prevHubName ? `Switch to ${prevHubName}` : "Previous hub"}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && slidePhase === "idle" && (
        <button
          onClick={goNext}
          className="hidden md:flex absolute right-2 lg:right-4 top-1/3 z-20 w-10 h-10 items-center justify-center rounded-full bg-card border border-border shadow-md hover:bg-accent hover:shadow-lg transition-all"
          aria-label={nextHubName ? `Switch to ${nextHubName}` : "Next hub"}
          title={nextHubName ? `Switch to ${nextHubName}` : "Next hub"}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Dots indicator + (desktop) current hub name */}
      <div className="flex flex-col items-center gap-1 py-3">
        <div className="flex justify-center gap-1.5">
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
        {activeHubName && (
          <span className="hidden md:block text-[11px] font-serif italic text-muted-foreground mt-1">
            {activeHubName}
          </span>
        )}
      </div>
    </div>
  );
}
