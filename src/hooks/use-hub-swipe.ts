"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFamilyContext } from "@/components/providers/family-provider";

const SWIPE_THRESHOLD = 50; // px minimum to count as a swipe
const TRANSITION_MS = 300; // slide animation duration

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export type SlidePhase = "idle" | "dragging" | "sliding-out" | "waiting-for-data" | "sliding-in";

interface UseHubSwipeReturn {
  currentIndex: number;
  totalHubs: number;
  goNext: () => void;
  goPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  swipeHandlers: SwipeHandlers;
  swipeOffset: number;
  slidePhase: SlidePhase;
  /** Direction of the current transition: -1 = going to next (left), 1 = going to prev (right) */
  slideDirection: -1 | 1 | 0;
}

export function useHubSwipe(): UseHubSwipeReturn {
  const { hubs, activeHubId, switchHub, isHubSwitching } = useFamilyContext();
  const touchStartX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [slidePhase, setSlidePhase] = useState<SlidePhase>("idle");
  const [slideDirection, setSlideDirection] = useState<-1 | 1 | 0>(0);
  const transitioning = useRef(false);

  const currentIndex = hubs.findIndex((h) => h.id === activeHubId);
  const hasNext = currentIndex < hubs.length - 1;
  const hasPrev = currentIndex > 0;

  // When the server finishes loading new hub data, trigger the slide-in
  useEffect(() => {
    if (slidePhase === "waiting-for-data" && !isHubSwitching) {
      setSlidePhase("sliding-in");

      // Next frame: position off-screen. Frame after: animate to center.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlidePhase("idle");
          setSlideDirection(0);
          transitioning.current = false;
        });
      });
    }
  }, [isHubSwitching, slidePhase]);

  const triggerTransition = useCallback(
    (direction: -1 | 1) => {
      if (transitioning.current) return;
      const targetIndex = currentIndex + (direction === -1 ? 1 : -1);
      if (targetIndex < 0 || targetIndex >= hubs.length) return;

      transitioning.current = true;
      setSlideDirection(direction);

      // Phase 1: slide current content off-screen
      setSlidePhase("sliding-out");

      setTimeout(() => {
        // Phase 2: switch the hub data (triggers async server re-render)
        switchHub(hubs[targetIndex].id);

        // Phase 3: wait for server data before sliding in
        setSlidePhase("waiting-for-data");
      }, TRANSITION_MS);
    },
    [currentIndex, hubs, switchHub]
  );

  const goNext = useCallback(() => {
    if (hasNext && !transitioning.current) {
      triggerTransition(-1);
    }
  }, [hasNext, triggerTransition]);

  const goPrev = useCallback(() => {
    if (hasPrev && !transitioning.current) {
      triggerTransition(1);
    }
  }, [hasPrev, triggerTransition]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (transitioning.current) return;
    touchStartX.current = e.touches[0].clientX;
    setSlidePhase("dragging");
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (slidePhase !== "dragging") return;
      const diff = e.touches[0].clientX - touchStartX.current;
      const limited =
        (!hasPrev && diff > 0) || (!hasNext && diff < 0)
          ? diff * 0.3
          : diff;
      setSwipeOffset(limited);
    },
    [slidePhase, hasPrev, hasNext]
  );

  const onTouchEnd = useCallback(() => {
    if (slidePhase !== "dragging") return;

    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      if (swipeOffset > 0 && hasPrev) {
        setSwipeOffset(0);
        triggerTransition(1);
        return;
      } else if (swipeOffset < 0 && hasNext) {
        setSwipeOffset(0);
        triggerTransition(-1);
        return;
      }
    }

    setSwipeOffset(0);
    setSlidePhase("idle");
  }, [slidePhase, swipeOffset, hasPrev, hasNext, triggerTransition]);

  return {
    currentIndex,
    totalHubs: hubs.length,
    goNext,
    goPrev,
    hasNext,
    hasPrev,
    swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    swipeOffset,
    slidePhase,
    slideDirection,
  };
}
