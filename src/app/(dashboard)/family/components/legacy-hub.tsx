"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  memo,
} from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, Plus } from "lucide-react";
import type { HubNode, HubLink } from "./legacy-hub-types";
import { convertTreeData, type TreeNodeData } from "./legacy-hub-types";
import { useLegacyHubSimulation } from "./use-legacy-hub-simulation";
import { LegacyHubNode } from "./legacy-hub-node";
import { LegacyHubLinks } from "./legacy-hub-links";

// ---------------------------------------------------------------------------
// Draggable Node Wrapper — positioned at simulation coordinates
// ---------------------------------------------------------------------------
const DraggableHubNode = memo(function DraggableHubNode({
  node,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
  onDragStart,
  onDrag,
  onDragEnd,
  scale,
}: {
  node: HubNode;
  currentUserMemberId: string | null;
  onEdit: (n: HubNode) => void;
  onDelete: (id: string) => void;
  onInvite: (name: string) => void;
  onDragStart: (id: string, x: number, y: number) => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
  scale: number;
}) {
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  return (
    <div
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        transform: `translate(${x - 60}px, ${y - 60}px)`,
        width: 120,
      }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input, [role='button'], [role='menuitem'], [role='menu']"))
          return;

        e.stopPropagation();
        const rect = (e.currentTarget.parentElement?.parentElement as HTMLElement)?.getBoundingClientRect();
        if (!rect) return;

        const nx = (e.clientX - rect.left) / scale;
        const ny = (e.clientY - rect.top) / scale;
        onDragStart(node.id, nx, ny);

        const onMove = (ev: PointerEvent) => {
          onDrag((ev.clientX - rect.left) / scale, (ev.clientY - rect.top) / scale);
        };
        const onUp = () => {
          onDragEnd();
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
    >
      <LegacyHubNode
        node={node}
        currentUserMemberId={currentUserMemberId}
        onEdit={onEdit}
        onDelete={onDelete}
        onInvite={onInvite}
      />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Canvas — pan, zoom, fit-to-view + renders simulation
// ---------------------------------------------------------------------------
export function LegacyHubCanvas({
  members,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
  onAddNew,
}: {
  members: TreeNodeData[];
  currentUserMemberId: string | null;
  onEdit: (node: HubNode) => void;
  onDelete: (id: string) => void;
  onInvite: (name: string) => void;
  onAddNew: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Convert tree data → hub format
  const { nodes: inputNodes, links: inputLinks } = useMemo(
    () => convertTreeData(members, currentUserMemberId),
    [members, currentUserMemberId]
  );

  // Run D3 force simulation
  const { nodes, links, dragHandlers } = useLegacyHubSimulation(
    inputNodes,
    inputLinks,
    containerSize
  );

  // ─── Pan & Zoom state ───
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, [role='button'], [role='menuitem'], [role='menu']"))
        return;
      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pan]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(2.5, Math.max(0.15, s + (e.deltaY > 0 ? -0.06 : 0.06))));
  }, []);

  const zoomIn = useCallback(() => setScale((s) => Math.min(2.5, s + 0.2)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(0.15, s - 0.2)), []);

  // ─── Fit to view ───
  const fitToView = useCallback(() => {
    if (nodes.length === 0 || containerSize.width === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const treeW = maxX - minX + 300;
    const treeH = maxY - minY + 300;
    const newScale = Math.min(1.5, Math.max(0.2, Math.min(
      containerSize.width / treeW,
      containerSize.height / treeH
    )));
    setPan({
      x: containerSize.width / 2 - ((minX + maxX) / 2) * newScale,
      y: containerSize.height / 2 - ((minY + maxY) / 2) * newScale,
    });
    setScale(newScale);
  }, [nodes, containerSize]);

  // Auto-fit on first render
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!hasFitted.current && nodes.length > 0 && containerSize.width > 0) {
      const timer = setTimeout(() => {
        hasFitted.current = true;
        fitToView();
      }, 600); // wait for simulation to settle a bit
      return () => clearTimeout(timer);
    }
  }, [nodes.length, containerSize.width, fitToView]);

  const canvasW = Math.max(containerSize.width * 3, 5000);
  const canvasH = Math.max(containerSize.height * 3, 5000);

  return (
    <div className="relative w-full h-full">
      {/* ─── Controls ─── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card/80 backdrop-blur-sm" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card/80 backdrop-blur-sm" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card/80 backdrop-blur-sm" onClick={fitToView}>
          <Maximize className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ─── FAB: Add Connection ─── */}
      <div className="absolute bottom-4 right-4 z-20">
        <Button onClick={onAddNew} size="sm" className="rounded-full shadow-lg gap-1.5">
          <Plus className="h-4 w-4" />
          Add Connection
        </Button>
      </div>

      {/* ─── Pan/Zoom Canvas ─── */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: "none" }}
      >
        <div
          className="relative"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: dragging.current ? "none" : "transform 0.15s ease-out",
          }}
        >
          {/* SVG link layer */}
          <LegacyHubLinks links={links} width={canvasW} height={canvasH} />

          {/* Node cards */}
          {nodes.map((node) => (
            <DraggableHubNode
              key={node.id}
              node={node}
              currentUserMemberId={currentUserMemberId}
              onEdit={onEdit}
              onDelete={onDelete}
              onInvite={onInvite}
              onDragStart={dragHandlers.onDragStart}
              onDrag={dragHandlers.onDrag}
              onDragEnd={dragHandlers.onDragEnd}
              scale={scale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
