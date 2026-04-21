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
import { ZoomIn, ZoomOut, Maximize, MousePointer } from "lucide-react";
import type { HubNode, HubLink, TreeViewSpec } from "./legacy-hub-types";
import { convertTreeData, type TreeNodeData } from "./legacy-hub-types";
import { LegacyHubNode } from "./legacy-hub-node";
import { LegacyHubLinks } from "./legacy-hub-links";
import { saveNodePosition } from "../actions";
import { getMockEntryTotal } from "./mai-tree-mock-data";

// ---------------------------------------------------------------------------
// Draggable Node Wrapper — supports single + group drag + click/dblclick
// ---------------------------------------------------------------------------
const DraggableHubNode = memo(function DraggableHubNode({
  node,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
  onPositionChange,
  onGroupDrag,
  onGroupDragEnd,
  scale,
  isSelected,
  selectedCount,
  onSelect,
  onNodeClick,
  onNodeDoubleClick,
  dimmed,
  draggable,
}: {
  node: HubNode;
  currentUserMemberId: string | null;
  onEdit: (n: HubNode) => void;
  onDelete: (id: string) => void;
  onInvite: (name: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onGroupDrag: (dx: number, dy: number) => void;
  onGroupDragEnd: () => void;
  scale: number;
  isSelected: boolean;
  selectedCount: number;
  onSelect: (id: string, shiftKey: boolean) => void;
  onNodeClick?: (node: HubNode, screenPos: { x: number; y: number }) => void;
  onNodeDoubleClick?: (node: HubNode) => void;
  dimmed: boolean;
  draggable: boolean;
}) {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryCount = getMockEntryTotal(node.id, node.displayName);
  // Wider slot for the "YOU" node (larger avatar)
  const nodeWidth = node.isMe ? 140 : 120;
  const nodeOffset = nodeWidth / 2;

  return (
    <div
      className={`absolute ${
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${
        isSelected
          ? "outline outline-2 outline-primary/60 outline-offset-4 rounded-2xl"
          : ""
      }`}
      style={{
        transform: `translate(${node.x - nodeOffset}px, ${node.y - nodeOffset}px)`,
        width: nodeWidth,
        zIndex: isSelected ? 5 : 1,
        opacity: dimmed ? 0.25 : 1,
        transition: "transform 0.3s ease, opacity 0.2s ease",
      }}
      onDoubleClick={() => {
        // Cancel pending single-click
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
          clickTimer.current = null;
        }
        onNodeDoubleClick?.(node);
      }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(
            "button, a, input, [role='button'], [role='menuitem'], [role='menu']"
          )
        )
          return;

        e.stopPropagation();
        e.preventDefault();

        // In cluster mode, positions are owned by the view-spec — clicks
        // still work but drags would fight the layout, so we skip the
        // drag path entirely and only fire click on pointer-up.
        if (!draggable) {
          const onUpClick = (ev: PointerEvent) => {
            window.removeEventListener("pointerup", onUpClick);
            if (onNodeClick) {
              clickTimer.current = setTimeout(() => {
                clickTimer.current = null;
                onNodeClick(node, { x: ev.clientX, y: ev.clientY });
              }, 250);
            }
          };
          window.addEventListener("pointerup", onUpClick);
          return;
        }

        // Handle selection
        if (e.shiftKey) {
          onSelect(node.id, true);
          return; // shift+click = toggle selection only, no drag
        }

        // If this node isn't selected and we're not shift-clicking,
        // select only this node
        const draggingGroup = isSelected && selectedCount > 1;
        if (!isSelected) {
          onSelect(node.id, false);
        }

        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const startNodeX = node.x;
        const startNodeY = node.y;
        let lastX = startNodeX;
        let lastY = startNodeY;
        let didMove = false;

        const onMove = (ev: PointerEvent) => {
          const dx = (ev.clientX - startClientX) / scale;
          const dy = (ev.clientY - startClientY) / scale;
          didMove = true;

          if (draggingGroup) {
            // Move the whole group by the delta
            onGroupDrag(dx, dy);
          } else {
            lastX = startNodeX + dx;
            lastY = startNodeY + dy;
            onPositionChange(node.id, lastX, lastY);
          }
        };

        const onUp = (ev: PointerEvent) => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);

          if (draggingGroup && didMove) {
            onGroupDragEnd();
          } else if (!draggingGroup && didMove) {
            saveNodePosition(node.id, lastX, lastY);
          }

          // Fire single-click if no drag occurred
          if (!didMove && onNodeClick) {
            // Delay to allow double-click to cancel
            clickTimer.current = setTimeout(() => {
              clickTimer.current = null;
              onNodeClick(node, { x: ev.clientX, y: ev.clientY });
            }, 250);
          }
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
        entryCount={entryCount}
      />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Marquee selection rectangle
// ---------------------------------------------------------------------------
function MarqueeRect({
  rect,
}: {
  rect: { x1: number; y1: number; x2: number; y2: number };
}) {
  const left = Math.min(rect.x1, rect.x2);
  const top = Math.min(rect.y1, rect.y2);
  const width = Math.abs(rect.x2 - rect.x1);
  const height = Math.abs(rect.y2 - rect.y1);

  return (
    <div
      className="absolute pointer-events-none z-30 border-2 border-primary/50 bg-primary/8 rounded-sm"
      style={{ left, top, width, height }}
    />
  );
}

// ---------------------------------------------------------------------------
// Cluster layout math — radial arrangement around the "YOU" node.
// Mirrors the pattern from people-network-mockup.jsx:getPositions().
// ---------------------------------------------------------------------------
const CLUSTER_RADIUS = 900;

function computeClusterPositions(
  clusters: { label: string; memberIds: string[] }[],
  center: { x: number; y: number }
): { positions: Map<string, { x: number; y: number }>; labels: { label: string; x: number; y: number }[] } {
  const positions = new Map<string, { x: number; y: number }>();
  const labels: { label: string; x: number; y: number }[] = [];
  const n = clusters.length;
  if (n === 0) return { positions, labels };

  for (let i = 0; i < n; i++) {
    const cluster = clusters[i];
    const baseAngle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const clusterCx = center.x + Math.cos(baseAngle) * CLUSTER_RADIUS;
    const clusterCy = center.y + Math.sin(baseAngle) * CLUSTER_RADIUS;
    const count = cluster.memberIds.length;
    const r =
      count <= 1 ? 0 : count <= 3 ? 180 : count <= 6 ? 240 : 320;

    // Label floats further out than the cluster ring
    labels.push({
      label: `${cluster.label} (${count})`,
      x: center.x + Math.cos(baseAngle) * (CLUSTER_RADIUS + r + 120),
      y: center.y + Math.sin(baseAngle) * (CLUSTER_RADIUS + r + 120),
    });

    cluster.memberIds.forEach((id, idx) => {
      if (count === 1) {
        positions.set(id, { x: clusterCx, y: clusterCy });
        return;
      }
      const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
      positions.set(id, {
        x: clusterCx + Math.cos(angle) * r,
        y: clusterCy + Math.sin(angle) * r,
      });
    });
  }

  return { positions, labels };
}

// ---------------------------------------------------------------------------
// Canvas — pan, zoom, fit-to-view, marquee select, group drag
// ---------------------------------------------------------------------------
export function LegacyHubCanvas({
  members,
  currentUserMemberId,
  viewSpec,
  onEdit,
  onDelete,
  onInvite,
  onNodeClick,
  onNodeDoubleClick,
}: {
  members: TreeNodeData[];
  currentUserMemberId: string | null;
  viewSpec?: TreeViewSpec;
  onEdit: (node: HubNode) => void;
  onDelete: (id: string) => void;
  onInvite: (name: string) => void;
  onNodeClick?: (node: HubNode, screenPos: { x: number; y: number }) => void;
  onNodeDoubleClick?: (node: HubNode) => void;
}) {
  // Dim / cluster sets for fast lookup in render
  const dimSet = useMemo(
    () => new Set(viewSpec?.dimIds ?? []),
    [viewSpec?.dimIds]
  );
  const clusterMode = !!viewSpec?.clusters && viewSpec.clusters.length > 0;
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
  const [nodePositions, setNodePositions] = useState<
    Map<string, { x: number; y: number }>
  >(() => new Map(initialNodes.map((n) => [n.id, { x: n.x, y: n.y }])));

  // Sync when members change
  useEffect(() => {
    setNodePositions((prev) => {
      const next = new Map(prev);
      for (const n of initialNodes) {
        if (!next.has(n.id)) {
          next.set(n.id, { x: n.x, y: n.y });
        }
      }
      for (const id of next.keys()) {
        if (!initialNodes.find((n) => n.id === id)) {
          next.delete(id);
        }
      }
      return next;
    });
  }, [initialNodes]);

  // Cluster position overrides (if the active view-spec asks for a split view).
  // Anchored at the ego (YOU) node's current position so clusters orbit around
  // the user — or at canvas center if ego isn't placed yet.
  const clusterOverrides = useMemo(() => {
    if (!clusterMode || !viewSpec?.clusters) {
      return { positions: new Map<string, { x: number; y: number }>(), labels: [] as { label: string; x: number; y: number }[] };
    }
    const egoNode = initialNodes.find((n) => n.isMe);
    const center = egoNode
      ? nodePositions.get(egoNode.id) ?? { x: egoNode.x, y: egoNode.y }
      : { x: 2500, y: 2500 };
    return computeClusterPositions(viewSpec.clusters, center);
  }, [clusterMode, viewSpec?.clusters, initialNodes, nodePositions]);

  // Build nodes with current positions — cluster overrides win over saved positions
  const nodes = useMemo(() => {
    return initialNodes.map((n) => {
      const cluster = clusterOverrides.positions.get(n.id);
      if (cluster) return { ...n, x: cluster.x, y: cluster.y };
      const pos = nodePositions.get(n.id);
      return pos ? { ...n, x: pos.x, y: pos.y } : n;
    });
  }, [initialNodes, nodePositions, clusterOverrides]);

  // Build links with resolved positions + endpoint offset
  const NODE_RADIUS = 70;
  const links = useMemo(() => {
    return initialLinks.map((link) => {
      const src =
        clusterOverrides.positions.get(link.sourceId) ??
        nodePositions.get(link.sourceId);
      const tgt =
        clusterOverrides.positions.get(link.targetId) ??
        nodePositions.get(link.targetId);
      const sx0 = src?.x ?? 0;
      const sy0 = src?.y ?? 0;
      const tx0 = tgt?.x ?? 0;
      const ty0 = tgt?.y ?? 0;
      const dim = dimSet.has(link.sourceId) || dimSet.has(link.targetId);

      const dx = tx0 - sx0;
      const dy = ty0 - sy0;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > NODE_RADIUS * 2.5) {
        const ux = dx / dist;
        const uy = dy / dist;
        return {
          ...link,
          sx: sx0 + ux * NODE_RADIUS,
          sy: sy0 + uy * NODE_RADIUS,
          tx: tx0 - ux * NODE_RADIUS,
          ty: ty0 - uy * NODE_RADIUS,
          dim,
        };
      }

      return { ...link, sx: sx0, sy: sy0, tx: tx0, ty: ty0, dim };
    });
  }, [initialLinks, nodePositions, clusterOverrides, dimSet]);

  // ─── Selection state ───
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [marquee, setMarquee] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // Store group drag start positions so we can apply deltas
  const groupDragStart = useRef<Map<string, { x: number; y: number }> | null>(
    null
  );

  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      if (shiftKey) {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      }
      // Non-shift click: select only this node
      return new Set([id]);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Handle single node drag
  const handlePositionChange = useCallback(
    (id: string, x: number, y: number) => {
      setNodePositions((prev) => {
        const next = new Map(prev);
        next.set(id, { x, y });
        return next;
      });
    },
    []
  );

  // Handle group drag — apply delta to all selected nodes
  const handleGroupDrag = useCallback(
    (dx: number, dy: number) => {
      if (!groupDragStart.current) {
        groupDragStart.current = new Map();
        for (const id of selectedIds) {
          const pos = nodePositions.get(id);
          if (pos) {
            groupDragStart.current.set(id, { x: pos.x, y: pos.y });
          }
        }
      }

      setNodePositions((prev) => {
        const next = new Map(prev);
        for (const [id, start] of groupDragStart.current!) {
          next.set(id, { x: start.x + dx, y: start.y + dy });
        }
        return next;
      });
    },
    [selectedIds, nodePositions]
  );

  // Save all group positions on drag end
  const handleGroupDragEnd = useCallback(() => {
    if (groupDragStart.current) {
      for (const id of groupDragStart.current.keys()) {
        const pos = nodePositions.get(id);
        if (pos) {
          saveNodePosition(id, pos.x, pos.y);
        }
      }
      groupDragStart.current = null;
    }
  }, [nodePositions]);

  // ─── Pan & Zoom state ───
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const marqueeActive = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "button, a, input, [role='button'], [role='menuitem'], [role='menu']"
        )
      )
        return;

      const rect = containerRef.current?.getBoundingClientRect();
      const mx = rect ? e.clientX - rect.left : e.clientX;
      const my = rect ? e.clientY - rect.top : e.clientY;

      if (e.shiftKey) {
        marqueeActive.current = true;
        setMarquee({ x1: mx, y1: my, x2: mx, y2: my });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      clearSelection();
      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pan, clearSelection]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (marqueeActive.current) {
        const rect = containerRef.current?.getBoundingClientRect();
        const mx = rect ? e.clientX - rect.left : e.clientX;
        const my = rect ? e.clientY - rect.top : e.clientY;
        setMarquee((prev) => (prev ? { ...prev, x2: mx, y2: my } : null));
        return;
      }

      if (!dragging.current) return;
      setPan({
        x: panStart.current.x + (e.clientX - dragStart.current.x),
        y: panStart.current.y + (e.clientY - dragStart.current.y),
      });
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (marqueeActive.current && marquee) {
        marqueeActive.current = false;

        const offsetX = pan.x;
        const offsetY = pan.y;

        const worldX1 = (Math.min(marquee.x1, marquee.x2) - offsetX) / scale;
        const worldY1 = (Math.min(marquee.y1, marquee.y2) - offsetY) / scale;
        const worldX2 = (Math.max(marquee.x1, marquee.x2) - offsetX) / scale;
        const worldY2 = (Math.max(marquee.y1, marquee.y2) - offsetY) / scale;

        const newSelected = new Set<string>();
        for (const node of nodes) {
          if (
            node.x >= worldX1 &&
            node.x <= worldX2 &&
            node.y >= worldY1 &&
            node.y <= worldY2
          ) {
            newSelected.add(node.id);
          }
        }

        if (e.shiftKey) {
          setSelectedIds((prev) => {
            const merged = new Set(prev);
            for (const id of newSelected) merged.add(id);
            return merged;
          });
        } else {
          setSelectedIds(newSelected);
        }

        setMarquee(null);
        return;
      }

      dragging.current = false;
    },
    [marquee, nodes, pan, scale]
  );

  // Zoom toward cursor
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const oldScale = scale;
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      const newScale = Math.min(2.5, Math.max(0.15, oldScale + delta));

      const wx = (mx - pan.x) / oldScale;
      const wy = (my - pan.y) / oldScale;

      setPan({
        x: mx - wx * newScale,
        y: my - wy * newScale,
      });
      setScale(newScale);
    },
    [scale, pan]
  );

  // Button zoom toward center
  const zoomTowardCenter = useCallback(
    (delta: number) => {
      const el = containerRef.current;
      if (!el) {
        setScale((s) => Math.min(2.5, Math.max(0.15, s + delta)));
        return;
      }
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      const oldScale = scale;
      const newScale = Math.min(2.5, Math.max(0.15, oldScale + delta));
      const wx = (cx - pan.x) / oldScale;
      const wy = (cy - pan.y) / oldScale;
      setPan({ x: cx - wx * newScale, y: cy - wy * newScale });
      setScale(newScale);
    },
    [scale, pan]
  );

  const zoomIn = useCallback(
    () => zoomTowardCenter(0.2),
    [zoomTowardCenter]
  );
  const zoomOut = useCallback(
    () => zoomTowardCenter(-0.2),
    [zoomTowardCenter]
  );

  // ─── Fit to view ───
  const fitToView = useCallback(() => {
    if (nodes.length === 0 || containerSize.width === 0) return;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
    const treeW = maxX - minX + 300;
    const treeH = maxY - minY + 300;
    const newScale = Math.min(
      1.5,
      Math.max(0.2, Math.min(containerSize.width / treeW, containerSize.height / treeH))
    );
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

  // Re-fit whenever cluster mode toggles — cluster positions sit far from
  // the saved positions, so the user would otherwise have to hunt for them.
  const prevClusterMode = useRef(clusterMode);
  useEffect(() => {
    if (prevClusterMode.current !== clusterMode && containerSize.width > 0) {
      prevClusterMode.current = clusterMode;
      fitToView();
    }
  }, [clusterMode, containerSize.width, fitToView]);

  // Keyboard: Escape to deselect, Ctrl+A to select all
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(new Set(nodes.map((n) => n.id)));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nodes, clearSelection]);

  const canvasW = 5000;
  const canvasH = 5000;

  return (
    <div className="relative w-full h-full">
      {/* ─── Controls ─── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/80 backdrop-blur-sm"
          onClick={zoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/80 backdrop-blur-sm"
          onClick={zoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/80 backdrop-blur-sm"
          onClick={fitToView}
        >
          <Maximize className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ─── Selection hint ─── */}
      {selectedIds.size > 0 && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-card/90 backdrop-blur-sm border rounded-full px-3 py-1.5 shadow-sm">
          <MousePointer className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">
            {selectedIds.size} selected
          </span>
          <button
            onClick={clearSelection}
            className="text-xs text-muted-foreground hover:text-foreground ml-1"
          >
            ✕
          </button>
        </div>
      )}

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

          {/* Cluster labels (split-view mode) */}
          {clusterMode &&
            clusterOverrides.labels.map((l) => (
              <div
                key={l.label}
                className="absolute pointer-events-none z-[4] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-card/90 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-primary shadow-sm"
                style={{ left: l.x, top: l.y }}
              >
                {l.label}
              </div>
            ))}

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
              onGroupDrag={handleGroupDrag}
              onGroupDragEnd={handleGroupDragEnd}
              scale={scale}
              isSelected={selectedIds.has(node.id)}
              selectedCount={selectedIds.size}
              onSelect={handleSelect}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              dimmed={dimSet.has(node.id)}
              draggable={!clusterMode}
            />
          ))}
        </div>

        {/* Marquee selection rectangle overlay */}
        {marquee && <MarqueeRect rect={marquee} />}
      </div>
    </div>
  );
}
