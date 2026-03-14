"use client";

import { memo } from "react";
import type {
  SpousePair,
  PositionedLink,
  SimNode,
} from "./use-family-force-layout";

// ---------------------------------------------------------------------------
// Connector colors & styling
// ---------------------------------------------------------------------------
const CONNECTOR_COLOR = "oklch(0.75 0.04 80 / 0.6)";
const PILL_FILL = "oklch(0.93 0.03 80 / 0.25)";
const PILL_STROKE = "oklch(0.85 0.04 80 / 0.4)";
const UNION_DOT_COLOR = "oklch(0.80 0.04 80 / 0.5)";

function strokeForGeneration(gen: number): number {
  return Math.max(1, 3 - gen * 0.5);
}

// ---------------------------------------------------------------------------
// SVG Bezier path for parent→child connection (S-curve)
// ---------------------------------------------------------------------------
function bezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const dy = y2 - y1;
  const cp1y = y1 + dy * 0.4;
  const cp2y = y2 - dy * 0.4;
  return `M${x1},${y1} C${x1},${cp1y} ${x2},${cp2y} ${x2},${y2}`;
}

// ---------------------------------------------------------------------------
// Marriage pill shapes
// ---------------------------------------------------------------------------
const MarriagePills = memo(function MarriagePills({
  pairs,
}: {
  pairs: SpousePair[];
}) {
  return (
    <>
      {pairs.map((pair) => {
        const x = pair.midX - pair.pillWidth / 2;
        const y = pair.midY - pair.pillHeight / 2;
        return (
          <rect
            key={`pill-${pair.node1.id}-${pair.node2.id}`}
            x={x}
            y={y}
            width={pair.pillWidth}
            height={pair.pillHeight}
            rx={pair.pillHeight / 2}
            ry={pair.pillHeight / 2}
            fill={PILL_FILL}
            stroke={PILL_STROKE}
            strokeWidth={1}
          />
        );
      })}
    </>
  );
});

// ---------------------------------------------------------------------------
// Union node dots (small subtle dots where children branch from)
// ---------------------------------------------------------------------------
const UnionDots = memo(function UnionDots({
  unionNodes,
}: {
  unionNodes: SimNode[];
}) {
  return (
    <>
      {unionNodes.map((node) => (
        <circle
          key={`union-dot-${node.id}`}
          cx={node.x ?? 0}
          cy={node.y ?? 0}
          r={4}
          fill={UNION_DOT_COLOR}
        />
      ))}
    </>
  );
});

// ---------------------------------------------------------------------------
// Parent-child / union-child connectors
// ---------------------------------------------------------------------------
const ParentChildConnectors = memo(function ParentChildConnectors({
  links,
}: {
  links: PositionedLink[];
}) {
  return (
    <>
      {links.map((link, i) => {
        const d = bezierPath(
          link.sourceX,
          link.sourceY,
          link.targetX,
          link.targetY
        );
        const sw = link.fromUnion
          ? strokeForGeneration(link.sourceGeneration + 1)
          : strokeForGeneration(link.sourceGeneration);
        return (
          <path
            key={`link-${i}`}
            d={d}
            stroke={CONNECTOR_COLOR}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </>
  );
});

// ---------------------------------------------------------------------------
// Main SVG layer
// ---------------------------------------------------------------------------
export const FamilyTreeConnectors = memo(function FamilyTreeConnectors({
  spousePairs,
  parentChildLinks,
  unionNodes,
  width,
  height,
}: {
  spousePairs: SpousePair[];
  parentChildLinks: PositionedLink[];
  unionNodes: SimNode[];
  width: number;
  height: number;
}) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      <MarriagePills pairs={spousePairs} />
      <UnionDots unionNodes={unionNodes} />
      <ParentChildConnectors links={parentChildLinks} />
    </svg>
  );
});
