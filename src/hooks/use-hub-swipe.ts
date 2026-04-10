"use client";

import { useCallback, useRef, useState } from "react";
import { useFamilyContext } from "@/components/providers/family-provider";

const SWIPE_THRESHOLD = 50; // px minimum to count as a swipe

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

interface UseHubSwipeReturn {
  currentIndex: number;
  totalHubs: number;
  goNext: () => void;
  goPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  swipeHandlers: SwipeHandlers;
  swipeOffset: number;
  isSwiping: boolean;
}

export function useHubSwipe(): UseHubSwipeReturn {
  const { hubs, activeHubId, switchHub } = useFamilyContext();
  const touchStartX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const currentIndex = hubs.findIndex((h) => h.id === activeHubId);
  const hasNext = currentIndex < hubs.length - 1;
  const hasPrev = currentIndex > 0;

  const goNext = useCallback(() => {
    if (hasNext) {
      switchHub(hubs[currentIndex + 1].id);
    }
  }, [hasNext, hubs, currentIndex, switchHub]);

  const goPrev = useCallback(() => {
    if (hasPrev) {
      switchHub(hubs[currentIndex - 1].id);
    }
  }, [hasPrev, hubs, currentIndex, switchHub]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    const limited = (!hasPrev && diff > 0) || (!hasNext && diff < 0)
      ? diff * 0.3
      : diff;
    setSwipeOffset(limited);
  }, [isSwiping, hasPrev, hasNext]);

  const onTouchEnd = useCallback(() => {
    setIsSwiping(false);
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      if (swipeOffset > 0 && hasPrev) {
        goPrev();
      } else if (swipeOffset < 0 && hasNext) {
        goNext();
      }
    }
    setSwipeOffset(0);
  }, [swipeOffset, hasPrev, hasNext, goPrev, goNext]);

  return {
    currentIndex,
    totalHubs: hubs.length,
    goNext,
    goPrev,
    hasNext,
    hasPrev,
    swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    swipeOffset,
    isSwiping,
  };
}
