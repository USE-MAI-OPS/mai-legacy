// ============================================================================
// Classic Tree Links — clean orthogonal SVG connectors
// Standard genealogy T-bar lines (parent→child) + spouse connectors
// ============================================================================

import React from "react";
import type { LayoutNode, LayoutLink } from "./classic-tree-layout";

const NODE_HALF_W = 70; // half the visual node width
const NODE_H = 110; // approx visual node height (avatar + text)
const MID_DROP = 40; // how far below the parent the horizontal bar sits

interface ClassicTreeLinksProps {
  nodes: LayoutNode[];
  links: LayoutLink[];
  width: number;
  height: number;
}

export function ClassicTreeLinks({ nodes, links, width, height }: ClassicTreeLinksProps) {
  const posMap = new Map(nodes.map((n) => [n.id, n]));

  // Group parent-child links by parent for T-bar rendering
  const childrenByParent = new Map<string, string[]>();
  const spouseLinks: LayoutLink[] = [];

  for (const link of links) {
    if (link.type === "parent-child") {
      const arr = childrenByParent.get(link.sourceId) ?? [];
      arr.push(link.targetId);
      childrenByParent.set(link.sourceId, arr);
    } else {
      spouseLinks.push(link);
    }
  }

  const paths: React.ReactNode[] = [];

  // ── Parent→Child T-bar connectors ─────────────────────────────────────
  for (const [parentId, childIds] of childrenByParent) {
    const parent = posMap.get(parentId);
    if (!parent) continue;

    const validChildren = childIds
      .map((cid) => posMap.get(cid))
      .filter((c): c is LayoutNode => !!c);

    if (validChildren.length === 0) continue;

    const parentBottomY = parent.y + NODE_H;
    const barY = parentBottomY + MID_DROP;

    // Vertical drop from parent bottom to bar
    paths.push(
      <line
        key={`drop-${parentId}`}
        x1={parent.x}
        y1={parentBottomY}
        x2={parent.x}
        y2={barY}
        stroke="oklch(0.55 0.04 250 / 0.35)"
        strokeWidth={2}
      />
    );

    if (validChildren.length === 1) {
      // Single child: straight line down
      const child = validChildren[0];
      paths.push(
        <line
          key={`single-${parentId}-${child.id}`}
          x1={parent.x}
          y1={barY}
          x2={child.x}
          y2={child.y}
          stroke="oklch(0.55 0.04 250 / 0.35)"
          strokeWidth={2}
        />
      );
    } else {
      // Multiple children: horizontal bar + drops to each child
      const xs = validChildren.map((c) => c.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);

      // Horizontal bar
      paths.push(
        <line
          key={`bar-${parentId}`}
          x1={minX}
          y1={barY}
          x2={maxX}
          y2={barY}
          stroke="oklch(0.55 0.04 250 / 0.35)"
          strokeWidth={2}
        />
      );

      // Vertical drops from bar to each child
      for (const child of validChildren) {
        paths.push(
          <line
            key={`child-drop-${parentId}-${child.id}`}
            x1={child.x}
            y1={barY}
            x2={child.x}
            y2={child.y}
            stroke="oklch(0.55 0.04 250 / 0.35)"
            strokeWidth={2}
          />
        );
      }
    }
  }

  // ── Spouse connectors ─────────────────────────────────────────────────
  for (const link of spouseLinks) {
    const a = posMap.get(link.sourceId);
    const b = posMap.get(link.targetId);
    if (!a || !b) continue;

    // Horizontal line between the two spouses at avatar center height
    const y = Math.min(a.y, b.y) + 32; // roughly avatar center
    const x1 = Math.min(a.x, b.x) + NODE_HALF_W - 10;
    const x2 = Math.max(a.x, b.x) - NODE_HALF_W + 10;

    paths.push(
      <line
        key={`spouse-${link.sourceId}-${link.targetId}`}
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="oklch(0.65 0.08 50 / 0.50)"
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />
    );

    // Small heart/ring marker at midpoint
    const mx = (x1 + x2) / 2;
    paths.push(
      <circle
        key={`spouse-dot-${link.sourceId}-${link.targetId}`}
        cx={mx}
        cy={y}
        r={4}
        fill="oklch(0.65 0.08 50 / 0.60)"
      />
    );
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      {paths}
    </svg>
  );
}
