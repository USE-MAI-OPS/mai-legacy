// MAI Tree — filter matching + target layout planner.
// Ported from handoff/MAITree.jsx :75-346 with the data shape swapped to
// the TS `Person` + `TreeFilterSpec` types.

import type {
  Person,
  TreeFilterSpec,
  TreeSplitSpec,
  TreeGroupType,
} from "./mai-tree-types";

// ---------------------------------------------------------------------------
// matchFilter — does a person satisfy one filter spec?
// ---------------------------------------------------------------------------
export function matchFilter(person: Person, f: TreeFilterSpec | null | undefined): boolean {
  if (!f) return true;
  if (f.groups?.length && !f.groups.includes(person.group as TreeGroupType)) return false;
  if (f.side && person.side !== f.side) return false;
  if (f.tags?.length && !f.tags.some((t) => person.tags.includes(t))) return false;
  if (f.minAge != null && (person.age == null || person.age < f.minAge)) return false;
  if (f.maxAge != null && (person.age == null || person.age > f.maxAge)) return false;
  if (f.location && !(person.location ?? "").toLowerCase().includes(f.location.toLowerCase())) return false;
  if (f.q) {
    const hay = `${person.name} ${person.occupation ?? ""} ${person.location ?? ""} ${person.tags.join(" ")} ${person.relationship ?? ""}`.toLowerCase();
    if (!hay.includes(f.q.toLowerCase())) return false;
  }
  return true;
}

export function matchStackedFilters(person: Person, filters: TreeFilterSpec[]): boolean {
  if (!filters.length) return true;
  return filters.every((f) => matchFilter(person, f));
}

// ---------------------------------------------------------------------------
// planLayout — given current size + active filters + split, return:
//   - matches[id]          : which people are "in"
//   - splitTargets[id]     : per-person target point (split mode)
//   - clusterCenters[group]: per-group target point (non-split)
// ---------------------------------------------------------------------------

export interface LayoutInput {
  people: Person[];
  size: { w: number; h: number };
  activeFilters: TreeFilterSpec[];
  splitFilters: TreeSplitSpec | null;
  mode: "bloom" | "orbit" | "drift";
  splitDistance?: number; // % of canvas width each cluster pushes out (default 28)
}

export interface LayoutOutput {
  matches: Record<string, boolean>;
  splitTargets: Record<string, { x: number; y: number }> | null;
  clusterCenters: Record<string, { x: number; y: number }> | null;
}

export function planLayout(input: LayoutInput): LayoutOutput {
  const { people, size, activeFilters, splitFilters, mode } = input;
  const splitDistance = input.splitDistance ?? 28;
  const cx = size.w / 2;
  const cy = size.h / 2;
  const matches: Record<string, boolean> = {};

  // ─── Split mode ─────────────────────────────────────────────
  if (splitFilters && (splitFilters.left || splitFilters.right)) {
    people.forEach((p) => {
      const inLeft = splitFilters.left ? matchFilter(p, splitFilters.left) : false;
      const inRight = splitFilters.right ? matchFilter(p, splitFilters.right) : false;
      matches[p.id] = inLeft || inRight;
    });

    let nLeft = 0;
    let nRight = 0;
    people.forEach((p) => {
      if (splitFilters.left && matchFilter(p, splitFilters.left)) nLeft++;
      else if (splitFilters.right && matchFilter(p, splitFilters.right)) nRight++;
    });

    const baseOffset = size.w * (splitDistance / 100);
    const bias = (n: number) => Math.sqrt(Math.max(0, n - 1)) * 28;
    const leftCenter = { x: cx - (baseOffset + bias(nLeft)), y: cy };
    const rightCenter = { x: cx + (baseOffset + bias(nRight)), y: cy };

    const splitTargets: Record<string, { x: number; y: number }> = {};
    people.forEach((p) => {
      if (splitFilters.left && matchFilter(p, splitFilters.left)) splitTargets[p.id] = leftCenter;
      else if (splitFilters.right && matchFilter(p, splitFilters.right)) splitTargets[p.id] = rightCenter;
    });
    return { matches, splitTargets, clusterCenters: null };
  }

  // ─── Stacked filters ────────────────────────────────────────
  people.forEach((p) => {
    matches[p.id] = matchStackedFilters(p, activeFilters);
  });

  // ─── No filter → mode-driven cluster centers ────────────────
  if (!activeFilters.length) {
    if (mode === "orbit") {
      const baseAngles: Record<string, number> = {
        family: -Math.PI / 2,
        friend: -Math.PI / 6,
        work: Math.PI / 6,
        school: Math.PI / 2,
        mentor: (5 * Math.PI) / 6,
        community: -(5 * Math.PI) / 6,
      };
      const R = Math.min(size.w, size.h) * 0.28;
      const centers: Record<string, { x: number; y: number }> = {};
      Object.entries(baseAngles).forEach(([g, a]) => {
        centers[g] = { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
      });
      return { matches, splitTargets: null, clusterCenters: centers };
    }
    if (mode === "bloom") {
      const centers: Record<string, { x: number; y: number }> = {};
      (["family", "friend", "work", "school", "mentor", "community"] as const).forEach(
        (g) => { centers[g] = { x: cx, y: cy }; }
      );
      return { matches, splitTargets: null, clusterCenters: centers };
    }
    // drift
    const baseAngles: Record<string, number> = {
      family: -Math.PI / 2,
      friend: -Math.PI / 3,
      work: 0,
      school: Math.PI / 3,
      mentor: (2 * Math.PI) / 3,
      community: Math.PI,
    };
    const R = Math.min(size.w, size.h) * 0.18;
    const centers: Record<string, { x: number; y: number }> = {};
    Object.entries(baseAngles).forEach(([g, a]) => {
      centers[g] = { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
    });
    return { matches, splitTargets: null, clusterCenters: centers };
  }

  // ─── Filters active (single mode) — all matches tight around YOU ──
  const centers: Record<string, { x: number; y: number }> = {};
  (["family", "friend", "work", "school", "mentor", "community"] as const).forEach(
    (g) => { centers[g] = { x: cx, y: cy }; }
  );
  return { matches, splitTargets: null, clusterCenters: centers };
}

// Border-color rule from handoff:
//   - Orange  → family
//   - Black   → everyone else (friend / work / school / mentor / community)
//   - None    → me
export function borderColorFor(group: TreeGroupType | "me"): string {
  if (group === "me") return "transparent";
  if (group === "family") return "#C0704A";
  return "#1A1410";
}

// Deterministic HSL hue from a name/id — drives the pastel bubble fill.
export function getHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
