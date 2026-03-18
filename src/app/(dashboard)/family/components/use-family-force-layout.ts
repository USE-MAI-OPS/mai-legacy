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
  isUnion: boolean;
  branchIndex: number;
  sortIndex: number;
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
// Helper: build children map from both parent_id and parent2_id
// ---------------------------------------------------------------------------
function buildChildrenMap(members: TreeNodeData[]): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>();
  for (const m of members) {
    if (m.parent_id) {
      const kids = childrenMap.get(m.parent_id) ?? [];
      if (!kids.includes(m.id)) kids.push(m.id);
      childrenMap.set(m.parent_id, kids);
    }
    if (m.parent2_id) {
      const kids = childrenMap.get(m.parent2_id) ?? [];
      if (!kids.includes(m.id)) kids.push(m.id);
      childrenMap.set(m.parent2_id, kids);
    }
  }
  return childrenMap;
}

// ---------------------------------------------------------------------------
// Helper: detect ALL parent pairs (spouses + co-parents)
// ---------------------------------------------------------------------------
interface ParentPair {
  id1: string;
  id2: string;
}

function detectParentPairs(
  members: TreeNodeData[],
  byId: Map<string, TreeNodeData>
): ParentPair[] {
  const pairs: ParentPair[] = [];
  const seen = new Set<string>();

  // 1. Declared spouse pairs
  for (const m of members) {
    if (m.spouse_id && byId.has(m.spouse_id)) {
      const key = [m.id, m.spouse_id].sort().join("|");
      if (!seen.has(key)) {
        pairs.push({ id1: m.id, id2: m.spouse_id });
        seen.add(key);
      }
    }
  }

  // 2. Co-parent pairs (any two who share a child via parent_id + parent2_id)
  for (const m of members) {
    if (m.parent_id && m.parent2_id && byId.has(m.parent_id) && byId.has(m.parent2_id)) {
      const key = [m.parent_id, m.parent2_id].sort().join("|");
      if (!seen.has(key)) {
        pairs.push({ id1: m.parent_id, id2: m.parent2_id });
        seen.add(key);
      }
    }
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Compute generation depth via BFS from roots
// Fixed: follows BOTH parent_id and parent2_id, syncs co-parents
// ---------------------------------------------------------------------------
function computeGenerations(
  members: TreeNodeData[],
  parentPairs: ParentPair[]
): Map<string, number> {
  const generations = new Map<string, number>();
  const childrenMap = buildChildrenMap(members);
  const byId = new Map(members.map((m) => [m.id, m]));

  // Build co-parent lookup: for any member, who are their partners?
  const partnerOf = new Map<string, Set<string>>();
  for (const pair of parentPairs) {
    if (!partnerOf.has(pair.id1)) partnerOf.set(pair.id1, new Set());
    if (!partnerOf.has(pair.id2)) partnerOf.set(pair.id2, new Set());
    partnerOf.get(pair.id1)!.add(pair.id2);
    partnerOf.get(pair.id2)!.add(pair.id1);
  }

  // Roots: members with no parent_id AND no parent2_id in the tree
  const roots = members.filter(
    (m) =>
      (!m.parent_id || !byId.has(m.parent_id)) &&
      (!m.parent2_id || !byId.has(m.parent2_id))
  );

  const queue: { id: string; gen: number }[] = [];

  for (const r of roots) {
    if (!generations.has(r.id)) {
      generations.set(r.id, 0);
      queue.push({ id: r.id, gen: 0 });

      // All partners (spouses + co-parents) get same generation
      const partners = partnerOf.get(r.id);
      if (partners) {
        for (const pid of partners) {
          if (!generations.has(pid)) {
            generations.set(pid, 0);
            queue.push({ id: pid, gen: 0 });
          }
        }
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

        // Kid's partners get same generation
        const kidPartners = partnerOf.get(kidId);
        if (kidPartners) {
          for (const pid of kidPartners) {
            if (!generations.has(pid)) {
              generations.set(pid, gen + 1);
              queue.push({ id: pid, gen: gen + 1 });
            }
          }
        }
      }
    }
  }

  // Catch any unassigned members
  for (const m of members) {
    if (!generations.has(m.id)) {
      generations.set(m.id, 0);
    }
  }

  return generations;
}

// ---------------------------------------------------------------------------
// Compute branches — each root couple = separate branch, NO merging
// Children inherit parent_id's branch. Spouses inherit their partner's branch.
// Co-parents stay in their own branches (physics handles proximity).
// ---------------------------------------------------------------------------
function computeBranches(
  members: TreeNodeData[],
  _parentPairs: ParentPair[]
): Map<string, number> {
  const byId = new Map(members.map((m) => [m.id, m]));
  const childrenMap = buildChildrenMap(members);

  const branches = new Map<string, number>();
  const roots = members.filter(
    (m) =>
      (!m.parent_id || !byId.has(m.parent_id)) &&
      (!m.parent2_id || !byId.has(m.parent2_id))
  );

  let branchIdx = 0;
  const rootAssigned = new Set<string>();

  for (const r of roots) {
    if (rootAssigned.has(r.id)) continue;
    const currentBranch = branchIdx++;
    branches.set(r.id, currentBranch);
    rootAssigned.add(r.id);

    // Declared spouse gets same branch
    if (r.spouse_id && byId.has(r.spouse_id)) {
      branches.set(r.spouse_id, currentBranch);
      rootAssigned.add(r.spouse_id);
    }

    // BFS descendants: children inherit this branch via parent_id only
    const queue = [r.id];
    if (r.spouse_id && byId.has(r.spouse_id)) queue.push(r.spouse_id);

    while (queue.length > 0) {
      const id = queue.shift()!;
      const kids = childrenMap.get(id) ?? [];
      for (const kidId of kids) {
        if (branches.has(kidId)) continue;
        const kid = byId.get(kidId);
        if (!kid) continue;

        // Only inherit branch if this parent is the kid's parent_id (primary)
        // or if the kid has no parent_id (only parent2_id points here)
        if (kid.parent_id === id || (!kid.parent_id && kid.parent2_id === id)) {
          branches.set(kidId, currentBranch);
          queue.push(kidId);
          // Kid's declared spouse inherits branch
          if (kid.spouse_id && byId.has(kid.spouse_id) && !branches.has(kid.spouse_id)) {
            branches.set(kid.spouse_id, currentBranch);
            queue.push(kid.spouse_id);
          }
        }
      }
    }
  }

  // Second pass: assign unassigned children to their parent2_id's branch
  for (const m of members) {
    if (branches.has(m.id)) continue;
    if (m.parent2_id && branches.has(m.parent2_id)) {
      branches.set(m.id, branches.get(m.parent2_id)!);
    }
  }

  // Catch any remaining unassigned
  for (const m of members) {
    if (!branches.has(m.id)) {
      branches.set(m.id, branchIdx++);
    }
  }

  return branches;
}

// ---------------------------------------------------------------------------
// Compute sort indices — co-parents get adjacent indices
// ---------------------------------------------------------------------------
function computeSortIndices(
  members: TreeNodeData[],
  branches: Map<string, number>,
  parentPairs: ParentPair[]
): Map<string, number> {
  const sortIndices = new Map<string, number>();
  const byId = new Map(members.map((m) => [m.id, m]));
  const childrenMap = buildChildrenMap(members);

  // Build partner lookup
  const partnerOf = new Map<string, Set<string>>();
  for (const pair of parentPairs) {
    if (!partnerOf.has(pair.id1)) partnerOf.set(pair.id1, new Set());
    if (!partnerOf.has(pair.id2)) partnerOf.set(pair.id2, new Set());
    partnerOf.get(pair.id1)!.add(pair.id2);
    partnerOf.get(pair.id2)!.add(pair.id1);
  }

  const roots = members
    .filter(
      (m) =>
        (!m.parent_id || !byId.has(m.parent_id)) &&
        (!m.parent2_id || !byId.has(m.parent2_id))
    )
    .sort((a, b) => (branches.get(a.id) ?? 0) - (branches.get(b.id) ?? 0));

  let idx = 0;
  const assigned = new Set<string>();

  function assignWithPartners(id: string) {
    if (assigned.has(id)) return;
    sortIndices.set(id, idx++);
    assigned.add(id);

    // Assign all partners adjacent indices
    const partners = partnerOf.get(id);
    if (partners) {
      for (const pid of partners) {
        if (!assigned.has(pid)) {
          sortIndices.set(pid, idx++);
          assigned.add(pid);
        }
      }
    }
  }

  // BFS from roots
  const queue: string[] = [];
  for (const r of roots) {
    if (!assigned.has(r.id)) {
      assignWithPartners(r.id);
      queue.push(r.id);
      const partners = partnerOf.get(r.id);
      if (partners) {
        for (const pid of partners) queue.push(pid);
      }
    }
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const kids = childrenMap.get(id) ?? [];
    for (const kidId of kids) {
      if (!assigned.has(kidId)) {
        assignWithPartners(kidId);
        queue.push(kidId);
        const partners = partnerOf.get(kidId);
        if (partners) {
          for (const pid of partners) {
            if (!assigned.has(pid)) queue.push(pid);
          }
        }
      }
    }
  }

  return sortIndices;
}

// ---------------------------------------------------------------------------
// Compute ego-centric branch ordering
// Returns a map of branchIndex → target X position
// ---------------------------------------------------------------------------
function computeEgoBranchTargets(
  members: TreeNodeData[],
  branches: Map<string, number>,
  egoMemberId: string | null,
  containerWidth: number
): Map<number, number> {
  const byId = new Map(members.map((m) => [m.id, m]));
  const totalBranches = new Set(branches.values()).size;
  const branchWidth = Math.max(350, containerWidth / Math.max(totalBranches, 1));
  const targets = new Map<number, number>();

  if (!egoMemberId || totalBranches <= 1) {
    // Default: spread evenly
    for (let b = 0; b < totalBranches; b++) {
      targets.set(b, containerWidth / 2 + (b - (totalBranches - 1) / 2) * branchWidth);
    }
    return targets;
  }

  // Find ego node
  const ego = members.find((m) => m.linked_member_id === egoMemberId);
  if (!ego) {
    for (let b = 0; b < totalBranches; b++) {
      targets.set(b, containerWidth / 2 + (b - (totalBranches - 1) / 2) * branchWidth);
    }
    return targets;
  }

  const egoBranch = branches.get(ego.id) ?? 0;

  // Find which branch a parent's root ancestor belongs to
  function findAncestorBranch(parentId: string | null): number | null {
    if (!parentId || !byId.has(parentId)) return null;
    return branches.get(parentId) ?? null;
  }

  // Ego's branch = paternal branch (inherited from parent_id)
  // Maternal branch = parent2_id's branch (separate family line)
  const maternalBranch = findAncestorBranch(ego.parent2_id ?? null);

  // Collect all unique branches
  const allBranches = [...new Set(branches.values())].sort((a, b) => a - b);

  const centerX = containerWidth / 2;

  // Ego's branch (= paternal) goes slightly left of center
  // Maternal branch goes slightly right of center
  // Other branches spread outward from there
  const leftBranches: number[] = []; // paternal side (includes ego)
  const rightBranches: number[] = []; // maternal side
  const otherBranches: number[] = [];

  for (const b of allBranches) {
    if (b === egoBranch) {
      leftBranches.unshift(b); // ego/paternal branch = first on left (closest to center)
    } else if (maternalBranch !== null && b === maternalBranch) {
      rightBranches.unshift(b); // maternal = first on right (closest to center)
    } else {
      otherBranches.push(b);
    }
  }

  // Distribute remaining branches to whichever side has fewer
  for (const b of otherBranches) {
    if (leftBranches.length <= rightBranches.length) {
      leftBranches.push(b);
    } else {
      rightBranches.push(b);
    }
  }

  // Assign X: left branches spread leftward from center, right branches rightward
  // First left branch (ego) is just left of center, first right (maternal) just right
  const halfGap = branchWidth * 0.4; // small gap between paternal and maternal

  for (let i = 0; i < leftBranches.length; i++) {
    targets.set(leftBranches[i], centerX - halfGap - i * branchWidth);
  }

  for (let i = 0; i < rightBranches.length; i++) {
    targets.set(rightBranches[i], centerX + halfGap + i * branchWidth);
  }

  return targets;
}

// ---------------------------------------------------------------------------
// Build sibling groups for clustering force
// ---------------------------------------------------------------------------
function buildSiblingGroups(members: TreeNodeData[]): Map<string, string[]> {
  // Group children by their parent pair
  const pairToChildren = new Map<string, string[]>();

  for (const m of members) {
    if (!m.parent_id) continue;
    // Use sorted pair key to group siblings by BOTH parents
    const parents = [m.parent_id, m.parent2_id].filter(Boolean).sort();
    const key = parents.join("|");
    const group = pairToChildren.get(key) ?? [];
    if (!group.includes(m.id)) group.push(m.id);
    pairToChildren.set(key, group);
  }

  // Map each member to their sibling group
  const siblingGroupOf = new Map<string, string[]>();
  for (const group of pairToChildren.values()) {
    if (group.length > 1) {
      for (const id of group) {
        siblingGroupOf.set(id, group);
      }
    }
  }

  return siblingGroupOf;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useFamilyForceLayout(
  members: TreeNodeData[],
  containerSize: { width: number; height: number },
  currentUserMemberId?: string | null
) {
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const [tick, setTick] = useState(0);
  const [settled, setSettled] = useState(false);
  const dragNodeRef = useRef<SimNode | null>(null);

  useEffect(() => {
    if (members.length === 0 || containerSize.width === 0) return;

    const byId = new Map<string, TreeNodeData>();
    for (const m of members) byId.set(m.id, m);

    // Detect all parent pairs (spouses + co-parents)
    const parentPairs = detectParentPairs(members, byId);

    // Compute layout data with fixed algorithms
    const generations = computeGenerations(members, parentPairs);
    const branches = computeBranches(members, parentPairs);
    const sortIndices = computeSortIndices(members, branches, parentPairs);
    const siblingGroups = buildSiblingGroups(members);

    // Ego-centric branch positioning
    const branchXTargets = computeEgoBranchTargets(
      members,
      branches,
      currentUserMemberId ?? null,
      containerSize.width
    );

    const totalBranches = new Set(branches.values()).size;
    const branchWidth = Math.max(350, containerSize.width / Math.max(totalBranches, 1));

    // Preserve existing positions for smooth updates
    const existingPositions = new Map<string, { x: number; y: number }>();
    for (const n of nodesRef.current) {
      if (n.x !== undefined && n.y !== undefined) {
        existingPositions.set(n.id, { x: n.x, y: n.y });
      }
    }

    // Build partner lookup for coupling force
    const partnerOf = new Map<string, Set<string>>();
    for (const pair of parentPairs) {
      if (!partnerOf.has(pair.id1)) partnerOf.set(pair.id1, new Set());
      if (!partnerOf.has(pair.id2)) partnerOf.set(pair.id2, new Set());
      partnerOf.get(pair.id1)!.add(pair.id2);
      partnerOf.get(pair.id2)!.add(pair.id1);
    }

    // --- Create person nodes with smart initial positions ---
    const nodes: SimNode[] = members.map((m) => {
      const gen = generations.get(m.id) ?? 0;
      const branch = branches.get(m.id) ?? 0;
      const sortIdx = sortIndices.get(m.id) ?? 0;
      const existing = existingPositions.get(m.id);
      const branchX = branchXTargets.get(branch) ?? containerSize.width / 2;

      // Smart initial position: place at branch target + slight spread
      const sortMax = Math.max(
        ...members.filter((n) => (branches.get(n.id) ?? 0) === branch).map((n) => sortIndices.get(n.id) ?? 0),
        1
      );
      const sortMin = Math.min(
        ...members.filter((n) => (branches.get(n.id) ?? 0) === branch).map((n) => sortIndices.get(n.id) ?? 0),
        0
      );
      const sortRange = Math.max(1, sortMax - sortMin);
      const normalizedSort = (sortIdx - sortMin) / sortRange;
      const spreadX = branchX + (normalizedSort - 0.5) * Math.min(branchWidth * 0.6, 350);

      return {
        id: m.id,
        data: m,
        generation: gen,
        spouseId: m.spouse_id,
        parentId: m.parent_id,
        isUnion: false,
        branchIndex: branch,
        sortIndex: sortIdx,
        x: existing?.x ?? spreadX + (Math.random() - 0.5) * 20,
        y: existing?.y ?? gen * 200 + 100 + (Math.random() - 0.5) * 10,
      };
    });

    const nodeMap = new Map<string, SimNode>();
    for (const n of nodes) nodeMap.set(n.id, n);

    // --- Create union nodes for each parent pair with children ---
    const unionNodes: SimNode[] = [];
    const childToUnion = new Map<string, string>();
    const unionToParents = new Map<string, ParentPair>();

    for (const pair of parentPairs) {
      // Find shared children
      const children: string[] = [];
      for (const m of members) {
        const hasP1 = m.parent_id === pair.id1 || m.parent2_id === pair.id1;
        const hasP2 = m.parent_id === pair.id2 || m.parent2_id === pair.id2;
        if ((hasP1 || hasP2) && m.id !== pair.id1 && m.id !== pair.id2) {
          if (!children.includes(m.id)) children.push(m.id);
        }
      }

      if (children.length === 0) continue;

      const p1 = nodeMap.get(pair.id1);
      const p2 = nodeMap.get(pair.id2);
      if (!p1 || !p2) continue;

      const unionId = `union-${[pair.id1, pair.id2].sort().join("-")}`;
      const gen = p1.generation;
      const branch = p1.branchIndex;
      const branchX = branchXTargets.get(branch) ?? containerSize.width / 2;
      const existingU = existingPositions.get(unionId);

      const unionNode: SimNode = {
        id: unionId,
        data: null,
        generation: gen + 0.5,
        spouseId: null,
        parentId: null,
        isUnion: true,
        branchIndex: branch,
        sortIndex: (p1.sortIndex + p2.sortIndex) / 2,
        x: existingU?.x ?? ((p1.x ?? branchX) + (p2.x ?? branchX)) / 2,
        y: existingU?.y ?? (gen + 0.5) * 200 + 100,
      };

      unionNodes.push(unionNode);
      nodeMap.set(unionId, unionNode);
      unionToParents.set(unionId, pair);

      for (const childId of children) {
        childToUnion.set(childId, unionId);
      }
    }

    const allNodes = [...nodes, ...unionNodes];

    // --- Build links ---
    const links: SimLink[] = [];

    // Spouse / co-parent links
    for (const pair of parentPairs) {
      const n1 = nodeMap.get(pair.id1);
      const n2 = nodeMap.get(pair.id2);
      if (n1 && n2) {
        links.push({ source: n1, target: n2, type: "spouse" });
      }
    }

    // Parent-to-union links
    for (const unionNode of unionNodes) {
      const pair = unionToParents.get(unionNode.id);
      if (!pair) continue;
      const p1 = nodeMap.get(pair.id1);
      const p2 = nodeMap.get(pair.id2);
      if (p1) links.push({ source: p1, target: unionNode, type: "parent-union" });
      if (p2) links.push({ source: p2, target: unionNode, type: "parent-union" });
    }

    // Children → union node OR direct parent links
    for (const m of members) {
      const unionId = childToUnion.get(m.id);
      if (unionId) {
        const unionNode = nodeMap.get(unionId);
        const childNode = nodeMap.get(m.id);
        if (unionNode && childNode) {
          links.push({ source: unionNode, target: childNode, type: "union-child" });
        }
      } else {
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

    // --- Precompute branch sort ranges for X force ---
    const branchSortRanges = new Map<number, { min: number; max: number }>();
    for (const n of allNodes) {
      const existing = branchSortRanges.get(n.branchIndex);
      if (!existing) {
        branchSortRanges.set(n.branchIndex, { min: n.sortIndex, max: n.sortIndex });
      } else {
        existing.min = Math.min(existing.min, n.sortIndex);
        existing.max = Math.max(existing.max, n.sortIndex);
      }
    }

    // --- Physics simulation ---
    const sim = forceSimulation<SimNode>(allNodes)
      .force(
        "center",
        forceCenter(containerSize.width / 2, containerSize.height / 2).strength(0.03)
      )
      .force(
        "charge",
        forceManyBody<SimNode>()
          .strength((d) => {
            if (d.isUnion) return -30;
            // Reduce repulsion within sibling groups
            return -220;
          })
          .distanceMax(600)
      )
      .force(
        "collide",
        forceCollide<SimNode>((d) => (d.isUnion ? 8 : 75))
          .strength(0.85)
          .iterations(2)
      )
      .force(
        "parentUnionLink",
        forceLink<SimNode, SimLink>(links.filter((l) => l.type === "parent-union"))
          .id((d) => d.id)
          .distance(35)
          .strength(1.2)
      )
      .force(
        "unionChildLink",
        forceLink<SimNode, SimLink>(links.filter((l) => l.type === "union-child"))
          .id((d) => d.id)
          .distance(140)
          .strength(0.6)
      )
      .force(
        "directLink",
        forceLink<SimNode, SimLink>(links.filter((l) => l.type === "parent-child"))
          .id((d) => d.id)
          .distance(140)
          .strength(0.6)
      )
      .force(
        "spouseLink",
        forceLink<SimNode, SimLink>(links.filter((l) => l.type === "spouse"))
          .id((d) => d.id)
          .distance(85)
          .strength(1.5)
      )
      // Vertical: pull to generation layers
      .force(
        "y",
        forceY<SimNode>()
          .y((d) => d.generation * 200 + 100)
          .strength(0.35)
      )
      // Horizontal: pull toward branch target with sort-based spread
      .force(
        "x",
        forceX<SimNode>()
          .x((d) => {
            const branchX = branchXTargets.get(d.branchIndex) ?? containerSize.width / 2;
            const range = branchSortRanges.get(d.branchIndex);
            if (!range || range.max === range.min) return branchX;
            const normalized = (d.sortIndex - range.min) / (range.max - range.min);
            return branchX + (normalized - 0.5) * Math.min(branchWidth * 0.6, 350);
          })
          .strength(0.1)
      )
      // Couple coupling: keep ALL partner pairs aligned (spouses AND co-parents)
      .force("coupleCoupling", (alpha: number) => {
        const visited = new Set<string>();
        for (const n of allNodes) {
          if (n.isUnion || visited.has(n.id)) continue;
          const partners = partnerOf.get(n.id);
          if (!partners) continue;

          for (const partnerId of partners) {
            const pairKey = [n.id, partnerId].sort().join("|");
            if (visited.has(pairKey)) continue;
            visited.add(pairKey);

            const partner = allNodes.find((s) => s.id === partnerId);
            if (!partner) continue;

            const targetDx = 85;
            const midX = ((n.x ?? 0) + (partner.x ?? 0)) / 2;
            const midY = ((n.y ?? 0) + (partner.y ?? 0)) / 2;
            const strength = 0.5;

            n.x = (n.x ?? 0) + (midX - targetDx / 2 - (n.x ?? 0)) * strength * alpha;
            partner.x = (partner.x ?? 0) + (midX + targetDx / 2 - (partner.x ?? 0)) * strength * alpha;
            n.y = (n.y ?? 0) + (midY - (n.y ?? 0)) * strength * alpha;
            partner.y = (partner.y ?? 0) + (midY - (partner.y ?? 0)) * strength * alpha;

            // Pull union node between them
            const unionId = `union-${[n.id, partnerId].sort().join("-")}`;
            const unionNode = allNodes.find((u) => u.id === unionId);
            if (unionNode) {
              unionNode.x = (unionNode.x ?? 0) + (midX - (unionNode.x ?? 0)) * 0.8 * alpha;
              unionNode.y = (unionNode.y ?? 0) + (midY + 45 - (unionNode.y ?? 0)) * 0.4 * alpha;
            }
          }
        }
      })
      // Sibling clustering: pull siblings closer together
      .force("siblingCluster", (alpha: number) => {
        for (const n of allNodes) {
          if (n.isUnion) continue;
          const siblings = siblingGroups.get(n.id);
          if (!siblings || siblings.length < 2) continue;

          // Compute sibling group center
          let cx = 0;
          let cy = 0;
          let count = 0;
          for (const sibId of siblings) {
            const sib = allNodes.find((s) => s.id === sibId);
            if (sib) {
              cx += sib.x ?? 0;
              cy += sib.y ?? 0;
              count++;
            }
          }
          if (count === 0) continue;
          cx /= count;
          cy /= count;

          // Pull toward sibling center (gentle)
          const strength = 0.15;
          n.x = (n.x ?? 0) + (cx - (n.x ?? 0)) * strength * alpha;
          n.y = (n.y ?? 0) + (cy - (n.y ?? 0)) * strength * alpha * 0.3; // less vertical pull
        }
      })
      // Quick settle: higher alpha decay, start at lower alpha with good initial positions
      .alpha(existingPositions.size > 0 ? 0.2 : 0.6)
      .alphaDecay(0.04)
      .velocityDecay(0.4)
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
  }, [members, containerSize.width, containerSize.height, currentUserMemberId]);

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

  // Spouse/co-parent pairs for rendering dashed lines
  const spousePairs: SpousePair[] = [];
  const pairSeenForRender = new Set<string>();
  for (const n of personNodes) {
    // Check all partners (spouses + co-parents)
    const partners = new Set<string>();
    if (n.spouseId) partners.add(n.spouseId);
    // Also check if this node is in any parent pair
    for (const u of allNodes) {
      if (!u.isUnion) continue;
      const unionId = u.id;
      // Extract parent IDs from union ID
      const match = unionId.match(/^union-(.+)-(.+)$/);
      if (match) {
        const [, p1, p2] = match;
        if (p1 === n.id) partners.add(p2);
        if (p2 === n.id) partners.add(p1);
      }
    }

    for (const partnerId of partners) {
      const pairKey = [n.id, partnerId].sort().join("|");
      if (pairSeenForRender.has(pairKey)) continue;
      pairSeenForRender.add(pairKey);

      const partner = personNodes.find((s) => s.id === partnerId);
      if (!partner) continue;

      const midX = ((n.x ?? 0) + (partner.x ?? 0)) / 2;
      const midY = ((n.y ?? 0) + (partner.y ?? 0)) / 2;
      const dx = Math.abs((n.x ?? 0) - (partner.x ?? 0));

      const unionId = `union-${[n.id, partnerId].sort().join("-")}`;
      const unionNode = allNodes.find((u) => u.id === unionId);

      spousePairs.push({
        node1: n,
        node2: partner,
        unionNode: unionNode ?? n,
        midX,
        midY,
        pillWidth: dx + 120,
        pillHeight: 100,
      });
    }
  }

  // Parent-child links for rendering
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
    nodes: personNodes,
    unionNodes: allNodes.filter((n) => n.isUnion),
    spousePairs,
    parentChildLinks,
    dragHandlers: { onDragStart, onDrag, onDragEnd },
    reheat,
    settled,
    tick,
  };
}
