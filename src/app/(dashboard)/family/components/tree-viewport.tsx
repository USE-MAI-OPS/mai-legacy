"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Maximize2 } from "lucide-react";

// ---------------------------------------------------------------------------
// TreeViewport — zoom + pan wrapper for the family tree
// ---------------------------------------------------------------------------

interface TreeViewportProps {
  children: ReactNode;
}

export function TreeViewport({ children }: TreeViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Drag tracking refs (avoid stale closures)
  const dragStartRef = useRef({ x: 0, y: 0 });
  const translateAtDragStartRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const scaleRef = useRef(scale);
  const translateRef = useRef(translate);

  // Keep refs in sync
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  // Pinch-to-zoom tracking
  const lastPinchDistRef = useRef(0);
  const lastPinchMidRef = useRef({ x: 0, y: 0 });

  // -------------------------------------------------------------------------
  // Fit-to-screen
  // -------------------------------------------------------------------------
  const fitToScreen = useCallback((animate = true) => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    // Measure content at scale=1
    const vRect = viewport.getBoundingClientRect();

    // Temporarily reset transform to measure natural size
    const prev = content.style.transform;
    content.style.transform = "scale(1) translate(0px, 0px)";
    const cRect = content.getBoundingClientRect();
    content.style.transform = prev;

    if (cRect.width === 0 || cRect.height === 0) return;

    const fitScale = Math.min(
      vRect.width / cRect.width,
      vRect.height / cRect.height,
      1.0 // never zoom in past 1x
    );

    const clampedScale = Math.max(0.3, Math.min(2.0, fitScale));

    // Center the content
    const scaledW = cRect.width * clampedScale;
    const scaledH = cRect.height * clampedScale;
    const offsetX = (vRect.width - scaledW) / 2;
    const offsetY = (vRect.height - scaledH) / 2;

    if (animate) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 350);
    }

    setScale(clampedScale);
    setTranslate({ x: offsetX, y: offsetY });
  }, []);

  // Fit on mount + when content resizes
  useEffect(() => {
    // Small delay to let tree render
    const timer = setTimeout(() => fitToScreen(false), 100);

    const content = contentRef.current;
    if (!content) return () => clearTimeout(timer);

    const observer = new ResizeObserver(() => {
      fitToScreen(false);
    });
    observer.observe(content);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [fitToScreen]);

  // -------------------------------------------------------------------------
  // Zoom helpers
  // -------------------------------------------------------------------------
  const clampScale = (s: number) => Math.max(0.3, Math.min(2.0, s));

  const zoomToward = useCallback(
    (newScale: number, pivotX: number, pivotY: number) => {
      const clamped = clampScale(newScale);
      const oldScale = scaleRef.current;
      const t = translateRef.current;
      if (clamped === oldScale) return;

      const ratio = clamped / oldScale;
      const newTx = pivotX - (pivotX - t.x) * ratio;
      const newTy = pivotY - (pivotY - t.y) * ratio;

      setScale(clamped);
      setTranslate({ x: newTx, y: newTy });
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const r = viewport.getBoundingClientRect();
    const cx = r.width / 2;
    const cy = r.height / 2;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 350);
    zoomToward(scaleRef.current + 0.2, cx, cy);
  }, [zoomToward]);

  const handleZoomOut = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const r = viewport.getBoundingClientRect();
    const cx = r.width / 2;
    const cy = r.height / 2;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 350);
    zoomToward(scaleRef.current - 0.2, cx, cy);
  }, [zoomToward]);

  // -------------------------------------------------------------------------
  // Mouse drag handlers
  // -------------------------------------------------------------------------
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Ignore if clicking interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='menu']") ||
        target.closest("[data-radix-popper-content-wrapper]")
      ) {
        return;
      }

      dragStartRef.current = { x: e.clientX, y: e.clientY };
      translateAtDragStartRef.current = { ...translateRef.current };
      hasDraggedRef.current = false;
      setIsDragging(true);
      e.preventDefault();
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Only start actual drag after 5px movement
      if (!hasDraggedRef.current && Math.abs(dx) + Math.abs(dy) < 5) return;
      hasDraggedRef.current = true;

      setTranslate({
        x: translateAtDragStartRef.current.x + dx,
        y: translateAtDragStartRef.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // -------------------------------------------------------------------------
  // Touch handlers (attached via useEffect for passive: false)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let touchDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single-finger drag
        const t = e.touches[0];
        dragStartRef.current = { x: t.clientX, y: t.clientY };
        translateAtDragStartRef.current = { ...translateRef.current };
        hasDraggedRef.current = false;
        touchDragging = true;
      } else if (e.touches.length === 2) {
        // Pinch start
        touchDragging = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
        lastPinchMidRef.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && touchDragging) {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - dragStartRef.current.x;
        const dy = t.clientY - dragStartRef.current.y;

        if (!hasDraggedRef.current && Math.abs(dx) + Math.abs(dy) < 5) return;
        hasDraggedRef.current = true;

        const newT = {
          x: translateAtDragStartRef.current.x + dx,
          y: translateAtDragStartRef.current.y + dy,
        };
        translateRef.current = newT;
        setTranslate(newT);
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);

        if (lastPinchDistRef.current > 0) {
          const ratio = newDist / lastPinchDistRef.current;
          const viewport = viewportRef.current;
          if (viewport) {
            const vRect = viewport.getBoundingClientRect();
            const midX =
              (e.touches[0].clientX + e.touches[1].clientX) / 2 - vRect.left;
            const midY =
              (e.touches[0].clientY + e.touches[1].clientY) / 2 - vRect.top;

            const newScale = clampScale(scaleRef.current * ratio);
            const oldScale = scaleRef.current;
            if (newScale !== oldScale) {
              const r = newScale / oldScale;
              const t = translateRef.current;
              const newT = {
                x: midX - (midX - t.x) * r,
                y: midY - (midY - t.y) * r,
              };
              scaleRef.current = newScale;
              translateRef.current = newT;
              setScale(newScale);
              setTranslate(newT);
            }
          }
        }

        lastPinchDistRef.current = newDist;
      }
    };

    const handleTouchEnd = () => {
      touchDragging = false;
      lastPinchDistRef.current = 0;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Mouse wheel zoom
  // -------------------------------------------------------------------------
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const pivotX = e.clientX - rect.left;
      const pivotY = e.clientY - rect.top;
      const newScale = clampScale(
        scaleRef.current * (1 - e.deltaY * 0.001)
      );

      const oldScale = scaleRef.current;
      if (newScale === oldScale) return;

      const ratio = newScale / oldScale;
      const t = translateRef.current;
      const newT = {
        x: pivotX - (pivotX - t.x) * ratio,
        y: pivotY - (pivotY - t.y) * ratio,
      };
      scaleRef.current = newScale;
      translateRef.current = newT;
      setScale(newScale);
      setTranslate(newT);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // -------------------------------------------------------------------------
  // Edge gradient visibility
  // -------------------------------------------------------------------------
  const [edges, setEdges] = useState({
    left: false,
    right: false,
    top: false,
    bottom: false,
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const vRect = viewport.getBoundingClientRect();
    const contentW = content.scrollWidth * scale;
    const contentH = content.scrollHeight * scale;

    setEdges({
      left: translate.x < -2,
      right: translate.x + contentW > vRect.width + 2,
      top: translate.y < -2,
      bottom: translate.y + contentH > vRect.height + 2,
    });
  }, [scale, translate]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      ref={viewportRef}
      className="relative overflow-hidden rounded-lg border bg-card h-[60vh] min-h-[400px] sm:h-[70vh] sm:min-h-[500px]"
      style={{
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Edge gradient indicators */}
      {edges.left && (
        <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
      )}
      {edges.right && (
        <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
      )}
      {edges.top && (
        <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
      )}
      {edges.bottom && (
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
      )}

      {/* Transformed content */}
      <div
        ref={contentRef}
        className={`tree-viewport-content ${isAnimating ? "tree-animating" : ""}`}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        }}
      >
        {children}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-card/90 backdrop-blur-sm border rounded-lg p-1 shadow-sm">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          aria-label="Zoom out"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-xs text-muted-foreground w-10 text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          aria-label="Zoom in"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <div className="w-px h-4 bg-border" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            fitToScreen(true);
          }}
          aria-label="Fit to screen"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
