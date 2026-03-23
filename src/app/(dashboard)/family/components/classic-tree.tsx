// ============================================================================
// Classic Tree — traditional hierarchical family tree view
// Scrollable viewport with zoom, deterministic layout
// ============================================================================

"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { ZoomIn, ZoomOut, Maximize2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreeNodeData } from "./family-tree-node";
import { computeClassicTreeLayout } from "./classic-tree-layout";
import { ClassicTreeLinks } from "./classic-tree-links";
import { ClassicTreeNode } from "./classic-tree-node";

interface ClassicTreeProps {
  members: TreeNodeData[];
  currentUserId: string;
  currentUserMemberId: string | null;
  onEdit: (node: TreeNodeData) => void;
  onDelete: (id: string) => void;
  onInvite: (memberName: string) => void;
  onAddNew: () => void;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.15;

export function ClassicTree({
  members,
  currentUserId,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
  onAddNew,
}: ClassicTreeProps) {
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const layout = useMemo(
    () => computeClassicTreeLayout(members),
    [members]
  );

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleFitToView = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scaleX = container.clientWidth / (layout.width + 40);
    const scaleY = container.clientHeight / (layout.height + 40);
    const fitZoom = Math.min(scaleX, scaleY, 1);
    setZoom(Math.max(fitZoom, MIN_ZOOM));
    // Reset scroll to top-left
    container.scrollLeft = 0;
    container.scrollTop = 0;
  }, [layout.width, layout.height]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
    }
  }, []);

  return (
    <div className="relative h-full w-full rounded-xl border bg-muted/20">
      {/* ── Zoom controls ────────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background/90 backdrop-blur-sm"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background/90 backdrop-blur-sm"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background/90 backdrop-blur-sm"
          onClick={handleFitToView}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Zoom level indicator ─────────────────────────────── */}
      <div className="absolute top-3 left-3 z-20 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
        {Math.round(zoom * 100)}%
      </div>

      {/* ── Add connection FAB ───────────────────────────────── */}
      <Button
        size="sm"
        className="absolute bottom-4 right-4 z-20 rounded-full shadow-lg"
        onClick={onAddNew}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>

      {/* ── Scrollable viewport ──────────────────────────────── */}
      <div
        ref={scrollRef}
        className="h-full w-full overflow-auto"
        onWheel={handleWheel}
      >
        <div
          className="relative origin-top-left"
          style={{
            transform: `scale(${zoom})`,
            width: layout.width,
            height: layout.height,
            minWidth: "100%",
            minHeight: "100%",
          }}
        >
          {/* SVG link layer */}
          <ClassicTreeLinks
            nodes={layout.nodes}
            links={layout.links}
            width={layout.width}
            height={layout.height}
          />

          {/* Node cards */}
          {layout.nodes.map((ln) => {
            const member = byId.get(ln.id);
            if (!member) return null;
            return (
              <ClassicTreeNode
                key={ln.id}
                node={member}
                x={ln.x}
                y={ln.y}
                currentUserId={currentUserId}
                currentUserMemberId={currentUserMemberId}
                onEdit={onEdit}
                onDelete={onDelete}
                onInvite={onInvite}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
