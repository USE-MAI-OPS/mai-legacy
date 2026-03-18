"use client";

import { memo } from "react";
import type { SpousePair, PositionedLink } from "./use-family-force-layout";

// ─── Styling ───────────────────────────────────────────────
const LINE_COLOR = "oklch(0.65 0.06 50 / 0.5)";
const SPOUSE_COLOR = "oklch(0.70 0.08 50 / 0.6)";

// ─── Spouse connections (dashed line between partners) ─────
const SpouseConnections = memo(function SpouseConnections({
  pairs,
}: {
  pairs: SpousePair[];
}) {
  return (
    <>
      {pairs.map((pair, i) => {
        const x1 = pair.node1.x ?? 0;
        const y1 = pair.node1.y ?? 0;
        const x2 = pair.node2.x ?? 0;
        const y2 = pair.node2.y ?? 0;

        return (
          <line
            key={`spouse-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={SPOUSE_COLOR}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
});

// ─── Parent-child bezier curves ────────────────────────────
const ParentChildCurves = memo(function ParentChildCurves({
  links,
}: {
  links: PositionedLink[];
}) {
  return (
    <>
      {links.map((link, i) => {
        const midY = (link.sourceY + link.targetY) / 2;
        const d = `M ${link.sourceX} ${link.sourceY} C ${link.sourceX} ${midY}, ${link.targetX} ${midY}, ${link.targetX} ${link.targetY}`;

        return (
          <path
            key={`link-${i}`}
            d={d}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={link.fromUnion ? 1.5 : 1.5}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
});

// ─── Union dots (small circles at couple junction) ─────────
const UnionDots = memo(function UnionDots({
  pairs,
}: {
  pairs: SpousePair[];
}) {
  return (
    <>
      {pairs.map((pair, i) => {
        const ux = pair.unionNode.x ?? pair.midX;
        const uy = pair.unionNode.y ?? pair.midY;
        return (
          <circle
            key={`union-${i}`}
            cx={ux}
            cy={uy}
            r={4}
            fill={SPOUSE_COLOR}
            opacity={0.6}
          />
        );
      })}
    </>
  );
});

// ─── Main SVG layer ────────────────────────────────────────
export const FamilyTreeConnectors = memo(function FamilyTreeConnectors({
  spousePairs,
  parentChildLinks,
  width,
  height,
}: {
  spousePairs: SpousePair[];
  parentChildLinks: PositionedLink[];
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
      <SpouseConnections pairs={spousePairs} />
      <ParentChildCurves links={parentChildLinks} />
      <UnionDots pairs={spousePairs} />
    </svg>
  );
});
