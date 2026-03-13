"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "./tour-provider";
import { TOUR_STEPS } from "./tour-steps";

const PADDING = 8;
const BORDER_RADIUS = 8;
const TOOLTIP_GAP = 12;

interface TooltipPosition {
  top: number;
  left: number;
  maxWidth: number;
}

function calcTooltipPosition(
  rect: DOMRect | null,
  position: "top" | "bottom" | "left" | "right",
  isMobile: boolean
): TooltipPosition {
  const tooltipWidth = 320;

  // Mobile: bottom-center card
  if (isMobile || !rect) {
    return {
      top: -1, // sentinel — handled via CSS
      left: -1,
      maxWidth: tooltipWidth,
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  switch (position) {
    case "bottom":
      top = rect.bottom + PADDING + TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "top":
      top = rect.top - PADDING - TOOLTIP_GAP - 200; // rough height
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "right":
      top = rect.top + rect.height / 2 - 100;
      left = rect.right + PADDING + TOOLTIP_GAP;
      break;
    case "left":
      top = rect.top + rect.height / 2 - 100;
      left = rect.left - PADDING - TOOLTIP_GAP - tooltipWidth;
      break;
  }

  // Clamp within viewport
  if (left < 12) left = 12;
  if (left + tooltipWidth > vw - 12) left = vw - 12 - tooltipWidth;
  if (top < 12) top = 12;
  if (top > vh - 260) top = vh - 260;

  return { top, left, maxWidth: tooltipWidth };
}

export function TourOverlay() {
  const {
    isActive,
    currentStep,
    totalSteps,
    isNavigating,
    targetRect,
    isMobile,
    nextStep,
    prevStep,
    skipTour,
  } = useTour();

  // Force re-render on window size changes for tooltip repositioning
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const handle = () => setTick((t) => t + 1);
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [isActive]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const showSpotlight = targetRect && !isMobile && !isNavigating;
  const tooltipPos = calcTooltipPosition(
    targetRect,
    step.position,
    isMobile || !targetRect || isNavigating
  );
  const isCentered = tooltipPos.top === -1;

  return (
    <>
      {/* SVG Overlay with spotlight cutout */}
      <svg
        className="fixed inset-0 z-[60] w-full h-full pointer-events-none"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {showSpotlight && (
              <rect
                x={targetRect.left - PADDING}
                y={targetRect.top - PADDING}
                width={targetRect.width + PADDING * 2}
                height={targetRect.height + PADDING * 2}
                rx={BORDER_RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-spotlight-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={skipTour}
        />
      </svg>

      {/* Spotlight ring glow (only when we have a target) */}
      {showSpotlight && (
        <div
          className="fixed z-[60] pointer-events-none rounded-lg ring-2 ring-primary/40 ring-offset-2 ring-offset-transparent"
          style={{
            top: targetRect.top - PADDING,
            left: targetRect.left - PADDING,
            width: targetRect.width + PADDING * 2,
            height: targetRect.height + PADDING * 2,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className={`fixed z-[61] ${
          isCentered
            ? "bottom-6 left-4 right-4 mx-auto max-w-sm"
            : ""
        }`}
        style={
          isCentered
            ? undefined
            : {
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: tooltipPos.maxWidth,
              }
        }
      >
        <div className="bg-card rounded-xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Close button */}
          <button
            onClick={skipTour}
            className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close tour"
          >
            <X className="size-4 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="px-5 pt-5 pb-2">
            {isNavigating ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              </div>
            ) : (
              <>
                {/* Icon + Title row */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${step.iconBg} shrink-0`}
                  >
                    <StepIcon className={`size-5 ${step.iconColor}`} />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight leading-tight pr-6">
                    {step.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </>
            )}
          </div>

          {/* Footer: progress dots + nav buttons */}
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-4 bg-primary"
                      : i < currentStep
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>

            {/* Nav buttons */}
            <div className="flex items-center gap-1.5">
              {isFirst ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="h-7 px-2 text-xs text-muted-foreground"
                >
                  Skip
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  className="h-7 px-2 text-xs gap-1"
                  disabled={isNavigating}
                >
                  <ArrowLeft className="size-3" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={nextStep}
                className="h-7 px-3 text-xs gap-1"
                disabled={isNavigating}
              >
                {isLast ? (
                  "Done!"
                ) : (
                  <>
                    Next
                    <ArrowRight className="size-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
