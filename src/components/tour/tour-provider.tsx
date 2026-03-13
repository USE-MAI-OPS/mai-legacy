"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { TOUR_STEPS, TOUR_STORAGE_KEY } from "./tour-steps";

interface TourContextValue {
  /** Whether the tour is currently active */
  isActive: boolean;
  /** Current step index */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether we're navigating between pages */
  isNavigating: boolean;
  /** Bounding rect of the target element (null if not found yet) */
  targetRect: DOMRect | null;
  /** Whether we're on mobile */
  isMobile: boolean;
  /** Start the tour from step 0 */
  startTour: () => void;
  /** Advance to the next step */
  nextStep: () => void;
  /** Go back to the previous step */
  prevStep: () => void;
  /** Skip / dismiss the tour */
  skipTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

/** Optional hook that won't throw if outside provider */
export function useTourOptional() {
  return useContext(TourContext);
}

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Track the pathname we navigated TO so we know when it settles
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // ---- Mobile detection ----
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ---- Auto-start for first-time users ----
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ---- Find and track target element ----
  const findTarget = useCallback(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    // On mobile, skip sidebar targets (steps 1-4 target nav links in the sidebar)
    // Instead we'll just show a bottom-sheet style tooltip after navigating
    if (isMobile && step.target.startsWith("nav-")) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(
      `[data-tour-step="${step.target}"]`
    ) as HTMLElement | null;

    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStep, isMobile]);

  // Re-find target on scroll/resize
  useEffect(() => {
    if (!isActive) return;

    findTarget();

    const handleUpdate = () => findTarget();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    // Use ResizeObserver on body for layout shifts
    const observer = new ResizeObserver(handleUpdate);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
      observer.disconnect();
    };
  }, [isActive, currentStep, findTarget]);

  // ---- Handle page navigation completion ----
  useEffect(() => {
    if (!isActive || !isNavigating || !pendingPath) return;

    // Check if we've arrived at the pending path
    if (pathname === pendingPath || pathname.startsWith(pendingPath)) {
      // Give the page a moment to render so data-tour-step attributes are in the DOM
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setPendingPath(null);
        findTarget();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, isActive, isNavigating, pendingPath, findTarget]);

  // ---- Navigation helpers ----
  const navigateToStep = useCallback(
    (stepIndex: number) => {
      const step = TOUR_STEPS[stepIndex];
      if (!step) return;

      const needsNav =
        step.navigateTo && !pathname.startsWith(step.navigateTo);

      if (needsNav && step.navigateTo) {
        setIsNavigating(true);
        setPendingPath(step.navigateTo);
        router.push(step.navigateTo);
      } else {
        // Same page — find element immediately
        setIsNavigating(false);
        // Small delay to let any animations settle
        setTimeout(() => findTarget(), 100);
      }
    },
    [pathname, router, findTarget]
  );

  const startTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setCurrentStep(0);
    setIsActive(true);
    setTargetRect(null);

    // Navigate to dashboard for step 0
    const firstStep = TOUR_STEPS[0];
    if (firstStep.navigateTo && !pathname.startsWith(firstStep.navigateTo)) {
      setIsNavigating(true);
      setPendingPath(firstStep.navigateTo);
      router.push(firstStep.navigateTo);
    } else {
      setTimeout(() => findTarget(), 200);
    }
  }, [pathname, router, findTarget]);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setTargetRect(null);
      navigateToStep(next);
    } else {
      // Last step — complete the tour
      setIsActive(false);
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }, [currentStep, navigateToStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setTargetRect(null);
      navigateToStep(prev);
    }
  }, [currentStep, navigateToStep]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        isNavigating,
        targetRect,
        isMobile,
        startTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}
