"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceCollide,
  forceLink,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { TreeNodeData } from "./family-tree-node";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SimNode extends SimulationNodeDatum {
  id: string;
  data: TreeNodeData | null; // null for union nodes
  generation: number;
  spouseId: string | null;
  parentId: string | null;
  isUnion: boolean; // true for invisible union/marriage nodes
  branchIndex: number; // which family branch (for X sorting)
  sortIndex: number; // horizontal sort order within generation
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  type: "parent-child" | "spouse" | "parent-union" | "union-child";
}

export interface SpousePair {
  node1: SimNode;
  node2: SimNode;
  unionNode: SimNode;
  midX: number;
  midY: number;
  pillWidth: number;
  pillHeight: number;
}

export interface PositionedLink {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourceGeneration: number;
  targetGeneration: number;
  fromUnion: boolean;
}

// ---------------------------------------------------------------------------
// Compute generation depth via BFS from roots
// ---------------------------------------------------------------------------
function computeGenerations(members: TreeNodeData[]): Map<string, number> {
  const generations = new Map<string, number>();
  const childrenMap = new Map<string, string[]>();
  const spouseOf = new Map<string, string>();

  for (const m of members) {
    if (m.parent_id) {
      const kids = childrenMap.get(m.parent_id) ?? [];
      kids.push(m.id);
      childrenMap.set(m.parent_id, kids);
    }
    if (m.parent2_id) {
      const kids = childrenMap.get(m.parent2_id) ?? [];
      if (!kids.includes(m.id)) kids.push(m.id);
      childrenMap.set(m.parent2_id, kids);
    }
    if (m.spouse_id) {
      spouseOf.set(m.id, m.spouse_id);
    }
  }

  // BFS from roots (members with no parent_id AND no parent2_id)
  const roots = members.filter((m) => !m.parent_id && !m.parent2_id);
  const queue: { id: string; gen: number }[] = [];

  for (const r of roots) {
    if (!generations.has(r.id)) {
      generations.set(r.id, 0);
      queue.push({ id: r.id, gen: 0 });
      if (r.spouse_id && !generations.has(r.spouse_id)) {
        generations.set(r.spouse_id, 0);
        queue.push({ id: r.spouse_id, gen: 0 });
      }
    }
  }

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    const kids = childrenMap.get(id) ?? [];
    for (const kidId of kids) {
      if (!generations.has(kidId)) {
        generations.set(kidId, gen + 1);
        queue.push({ id: kidId, gen: gen + 1 });
        const kidSpouse = spouseOf.get(kidId);
        if (kidSpouse && !generations.has(kidSpouse)) {
          generations.set(kidSpouse, gen + 1);
          queue.push({ id: kidSpouse, gen: gen + 1 });
        }
      }
    }
  }

  return generations;
}

// ---------------------------------------------------------------------------
// Compute family branch indices via BFS from roots
// Each root couple gets a unique branch, descendants inherit it
// ---------------------------------------------------------------------------
function computeBranches(members: TreeNodeData[]): Map<string, number> {
  const branches = new Map<string, number>();
  const childrenMap = new Map<string, string[]>();

  for (const m of members) {
    if (m.parent_id) {
      const kids = childrenMap.get(m.parent_id) ?? [];
      kids.push(m.id);
      childrenMap.set(m.parent_id, kids);
    }
    if (m.parent2_id) {
      const kids = childrenMap.get(m.parent2_id) ?? [];
      if (!kids.includes(m.id)) kids.push(m.id);
      childrenMap.set(m.parent2_id, kids);
    }
  }

  const roots = members.filter((m) => !m.parent_id && !m.parent2_id);
  let branchIdx = 0;

  // Group root spouse pairs together
  const rootAssigned = new Set<string>();
  for (const r of roots) {
    if (rootAssigned.has(r.id)) continue;
    const currentBranch = branchIdx++;
    branches.set(r.id, currentBranch);
    rootAssigned.add(r.id);

    // Spouse gets same branch
    if (r.spouse_id) {
      branches.set(r.spouse_id, currentBranch);
      rootAssigned.add(r.spouse_id);
    }

    // BFS all descendants into same branch
    const queue = [r.id];
    if (r.spouse_id) queue.push(r.spouse_id);

    while (queue.length > 0) {
      const id = queue.shift()!;
      const kids = childrenMap.get(id) ?? [];
      for (const kidId of kids) {
        if (!branches.has(kidId)) {
          branches.set(kidId, currentBranch);
          queue.push(kidId);
          // Kid's spouse inherits the branch
          const kid = members.find((m) => m.id === kidId);
          if (kid?.spouse_id && !branches.has(kid.spouse_id)) {
            branches.set(kid.spouse_id, currentBranch);
            queue.push(kid.spouse_id);
          }
        }
      }
    }
  }

  return branches;
}

// ---------------------------------------------------------------------------
// Compute sort indices for horizontal ordering (BFS left-to-right)
// ---------------------------------------------------------------------------
function computeSortIndices(
  members: TreeNodeData[],
  branches: Map<string, number>
): Map<string, number> {
  const sortIndices = new Map<string, number>();
  const childrenMap = new Map<string, string[]>();

  for (const m of members) {
    if (m.parent_id) {
      const kids = childrenMap.get(m.parent_id) ?? [];
      kids.push(m.id);
      childrenMap.set(m.parent_id, kids);
    }
    if (m.parent2_id) {
      const kids = childrenMap.get(m.parent2_id) ?? [];
      if (!kids.includes(m.id)) kids.push(m.id);
      childrenMap.set(m.parent2_id, kids);
    }
  }

  // Sort roots by branch index first
  const roots = members
    .filter((m) => !m.parent_id && !m.parent2_id)
    .sort((a, b) => (branches.get(a.id) ?? 0) - (branches.get(b.id) ?? 0));

  let idx = 0;
  const assigned = new Set<string>();

  // BFS layer by layer
  const queue: string[] = [];
  for (const r of roots) {
    if (!assigned.has(r.id)) {
      sortIndices.set(r.id, idx++);
      assigned.add(r.id);
      queue.push(r.id);
      if (r.spouse_id && !assigned.has(r.spouse_id)) {
        sortIndices.set(r.spouse_id, idx++);
        assigned.add(r.spouse_id);
        queue.push(r.spouse_id);
      }
    }
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const kids = childrenMap.get(id) ?? [];
    for (const kidId of kids) {
      if (!assigned.has(kidId)) {
        sortIndices.set(kidId, idx++);
        assigned.add(kidId);
        queue.push(kidId);
        const kid = members.find((m) => m.id === kidId);
        if (kid?.spouse_id && !assigned.has(kid.spouse_id)) {
          sortIndices.set(kid.spouse_id, idx++);
          assigned.add(kid.spouse_id);
          queue.push(kid.spouse_id);
        }
      }
    }
  }

  return sortIndices;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useFamilyForceLayout(
  members: TreeNodeData[],
  containerSize: { width: number; height: number }
) {
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const [tick, setTick] = useState(0);
  const [settled, setSettled] = useState(false);
  const dragNodeRef = useRef<SimNode | null>(null);

  // Build nodes & links when members change
  useEffect(() => {
    if (members.length === 0 || containerSize.width === 0) return;

    const generations = computeGenerations(members);
    const branches = computeBranches(members);
    const sortIndices = computeSortIndices(members, branches);
    const byId = new Map<string, TreeNodeData>();
    for (const m of members) byId.set(m.id, m);

    const totalBranches = new Set(branches.values()).size;

    // Try to preserve existing positions
    const existingPositions = new Map<string, { x: number; y: number }>();
    for (const n of nodesRef.current) {
      if (n.x !== undefined && n.y !== undefined) {
        existingPositions.set(n.id, { x: n.x, y: n.y });
      }
    }

    // Compute branch X targets (spread branches across canvas width)
    const branchXTargets = new Map<number, number>();
    const branchWidth = Math.max(350, containerSize.width / Math.max(totalBranches, 1));
    for (let b = 0; b < totalBranches; b++) {
      branchXTargets.set(
        b,
        containerSize.width / 2 + (b - (totalBranches - 1) / 2) * branchWidth
      );
    }

    // --- Create person nodes ---
    const nodes: SimNode[] = members.map((m) => {
      const gen = generations.get(m.id) ?? 0;
      const branch = branches.get(m.id) ?? 0;
      const sortIdx = sortIndices.get(m.id) ?? 0;
      const existing = existingPositions.get(m.id);
      const branchX = branchXTargets.get(branch) ?? containerSize.width / 2;

      return {
        id: m.id,
        data: m,
        generation: gen,
        spouseId: m.spouse_id,
        parentId: m.parent_id,
        isUnion: false,
        branchIndex: branch,
        sortIndex: sortIdx,
        x: existing?.x ?? branchX + (Math.random() - 0.5) * 100,
        y: existing?.y ?? gen * 220 + 100 + (Math.random() - 0.5) * 40,
      };
    });

    const nodeMap = new Map<string, SimNode>();
    for (const n of nodes) nodeMap.set(n.id, n);

    // --- Identify spouse pairs and create union nodes ---
    const spousePairsForUnion: { id1: string; id2: string }[] = [];
    const spouseSeen = new Set<string>();
    for (const m of members) {
      if (m.spouse_id && byId.has(m.spouse_id) && !spouseSeen.has(m.id)) {
        spousePairsForUnion.push({ id1: m.id, id2: m.spouse_id });
        spouseSeen.add(m.id);
        spouseSeen.add(m.spouse_id);
      }
    }

    // Find which children belong to each spouse pair
    // A child belongs to a union if BOTH parents are in the spouse pair,
    // or if one parent is in the pair (single-linked)
    const unionNodes: SimNode[] = [];
    const childToUnion = new Map<string, string>(); // child id → union node id
    const unionToParents = new Map<string, { id1: string; id2: string }>();

    for (const pair of spousePairsForUnion) {
      // Find children: any member whose parent_id or parent2_id is one of the pair
      const children: string[] = [];
      for (const m of members) {
        const hasParent1 =
          m.parent_id === pair.id1 ||
          m.parent_id === pair.id2 ||
          m.parent2_id === pair.id1 ||
          m.parent2_id === pair.id2;
        if (hasParent1 && m.id !== pair.id1 && m.id !== pair.id2) {
          children.push(m.id);
        }
      }

      if (children.length === 0) continue; // No children, no union node needed

      const parent1 = nodeMap.get(pair.id1);
      const parent2 = nodeMap.get(pair.id2);
      if (!parent1 || !parent2) continue;

      const unionId = `union-${pair.id1}-${pair.id2}`;
      const gen = parent1.generation;
      const branch = parent1.branchIndex;
      const branchX = branchXTargets.get(branch) ?? containerSize.width / 2;
      const existingU = existingPositions.get(unionId);

      const unionNode: SimNode = {
        id: unionId,
        data: null,
        generation: gen + 0.5, // sits between parent and child generation
        spouseId: null,
        parentId: null,
        isUnion: true,
        branchIndex: branch,
        sortIndex: (parent1.sortIndex + parent2.sortIndex) / 2,
        x: existingU?.x ?? branchX + (Math.random() - 0.5) * 30,
        y: existingU?.y ?? (gen + 0.5) * 220 + 100,
      };

      unionNodes.push(unionNode);
      nodeMap.set(unionId, unionNode);
      unionToParents.set(unionId, pair);

      for (const childId of children) {
        childToUnion.set(childId, unionId);
      }
    }

    // Also handle single parents with children (no spouse pair)
    // These children connect directly to parent (no union node)
    const allNodes = [...nodes, ...unionNodes];

    // --- Build links ---
    const links: SimLink[] = [];

    // Spouse links (direct between spouses, through the pill visually)
    for (const pair of spousePairsForUnion) {
      const n1 = nodeMap.get(pair.id1);
      const n2 = nodeMap.get(pair.id2);
      if (n1 && n2) {
        links.push({ source: n1, target: n2, type: "spouse" });
      }
    }

    // Parent-to-union and union-to-child links
    for (const unionNode of unionNodes) {
      const pair = unionToParents.get(unionNode.id);
      if (!pair) continue;

      const p1 = nodeMap.get(pair.id1);
      const p2 = nodeMap.get(pair.id2);
      if (p1) links.push({ source: p1, target: unionNode, type: "parent-union" });
      if (p2) links.push({ source: p2, target: unionNode, type: "parent-union" });
    }

    // Children link to union node OR directly to parent
    for (const m of members) {
      const unionId = childToUnion.get(m.id);
      if (unionId) {
        const unionNode = nodeMap.get(unionId);
        const childNode = nodeMap.get(m.id);
        if (unionNode && childNode) {
          links.push({ source: unionNode, target: childNode, type: "union-child" });
        }
      } else {
        // No union node — direct parent-child links
        if (m.parent_id && nodeMap.has(m.parent_id)) {
          links.push({
            source: nodeMap.get(m.parent_id)!,
            target: nodeMap.get(m.id)!,
            type: "parent-child",
          });
        }
        if (m.parent2_id && nodeMap.has(m.parent2_id)) {
          links.push({
            source: nodeMap.get(m.parent2_id)!,
            target: nodeMap.get(m.id)!,
            type: "parent-child",
          });
        }
      }
    }

    nodesRef.current = allNodes;
    linksRef.current = links;

    // Stop old simulation
    if (simRef.current) simRef.current.stop();

    // --- Physics simulation ---
    const sim = forceSimulation<SimNode>(allNodes)
      .force(
        "center",
        forceCenter(containerSize.width / 2, containerSize.height / 2).strength(0.05)
      )
      // Repulsion: user's preferred value of -257
      .force(
        "charge",
        forceManyBody<SimNode>()
          .strength((d) => (d.isUnion ? -50 : -257))
          .distanceMax(800)
      )
      // Collision: large radius to account for text labels underneath nodes
      .force(
        "collide",
        forceCollide<SimNode>((d) => (d.isUnion ? 10 : 85))
          .strength(0.9)
          .iterations(2)
      )
      // Parent-to-union links (short — just connect parents to the dot)
      .force(
        "parentUnionLink",
        forceLink<SimNode, SimLink>(
          links.filter((l) => l.type === "parent-union")
        )
          .id((d) => d.id)
          .distance(40)
          .strength(1.0)
      )
      // Union-to-child links (longer — vertical breathing room)
      .force(
        "unionChildLink",
        forceLink<SimNode, SimLink>(
          links.filter((l) => l.type === "union-child")
        )
          .id((d) => d.id)
          .distance(160)
          .strength(0.5)
      )
      // Direct parent-child links (no union)
      .force(
        "directLink",
        forceLink<SimNode, SimLink>(
          links.filter((l) => l.type === "parent-child")
        )
          .id((d) => d.id)
          .distance(160)
          .strength(0.5)
      )
      // Spouse links
      .force(
        "spouseLink",
        forceLink<SimNode, SimLink>(
          links.filter((l) => l.type === "spouse")
        )
          .id((d) => d.id)
          .distance(90)
          .strength(1.5)
      )
      // Vertical stratification — pull to generation layers
      .force(
        "y",
        forceY<SimNode>()
          .y((d) => d.generation * 220 + 100)
          .strength(0.3)
      )
      // Horizontal branch segregation — each family branch in its own lane
      .force(
        "x",
        forceX<SimNode>()
          .x((d) => {
            const branchX = branchXTargets.get(d.branchIndex) ?? containerSize.width / 2;
            // Within a branch, use sortIndex to spread nodes
            const maxSort = Math.max(...allNodes.filter((n) => n.branchIndex === d.branchIndex).map((n) => n.sortIndex));
            const minSort = Math.min(...allNodes.filter((n) => n.branchIndex === d.branchIndex).map((n) => n.sortIndex));
            const range = Math.max(1, maxSort - minSort);
            const normalizedSort = (d.sortIndex - minSort) / range;
            return branchX + (normalizedSort - 0.5) * Math.min(branchWidth * 0.7, 400);
          })
          .strength(0.08)
      )
      // Spouse coupling — keep spouses at same Y and close X
      .force("spouseCoupling", (alpha: number) => {
        const visited = new Set<string>();
        for (const n of allNodes) {
          if (n.isUnion || !n.spouseId || visited.has(n.id)) continue;
          const spouse = allNodes.find((s) => s.id === n.spouseId);
          if (!spouse) continue;
          visited.add(n.id);
          visited.add(spouse.id);

          const targetDx = 90;
          const midX = ((n.x ?? 0) + (spouse.x ?? 0)) / 2;
          const midY = ((n.y ?? 0) + (spouse.y ?? 0)) / 2;
          const strength = 0.5;

          n.x = (n.x ?? 0) + (midX - targetDx / 2 - (n.x ?? 0)) * strength * alpha;
          spouse.x = (spouse.x ?? 0) + (midX + targetDx / 2 - (spouse.x ?? 0)) * strength * alpha;
          n.y = (n.y ?? 0) + (midY - (n.y ?? 0)) * strength * alpha;
          spouse.y = (spouse.y ?? 0) + (midY - (spouse.y ?? 0)) * strength * alpha;

          // Also pull union node between them
          const unionId = `union-${n.id}-${spouse.id}`;
          const unionIdAlt = `union-${spouse.id}-${n.id}`;
          const unionNode = allNodes.find((u) => u.id === unionId || u.id === unionIdAlt);
          if (unionNode) {
            unionNode.x = (unionNode.x ?? 0) + (midX - (unionNode.x ?? 0)) * 0.8 * alpha;
            unionNode.y = (unionNode.y ?? 0) + (midY + 50 - (unionNode.y ?? 0)) * 0.3 * alpha;
          }
        }
      })
      .alpha(existingPositions.size > 0 ? 0.3 : 1)
      .alphaDecay(0.018)
      .velocityDecay(0.35)
      .on("tick", () => {
        setTick((t) => t + 1);
      })
      .on("end", () => {
        setSettled(true);
      });

    simRef.current = sim;
    setSettled(false);

    return () => {
      sim.stop();
    };
  }, [members, containerSize.width, containerSize.height]);

  // Drag handlers
  const onDragStart = useCallback((nodeId: string, x: number, y: number) => {
    const sim = simRef.current;
    if (!sim) return;
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;
    dragNodeRef.current = node;
    node.fx = x;
    node.fy = y;
    sim.alphaTarget(0.3).restart();
  }, []);

  const onDrag = useCallback((x: number, y: number) => {
    const node = dragNodeRef.current;
    if (!node) return;
    node.fx = x;
    node.fy = y;
  }, []);

  const onDragEnd = useCallback(() => {
    const sim = simRef.current;
    const node = dragNodeRef.current;
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    dragNodeRef.current = null;
    if (sim) sim.alphaTarget(0);
  }, []);

  const reheat = useCallback(() => {
    const sim = simRef.current;
    if (sim) {
      sim.alpha(0.3).restart();
      setSettled(false);
    }
  }, []);

  // Compute derived data for rendering
  const allNodes = nodesRef.current;
  const personNodes = allNodes.filter((n) => !n.isUnion);

  // Spouse pairs (for rendering pills)
  const spousePairs: SpousePair[] = [];
  const spouseSeenForRender = new Set<string>();
  for (const n of personNodes) {
    if (n.spouseId && !spouseSeenForRender.has(n.id)) {
      const spouse = personNodes.find((s) => s.id === n.spouseId);
      if (spouse) {
        spouseSeenForRender.add(n.id);
        spouseSeenForRender.add(spouse.id);
        const midX = ((n.x ?? 0) + (spouse.x ?? 0)) / 2;
        const midY = ((n.y ?? 0) + (spouse.y ?? 0)) / 2;
        const dx = Math.abs((n.x ?? 0) - (spouse.x ?? 0));

        // Find corresponding union node
        const unionId = `union-${n.id}-${spouse.id}`;
        const unionIdAlt = `union-${spouse.id}-${n.id}`;
        const unionNode = allNodes.find(
          (u) => u.id === unionId || u.id === unionIdAlt
        );

        spousePairs.push({
          node1: n,
          node2: spouse,
          unionNode: unionNode ?? n, // fallback
          midX,
          midY,
          pillWidth: dx + 120,
          pillHeight: 100,
        });
      }
    }
  }

  // Build positioned links for rendering (only union-child and direct parent-child)
  const parentChildLinks: PositionedLink[] = [];
  for (const link of linksRef.current) {
    if (link.type !== "union-child" && link.type !== "parent-child") continue;
    const src = link.source as SimNode;
    const tgt = link.target as SimNode;

    parentChildLinks.push({
      sourceX: src.x ?? 0,
      sourceY: (src.y ?? 0) + (src.isUnion ? 0 : 40),
      targetX: tgt.x ?? 0,
      targetY: (tgt.y ?? 0) - 40,
      sourceGeneration: Math.floor(src.generation),
      targetGeneration: Math.floor(tgt.generation),
      fromUnion: src.isUnion,
    });
  }

  return {
    nodes: personNodes, // only real person nodes for rendering
    unionNodes: allNodes.filter((n) => n.isUnion),
    spousePairs,
    parentChildLinks,
    dragHandlers: { onDragStart, onDrag, onDragEnd },
    reheat,
    settled,
    tick,
  };
}
