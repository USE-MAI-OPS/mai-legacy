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
import { LegacyHubNode } from "./legacy-hub-node";
import { LegacyHubLinks } from "./legacy-hub-links";
import { saveNodePosition } from "../actions";

// ---------------------------------------------------------------------------
// Draggable Node Wrapper — user places nodes wherever they want
// ---------------------------------------------------------------------------
const DraggableHubNode = memo(function DraggableHubNode({
  node,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
  onPositionChange,
  scale,
  panRef,
}: {
  node: HubNode;
  currentUserMemberId: string | null;
  onEdit: (n: HubNode) => void;
  onDelete: (id: string) => void;
  onInvite: (name: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  scale: number;
  panRef: React.RefObject<{ x: number; y: number }>;
}) {
  return (
    <div
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        transform: `translate(${node.x - 60}px, ${node.y - 60}px)`,
        width: 120,
      }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input, [role='button'], [role='menuitem'], [role='menu']"))
          return;

        e.stopPropagation();
        e.preventDefault();

        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const startNodeX = node.x;
        const startNodeY = node.y;
        let lastX = startNodeX;
        let lastY = startNodeY;

        const onMove = (ev: PointerEvent) => {
          const dx = (ev.clientX - startClientX) / scale;
          const dy = (ev.clientY - startClientY) / scale;
          lastX = startNodeX + dx;
          lastY = startNodeY + dy;
          onPositionChange(node.id, lastX, lastY);
        };

        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          // Save final position to DB
          saveNodePosition(node.id, lastX, lastY);
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
// Canvas — pan, zoom, fit-to-view + manual node placement
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
  const { nodes: initialNodes, links: initialLinks } = useMemo(
    () => convertTreeData(members, currentUserMemberId),
    [members, currentUserMemberId]
  );

  // Mutable node positions (local state for real-time dragging)
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
    () => new Map(initialNodes.map((n) => [n.id, { x: n.x, y: n.y }]))
  );

  // Sync when members change (new members added, etc)
  useEffect(() => {
    setNodePositions((prev) => {
      const next = new Map(prev);
      for (const n of initialNodes) {
        if (!next.has(n.id)) {
          next.set(n.id, { x: n.x, y: n.y });
        }
      }
      // Remove deleted nodes
      for (const id of next.keys()) {
        if (!initialNodes.find((n) => n.id === id)) {
          next.delete(id);
        }
      }
      return next;
    });
  }, [initialNodes]);

  // Build nodes with current positions
  const nodes = useMemo(() => {
    return initialNodes.map((n) => {
      const pos = nodePositions.get(n.id);
      return pos ? { ...n, x: pos.x, y: pos.y } : n;
    });
  }, [initialNodes, nodePositions]);

  // Build links with resolved positions — offset endpoints so lines
  // start/end at the edge of the node card instead of cutting through it
  const NODE_RADIUS = 70; // approximate radius of the circular node card
  const links = useMemo(() => {
    return initialLinks.map((link) => {
      const src = nodePositions.get(link.sourceId);
      const tgt = nodePositions.get(link.targetId);
      const sx0 = src?.x ?? 0;
      const sy0 = src?.y ?? 0;
      const tx0 = tgt?.x ?? 0;
      const ty0 = tgt?.y ?? 0;

      // Vector from source → target
      const dx = tx0 - sx0;
      const dy = ty0 - sy0;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only offset if nodes are far enough apart (avoid collapsing short links)
      if (dist > NODE_RADIUS * 2.5) {
        const ux = dx / dist; // unit vector
        const uy = dy / dist;
        return {
          ...link,
          sx: sx0 + ux * NODE_RADIUS,
          sy: sy0 + uy * NODE_RADIUS,
          tx: tx0 - ux * NODE_RADIUS,
          ty: ty0 - uy * NODE_RADIUS,
        };
      }

      return {
        ...link,
        sx: sx0,
        sy: sy0,
        tx: tx0,
        ty: ty0,
      };
    });
  }, [initialLinks, nodePositions]);

  // Handle node drag
  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setNodePositions((prev) => {
      const next = new Map(prev);
      next.set(id, { x, y });
      return next;
    });
  }, []);

  // Debounced save (saves the latest position after drag ends)
  const savePosRef = useRef<{ id: string; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!savePosRef.current) return;
    const { id, x, y } = savePosRef.current;
    saveNodePosition(id, x, y);
    savePosRef.current = null;
  }, [nodePositions]);

  // ─── Pan & Zoom state ───
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;

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
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
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
      hasFitted.current = true;
      fitToView();
    }
  }, [nodes.length, containerSize.width, fitToView]);

  const canvasW = 5000;
  const canvasH = 5000;

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
              onPositionChange={handlePositionChange}
              scale={scale}
              panRef={panRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
