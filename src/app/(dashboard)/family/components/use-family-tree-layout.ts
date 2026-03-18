"use client";

import { useMemo } from "react";
import type { TreeNodeData } from "./family-tree-node";

// ─── Layout constants ──────────────────────────────────────
const NODE_W = 130;
const COUPLE_GAP = 30;
const CHILD_GAP = 50;
const BRANCH_GAP = 100;
const GEN_H = 200;

// ─── Output types ──────────────────────────────────────────
export interface LayoutNode {
  id: string;
  data: TreeNodeData;
  x: number;
  y: number;
  generation: number;
}

export interface SpouseLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ChildConnector {
  coupleX: number;
  coupleY: number;
  childPositions: { x: number; y: number }[];
}

export interface LayoutBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// ─── Internal tree structure ───────────────────────────────
interface FamilyUnit {
  member1: TreeNodeData;
  member2: TreeNodeData | null;
  childUnits: FamilyUnit[];
  generation: number;
  coupleWidth: number;
  subtreeWidth: number;
  x: number;
}

// ─── Hook ──────────────────────────────────────────────────
export function useFamilyTreeLayout(
  members: TreeNodeData[],
  currentUserMemberId: string | null
) {
  return useMemo(
    () => computeLayout(members, currentUserMemberId),
    [members, currentUserMemberId]
  );
}

// ─── Main layout computation ───────────────────────────────
function computeLayout(
  members: TreeNodeData[],
  egoMemberId: string | null
) {
  if (members.length === 0) {
    return {
      nodes: [] as LayoutNode[],
      spouseLines: [] as SpouseLine[],
      childConnectors: [] as ChildConnector[],
      bounds: null as LayoutBounds | null,
    };
  }

  const byId = new Map(members.map((m) => [m.id, m]));

  // Build parent → children map
  const childrenOf = new Map<string, Set<string>>();
  for (const m of members) {
    for (const pid of [m.parent_id, m.parent2_id]) {
      if (pid && byId.has(pid)) {
        if (!childrenOf.has(pid)) childrenOf.set(pid, new Set());
        childrenOf.get(pid)!.add(m.id);
      }
    }
  }

  function getCoupleChildIds(id1: string, id2: string | null): string[] {
    const combined = new Set<string>();
    const s1 = childrenOf.get(id1);
    if (s1) s1.forEach((id) => combined.add(id));
    if (id2) {
      const s2 = childrenOf.get(id2);
      if (s2) s2.forEach((id) => combined.add(id));
    }
    return [...combined];
  }

  // Track placed members
  const placed = new Set<string>();

  // Build a family unit recursively
  function buildUnit(member: TreeNodeData, gen: number): FamilyUnit {
    placed.add(member.id);

    const spouse =
      member.spouse_id &&
      byId.has(member.spouse_id) &&
      !placed.has(member.spouse_id)
        ? byId.get(member.spouse_id)!
        : null;
    if (spouse) placed.add(spouse.id);

    const childIds = getCoupleChildIds(
      member.id,
      spouse?.id ?? null
    ).filter((id) => !placed.has(id));

    const childUnits: FamilyUnit[] = [];
    for (const childId of childIds) {
      const child = byId.get(childId);
      if (!child || placed.has(child.id)) continue;
      childUnits.push(buildUnit(child, gen + 1));
    }

    const coupleWidth = spouse ? NODE_W * 2 + COUPLE_GAP : NODE_W;

    return {
      member1: member,
      member2: spouse,
      childUnits,
      generation: gen,
      coupleWidth,
      subtreeWidth: 0,
      x: 0,
    };
  }

  // ─── Find roots and build tree ───────────────────────────
  const roots = members.filter(
    (m) =>
      (!m.parent_id || !byId.has(m.parent_id)) &&
      (!m.parent2_id || !byId.has(m.parent2_id))
  );

  const rootUnits: FamilyUnit[] = [];
  for (const root of roots) {
    if (placed.has(root.id)) continue;
    rootUnits.push(buildUnit(root, 0));
  }

  // Pick up remaining unplaced
  for (const m of members) {
    if (!placed.has(m.id)) {
      rootUnits.push(buildUnit(m, 0));
    }
  }

  // Order roots: ego's paternal side left, maternal side right
  orderRootUnits(rootUnits, egoMemberId, members, byId);

  // ─── Compute subtree widths (bottom-up) ──────────────────
  function computeWidth(unit: FamilyUnit): number {
    if (unit.childUnits.length === 0) {
      unit.subtreeWidth = unit.coupleWidth;
      return unit.subtreeWidth;
    }

    let childrenTotalWidth = 0;
    for (let i = 0; i < unit.childUnits.length; i++) {
      childrenTotalWidth += computeWidth(unit.childUnits[i]);
      if (i < unit.childUnits.length - 1) childrenTotalWidth += CHILD_GAP;
    }

    unit.subtreeWidth = Math.max(unit.coupleWidth, childrenTotalWidth);
    return unit.subtreeWidth;
  }

  for (const unit of rootUnits) computeWidth(unit);

  // ─── Assign X positions (top-down) ───────────────────────
  function assignX(unit: FamilyUnit, centerX: number) {
    unit.x = centerX;
    if (unit.childUnits.length === 0) return;

    const totalChildWidth =
      unit.childUnits.reduce((sum, c) => sum + c.subtreeWidth, 0) +
      (unit.childUnits.length - 1) * CHILD_GAP;

    let currentX = centerX - totalChildWidth / 2;

    for (const child of unit.childUnits) {
      const childCenter = currentX + child.subtreeWidth / 2;
      assignX(child, childCenter);
      currentX += child.subtreeWidth + CHILD_GAP;
    }
  }

  const totalRootWidth =
    rootUnits.reduce((sum, u) => sum + u.subtreeWidth, 0) +
    Math.max(0, rootUnits.length - 1) * BRANCH_GAP;

  let rootX = -totalRootWidth / 2;
  for (const unit of rootUnits) {
    assignX(unit, rootX + unit.subtreeWidth / 2);
    rootX += unit.subtreeWidth + BRANCH_GAP;
  }

  // ─── Extract layout data ─────────────────────────────────
  const nodes: LayoutNode[] = [];
  const spouseLines: SpouseLine[] = [];
  const childConnectors: ChildConnector[] = [];

  function extract(unit: FamilyUnit) {
    const y = unit.generation * GEN_H;
    const halfSpan = NODE_W / 2 + COUPLE_GAP / 2;

    if (unit.member2) {
      const m1x = unit.x - halfSpan;
      const m2x = unit.x + halfSpan;

      nodes.push({
        id: unit.member1.id,
        data: unit.member1,
        x: m1x,
        y,
        generation: unit.generation,
      });
      nodes.push({
        id: unit.member2.id,
        data: unit.member2,
        x: m2x,
        y,
        generation: unit.generation,
      });

      spouseLines.push({ x1: m1x, y1: y, x2: m2x, y2: y });
    } else {
      nodes.push({
        id: unit.member1.id,
        data: unit.member1,
        x: unit.x,
        y,
        generation: unit.generation,
      });
    }

    if (unit.childUnits.length > 0) {
      const childPositions = unit.childUnits.map((cu) => ({
        x: cu.x,
        y: cu.generation * GEN_H,
      }));

      childConnectors.push({
        coupleX: unit.x,
        coupleY: y,
        childPositions,
      });
    }

    for (const cu of unit.childUnits) extract(cu);
  }

  for (const unit of rootUnits) extract(unit);

  // ─── Bounds ──────────────────────────────────────────────
  if (nodes.length === 0) {
    return { nodes, spouseLines, childConnectors, bounds: null };
  }

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

  return {
    nodes,
    spouseLines,
    childConnectors,
    bounds: {
      minX: minX - NODE_W,
      maxX: maxX + NODE_W,
      minY: minY - 60,
      maxY: maxY + 120,
    },
  };
}

// ─── Order root units: ego's family first ──────────────────
function orderRootUnits(
  rootUnits: FamilyUnit[],
  egoMemberId: string | null,
  members: TreeNodeData[],
  byId: Map<string, TreeNodeData>
) {
  if (!egoMemberId || rootUnits.length <= 1) return;

  const ego = members.find((m) => m.linked_member_id === egoMemberId);
  if (!ego) return;

  function findRootId(memberId: string): string | null {
    let current = memberId;
    const visited = new Set<string>();
    while (true) {
      if (visited.has(current)) return current;
      visited.add(current);
      const m = byId.get(current);
      if (!m) return current;
      if (m.parent_id && byId.has(m.parent_id)) {
        current = m.parent_id;
      } else {
        return current;
      }
    }
  }

  const paternalRootId = ego.parent_id ? findRootId(ego.parent_id) : null;
  const maternalRootId = ego.parent2_id ? findRootId(ego.parent2_id) : null;

  function unitContains(unit: FamilyUnit, memberId: string): boolean {
    return unit.member1.id === memberId || unit.member2?.id === memberId;
  }

  rootUnits.sort((a, b) => {
    const aPaternal = paternalRootId && unitContains(a, paternalRootId);
    const bPaternal = paternalRootId && unitContains(b, paternalRootId);
    const aMaternal = maternalRootId && unitContains(a, maternalRootId);
    const bMaternal = maternalRootId && unitContains(b, maternalRootId);

    if (aPaternal && !bPaternal) return -1;
    if (!aPaternal && bPaternal) return 1;
    if (aMaternal && !bMaternal) return -1;
    if (!aMaternal && bMaternal) return 1;
    return 0;
  });
}
