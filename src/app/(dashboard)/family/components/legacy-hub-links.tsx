"use client";

import { memo } from "react";
import type { ConnectionType } from "./legacy-hub-types";

// ============================================================================
// Color Palette — MAI Legacy warm terracotta tones
// ============================================================================
const LINK_COLORS: Record<ConnectionType, string> = {
  dna: "oklch(0.55 0.15 45 / 0.50)",       // primary terracotta
  friend: "oklch(0.62 0.12 55 / 0.45)",     // warm amber
  spouse: "oklch(0.58 0.14 40 / 0.55)",      // deeper terracotta
};

// ============================================================================
// Resolved link — positions already computed by the canvas
// ============================================================================
export interface ResolvedLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
}

// ============================================================================
// Dashed curved path generator
// ============================================================================
function generateDashedPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number
): string {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Straight line for very short connections
  if (dist < 50) {
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  // Slight curve via quadratic bezier
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const arcOffset = Math.min(18, dist * 0.06);
  const perpX = (-dy / (dist || 1)) * arcOffset;
  const perpY = (dx / (dist || 1)) * arcOffset;

  return `M ${sx} ${sy} Q ${mx + perpX} ${my + perpY}, ${tx} ${ty}`;
}

// ============================================================================
// SVG Component — all link types use dashed lines, color-coded
// ============================================================================
const DashedLinks = memo(function DashedLinks({
  links,
  type,
}: {
  links: ResolvedLink[];
  type: ConnectionType;
}) {
  const color = LINK_COLORS[type];
  return (
    <>
      {links.map((link) => {
        const d = generateDashedPath(link.sx, link.sy, link.tx, link.ty);
        return (
          <path
            key={link.id}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeDasharray="8 6"
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
});

// ============================================================================
// Main export
// ============================================================================
export const LegacyHubLinks = memo(function LegacyHubLinks({
  links,
  width,
  height,
}: {
  links: ResolvedLink[];
  width: number;
  height: number;
}) {
  const dnaLinks = links.filter((l) => l.type === "dna");
  const friendLinks = links.filter((l) => l.type === "friend");
  const spouseLinks = links.filter((l) => l.type === "spouse");

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      <DashedLinks links={spouseLinks} type="spouse" />
      <DashedLinks links={dnaLinks} type="dna" />
      <DashedLinks links={friendLinks} type="friend" />
    </svg>
  );
});
