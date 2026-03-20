"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceRadial,
  forceCenter,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { HubNode, HubLink } from "./legacy-hub-types";

// ---------------------------------------------------------------------------
// Simulation constants — tuned for a gentle, organic feel
// ---------------------------------------------------------------------------
const REPEL_STRENGTH = -180;      // negative = repel (how hard nodes push apart)
const COLLISION_RADIUS = 70;      // hard collision boundary per node
const COLLISION_PADDING = 12;     // extra breathing room
const LINK_DISTANCE_BASE = 160;   // base elastic link length
const RADIAL_STRENGTH = 0.08;     // gentle pull toward concentric rings
const RADIAL_RING_GAP = 180;     // pixels between each ring
const CENTER_STRENGTH = 0.02;     // very gentle drift toward center
const ALPHA_DECAY = 0.015;        // how fast simulation cools (lower = longer settle)
const VELOCITY_DECAY = 0.35;      // friction (higher = snappier stop)

// ---------------------------------------------------------------------------
// Link distance by type — closer relationships have shorter links
// ---------------------------------------------------------------------------
function linkDistance(link: HubLink): number {
  switch (link.type) {
    case "spouse": return LINK_DISTANCE_BASE * 0.6;
    case "dna": return LINK_DISTANCE_BASE;
    case "friend": return LINK_DISTANCE_BASE * 1.4;
    default: return LINK_DISTANCE_BASE;
  }
}

// ---------------------------------------------------------------------------
// The simulation hook
// ---------------------------------------------------------------------------
export interface SimulationOutput {
  /** Current node positions (re-renders on each tick) */
  nodes: HubNode[];
  /** Links with resolved source/target node refs */
  links: HubLink[];
  /** True once the simulation has cooled below threshold */
  settled: boolean;
  /** Tick counter (triggers React re-render) */
  tick: number;
  /** Drag handlers for interactive node movement */
  dragHandlers: {
    onDragStart: (nodeId: string, x: number, y: number) => void;
    onDrag: (x: number, y: number) => void;
    onDragEnd: () => void;
  };
  /** Re-heat the simulation (e.g., after adding a node) */
  reheat: () => void;
}

export function useLegacyHubSimulation(
  inputNodes: HubNode[],
  inputLinks: HubLink[],
  containerSize: { width: number; height: number }
): SimulationOutput {
  const simRef = useRef<Simulation<HubNode, HubLink> | null>(null);
  const nodesRef = useRef<HubNode[]>([]);
  const linksRef = useRef<HubLink[]>([]);
  const [tick, setTick] = useState(0);
  const [settled, setSettled] = useState(false);
  const dragNodeRef = useRef<string | null>(null);

  const cx = containerSize.width / 2;
  const cy = containerSize.height / 2;

  // ─── Initialize / update simulation when data changes ───
  useEffect(() => {
    if (inputNodes.length === 0 || containerSize.width === 0) return;

    // Deep copy nodes so D3 can mutate x/y/vx/vy
    const simNodes: HubNode[] = inputNodes.map((n) => {
      // Find existing node position to preserve continuity
      const existing = nodesRef.current.find((e) => e.id === n.id);
      return {
        ...n,
        x: existing?.x ?? cx + (Math.random() - 0.5) * 100,
        y: existing?.y ?? cy + (Math.random() - 0.5) * 100,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        // Pin the "me" node at center
        fx: n.role === "me" ? cx : (existing?.fx ?? null),
        fy: n.role === "me" ? cy : (existing?.fy ?? null),
      };
    });

    const simLinks: HubLink[] = inputLinks.map((l) => ({ ...l }));

    nodesRef.current = simNodes;
    linksRef.current = simLinks;

    // Kill previous simulation
    if (simRef.current) simRef.current.stop();

    // Build new simulation
    const sim = forceSimulation<HubNode>(simNodes)
      .alphaDecay(ALPHA_DECAY)
      .velocityDecay(VELOCITY_DECAY)
      // Gentle center gravity
      .force("center", forceCenter<HubNode>(cx, cy).strength(CENTER_STRENGTH))
      // Repulsion between all nodes
      .force("charge", forceManyBody<HubNode>().strength(REPEL_STRENGTH).distanceMax(600))
      // Hard collision boundary
      .force("collide", forceCollide<HubNode>(COLLISION_RADIUS + COLLISION_PADDING).iterations(2))
      // Elastic links
      .force(
        "link",
        forceLink<HubNode, HubLink>(simLinks)
          .id((d) => d.id)
          .distance((l) => linkDistance(l as HubLink))
          .strength(0.4)
      )
      // Radial pull — nodes orbit at ring-based distance from center
      .force(
        "radial",
        forceRadial<HubNode>(
          (d) => d.ring * RADIAL_RING_GAP,
          cx,
          cy
        ).strength(RADIAL_STRENGTH)
      );

    // Tick handler — triggers React re-render
    sim.on("tick", () => {
      setTick((t) => t + 1);
    });

    sim.on("end", () => {
      setSettled(true);
    });

    setSettled(false);
    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [inputNodes, inputLinks, containerSize.width, containerSize.height, cx, cy]);

  // ─── Drag handlers ───
  const onDragStart = useCallback((nodeId: string, x: number, y: number) => {
    const sim = simRef.current;
    if (!sim) return;
    dragNodeRef.current = nodeId;

    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
    }

    // Reheat on drag
    sim.alphaTarget(0.3).restart();
  }, []);

  const onDrag = useCallback((x: number, y: number) => {
    const nodeId = dragNodeRef.current;
    if (!nodeId) return;
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
    }
  }, []);

  const onDragEnd = useCallback(() => {
    const sim = simRef.current;
    const nodeId = dragNodeRef.current;
    if (!sim || !nodeId) return;

    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node && node.role !== "me") {
      // Release pin (except "me" which stays fixed)
      node.fx = null;
      node.fy = null;
    }

    dragNodeRef.current = null;
    sim.alphaTarget(0); // let simulation cool naturally
  }, []);

  const reheat = useCallback(() => {
    const sim = simRef.current;
    if (sim) {
      setSettled(false);
      sim.alpha(0.8).restart();
    }
  }, []);

  // ─── Build output (reads mutable refs, keyed by tick) ───
  const nodes = useMemo(() => {
    return [...nodesRef.current];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const links = useMemo(() => {
    return [...linksRef.current];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return {
    nodes,
    links,
    settled,
    tick,
    dragHandlers: { onDragStart, onDrag, onDragEnd },
    reheat,
  };
}
