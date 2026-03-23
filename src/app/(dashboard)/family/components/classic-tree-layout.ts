// ============================================================================
// Classic Tree Layout — deterministic hierarchical positioning
// Pure function: TreeNodeData[] → positioned nodes + links
// ============================================================================

import type { TreeNodeData } from "./family-tree-node";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  generation: number;
}

export interface LayoutLink {
  sourceId: string;
  targetId: string;
  type: "parent-child" | "spouse";
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const NODE_W = 140; // width of a single node slot
const H_GAP = 40; // horizontal gap between sibling slots
const GEN_H = 200; // vertical distance between generations
const COUPLE_GAP = 10; // gap between spouses within a couple unit
const PAD_TOP = 60;
const PAD_LEFT = 60;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** All ids present in the data set */
function idSet(members: TreeNodeData[]): Set<string> {
  return new Set(members.map((m) => m.id));
}

/**
 * For a given child, return the "couple key" — a canonical string
 * representing the parent pair so we can group siblings by couple.
 * e.g. parentA + parentB → "idA|idB" (sorted so order doesn't matter)
 */
function coupleKey(parentId: string | null | undefined, parent2Id: string | null | undefined): string {
  const a = parentId ?? "";
  const b = parent2Id ?? "";
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// ---------------------------------------------------------------------------
// Main layout function
// ---------------------------------------------------------------------------
export function computeClassicTreeLayout(
  members: TreeNodeData[]
): { nodes: LayoutNode[]; links: LayoutLink[]; width: number; height: number } {
  if (members.length === 0) {
    return { nodes: [], links: [], width: 0, height: 0 };
  }

  const ids = idSet(members);
  const byId = new Map(members.map((m) => [m.id, m]));

  // ── Step 1: Assign generations via BFS ────────────────────────────────
  const generation = new Map<string, number>();
  const childrenOf = new Map<string, string[]>(); // parentId → child ids

  for (const m of members) {
    if (m.parent_id && ids.has(m.parent_id)) {
      const existing = childrenOf.get(m.parent_id) ?? [];
      existing.push(m.id);
      childrenOf.set(m.parent_id, existing);
    }
    if (m.parent2_id && ids.has(m.parent2_id)) {
      const existing = childrenOf.get(m.parent2_id) ?? [];
      existing.push(m.id);
      childrenOf.set(m.parent2_id, existing);
    }
  }

  // Find root nodes: no parent in dataset
  const roots: string[] = [];
  for (const m of members) {
    const hasP1 = m.parent_id && ids.has(m.parent_id);
    const hasP2 = m.parent2_id && ids.has(m.parent2_id);
    if (!hasP1 && !hasP2) {
      roots.push(m.id);
    }
  }

  // BFS to assign generations
  const queue: string[] = [...roots];
  for (const r of roots) generation.set(r, 0);

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const gen = generation.get(cur)!;
    const children = childrenOf.get(cur) ?? [];
    for (const cid of children) {
      const existing = generation.get(cid);
      if (existing === undefined || gen + 1 > existing) {
        generation.set(cid, gen + 1);
        queue.push(cid);
      }
    }
  }

  // Spouse alignment: if a spouse is in a different gen, pull them to the same gen
  for (const m of members) {
    if (m.spouse_id && ids.has(m.spouse_id)) {
      const gA = generation.get(m.id);
      const gB = generation.get(m.spouse_id);
      if (gA !== undefined && gB !== undefined && gA !== gB) {
        // Pull to the higher (deeper) gen of the two
        const maxGen = Math.max(gA, gB);
        generation.set(m.id, maxGen);
        generation.set(m.spouse_id, maxGen);
      }
    }
  }

  // Orphans: nodes with no generation assigned yet
  const orphans: string[] = [];
  let maxGen = 0;
  for (const m of members) {
    const g = generation.get(m.id);
    if (g === undefined) {
      orphans.push(m.id);
    } else if (g > maxGen) {
      maxGen = g;
    }
  }
  const orphanGen = orphans.length > 0 ? maxGen + 1 : maxGen;
  for (const oid of orphans) generation.set(oid, orphanGen);

  // ── Step 2: Group members by generation ───────────────────────────────
  const genGroups = new Map<number, string[]>();
  for (const m of members) {
    const g = generation.get(m.id)!;
    const arr = genGroups.get(g) ?? [];
    arr.push(m.id);
    genGroups.set(g, arr);
  }

  // ── Step 3: Build couple units + child groups ─────────────────────────
  // A "slot" is either a single person or a couple (2 people side by side).
  // Children are grouped by their couple-key (parent pair).

  interface Slot {
    ids: string[]; // 1 or 2 person ids
    childSlots: Slot[]; // recursive child slots
    width: number; // computed bottom-up
  }

  // Deduplicate children lists per parent
  const uniqueChildrenOf = new Map<string, Set<string>>();
  for (const m of members) {
    if (m.parent_id && ids.has(m.parent_id)) {
      if (!uniqueChildrenOf.has(m.parent_id)) uniqueChildrenOf.set(m.parent_id, new Set());
      uniqueChildrenOf.get(m.parent_id)!.add(m.id);
    }
    if (m.parent2_id && ids.has(m.parent2_id)) {
      if (!uniqueChildrenOf.has(m.parent2_id)) uniqueChildrenOf.set(m.parent2_id, new Set());
      uniqueChildrenOf.get(m.parent2_id)!.add(m.id);
    }
  }

  // Build slots per generation (top-down)
  const totalGens = (orphans.length > 0 ? orphanGen : maxGen) + 1;
  const genSlots: Slot[][] = [];
  const placed = new Set<string>();

  function buildSlot(personIds: string[]): Slot {
    for (const pid of personIds) placed.add(pid);

    // Gather all children of anyone in this slot
    const allChildren = new Set<string>();
    for (const pid of personIds) {
      const kids = uniqueChildrenOf.get(pid);
      if (kids) for (const k of kids) allChildren.add(k);
    }

    // Group children by their couple key (who are their TWO parents)
    // so half-siblings are properly separated
    const childByCoupleKey = new Map<string, string[]>();
    for (const cid of allChildren) {
      const child = byId.get(cid)!;
      const ck = coupleKey(child.parent_id, child.parent2_id);
      const arr = childByCoupleKey.get(ck) ?? [];
      arr.push(cid);
      childByCoupleKey.set(ck, arr);
    }

    // For each group of children, build child slots
    // (each child becomes its own slot, possibly paired with their spouse)
    const childSlots: Slot[] = [];
    for (const [, kids] of childByCoupleKey) {
      for (const kid of kids) {
        if (placed.has(kid)) continue;
        const m = byId.get(kid)!;
        // Pair with spouse if they exist and aren't placed yet
        if (m.spouse_id && ids.has(m.spouse_id) && !placed.has(m.spouse_id)) {
          childSlots.push(buildSlot([kid, m.spouse_id]));
        } else {
          childSlots.push(buildSlot([kid]));
        }
      }
    }

    // Width = max(own width, sum of children widths)
    const ownWidth = personIds.length === 2 ? NODE_W * 2 + COUPLE_GAP : NODE_W;
    const childrenWidth =
      childSlots.length > 0
        ? childSlots.reduce((sum, s) => sum + s.width, 0) +
          (childSlots.length - 1) * H_GAP
        : 0;

    return {
      ids: personIds,
      childSlots,
      width: Math.max(ownWidth, childrenWidth),
    };
  }

  // Process each generation starting from gen 0
  for (let g = 0; g < totalGens; g++) {
    const nodesInGen = genGroups.get(g) ?? [];
    const slots: Slot[] = [];

    for (const nid of nodesInGen) {
      if (placed.has(nid)) continue;
      const m = byId.get(nid)!;
      // Try to pair with spouse
      if (m.spouse_id && ids.has(m.spouse_id) && !placed.has(m.spouse_id)) {
        const spouseGen = generation.get(m.spouse_id);
        if (spouseGen === g) {
          slots.push(buildSlot([nid, m.spouse_id]));
          continue;
        }
      }
      slots.push(buildSlot([nid]));
    }
    genSlots.push(slots);
  }

  // ── Step 4: Assign x positions (top-down, centered) ──────────────────
  const positions = new Map<string, { x: number; y: number }>();

  function assignPositions(slots: Slot[], startX: number, gen: number) {
    let curX = startX;
    const y = PAD_TOP + gen * GEN_H;

    for (const slot of slots) {
      const slotCenter = curX + slot.width / 2;

      if (slot.ids.length === 2) {
        // Couple: place side-by-side centered in slot
        const coupleWidth = NODE_W * 2 + COUPLE_GAP;
        const coupleStart = slotCenter - coupleWidth / 2;
        positions.set(slot.ids[0], { x: coupleStart + NODE_W / 2, y });
        positions.set(slot.ids[1], { x: coupleStart + NODE_W + COUPLE_GAP + NODE_W / 2, y });
      } else {
        // Single: centered in slot
        positions.set(slot.ids[0], { x: slotCenter, y });
      }

      // Recursively position children
      if (slot.childSlots.length > 0) {
        const childrenTotalWidth =
          slot.childSlots.reduce((s, cs) => s + cs.width, 0) +
          (slot.childSlots.length - 1) * H_GAP;
        const childStartX = slotCenter - childrenTotalWidth / 2;
        assignPositions(slot.childSlots, childStartX, gen + 1);
      }

      curX += slot.width + H_GAP;
    }
  }

  // Position all top-level slots across all generations
  // The root generation slots determine the top-level layout
  // Other generations' unplaced nodes are handled by the recursive buildSlot
  let totalRootWidth = 0;
  for (const slots of genSlots) {
    const w = slots.reduce((s, sl) => s + sl.width, 0) + Math.max(0, slots.length - 1) * H_GAP;
    if (w > totalRootWidth) totalRootWidth = w;
  }

  // Position each generation's top-level slots
  for (let g = 0; g < genSlots.length; g++) {
    const slots = genSlots[g];
    // Filter to only slots with unpositioned members
    const unpositioned = slots.filter((s) => s.ids.some((id) => !positions.has(id)));
    if (unpositioned.length === 0) continue;

    const w = unpositioned.reduce((s, sl) => s + sl.width, 0) + Math.max(0, unpositioned.length - 1) * H_GAP;
    const startX = PAD_LEFT + (totalRootWidth - w) / 2;
    assignPositions(unpositioned, startX, g);
  }

  // ── Step 5: Build output ──────────────────────────────────────────────
  const layoutNodes: LayoutNode[] = [];
  const layoutLinks: LayoutLink[] = [];

  for (const m of members) {
    const pos = positions.get(m.id);
    if (pos) {
      layoutNodes.push({ id: m.id, x: pos.x, y: pos.y, generation: generation.get(m.id) ?? 0 });
    }
  }

  // Parent-child links
  for (const m of members) {
    if (m.parent_id && ids.has(m.parent_id)) {
      layoutLinks.push({ sourceId: m.parent_id, targetId: m.id, type: "parent-child" });
    }
    if (m.parent2_id && ids.has(m.parent2_id)) {
      layoutLinks.push({ sourceId: m.parent2_id, targetId: m.id, type: "parent-child" });
    }
  }

  // Spouse links (deduplicated)
  const spouseSeen = new Set<string>();
  for (const m of members) {
    if (m.spouse_id && ids.has(m.spouse_id)) {
      const key = m.id < m.spouse_id ? `${m.id}|${m.spouse_id}` : `${m.spouse_id}|${m.id}`;
      if (!spouseSeen.has(key)) {
        spouseSeen.add(key);
        layoutLinks.push({ sourceId: m.id, targetId: m.spouse_id, type: "spouse" });
      }
    }
  }

  // Compute canvas size
  let maxX = 0, maxY = 0;
  for (const n of layoutNodes) {
    if (n.x + NODE_W / 2 > maxX) maxX = n.x + NODE_W / 2;
    if (n.y + 120 > maxY) maxY = n.y + 120; // approx node height
  }

  return {
    nodes: layoutNodes,
    links: layoutLinks,
    width: maxX + PAD_LEFT,
    height: maxY + PAD_TOP,
  };
}
