"use client";

import { memo } from "react";
import type { ConnectionType } from "./legacy-hub-types";

// ============================================================================
// Color Palette — MAI Legacy warm earthy tones
// ============================================================================
const DNA_STRAND_A = "oklch(0.62 0.07 48 / 0.65)";   // warm taupe
const DNA_STRAND_B = "oklch(0.52 0.09 38 / 0.55)";   // darker brown
const DNA_RUNG = "oklch(0.68 0.04 50 / 0.35)";        // subtle crossbar
const FRIEND_COLOR = "oklch(0.65 0.03 240 / 0.40)";   // cool grey-blue
const SPOUSE_COLOR = "oklch(0.72 0.07 55 / 0.60)";    // warm amber

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
// DNA Helix Line
// ============================================================================
function generateDnaHelix(
  sx: number, sy: number, tx: number, ty: number
): { strand1: string; strand2: string; rungs: [number, number, number, number][] } {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 30) {
    const p = `M ${sx} ${sy} L ${tx} ${ty}`;
    return { strand1: p, strand2: p, rungs: [] };
  }

  const angle = Math.atan2(dy, dx);
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  const helixW = Math.min(7, Math.max(3.5, dist * 0.022));
  const numWaves = Math.max(2, Math.floor(dist / 40));
  const steps = numWaves * 14;

  const p1: string[] = [`M`];
  const p2: string[] = [`M`];
  const rungs: [number, number, number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const bx = sx + dx * t;
    const by = sy + dy * t;
    const wave = Math.sin(t * numWaves * Math.PI * 2);
    const ox = perpX * helixW * wave;
    const oy = perpY * helixW * wave;

    const cmd = i === 0 ? "" : "L ";
    p1.push(`${cmd}${(bx + ox).toFixed(1)} ${(by + oy).toFixed(1)}`);
    p2.push(`${cmd}${(bx - ox).toFixed(1)} ${(by - oy).toFixed(1)}`);

    if (i > 0 && i < steps) {
      const prevWave = Math.sin(((i - 1) / steps) * numWaves * Math.PI * 2);
      if ((prevWave >= 0 && wave < 0) || (prevWave < 0 && wave >= 0)) {
        rungs.push([bx + ox, by + oy, bx - ox, by - oy]);
      }
    }
  }

  return { strand1: p1.join(" "), strand2: p2.join(" "), rungs };
}

// ============================================================================
// Chain-Link Line (friend connections)
// ============================================================================
function generateChainPath(sx: number, sy: number, tx: number, ty: number): string {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const arcOffset = Math.min(20, Math.sqrt(dx * dx + dy * dy) * 0.08);
  const perpX = -dy / Math.sqrt(dx * dx + dy * dy || 1) * arcOffset;
  const perpY = dx / Math.sqrt(dx * dx + dy * dy || 1) * arcOffset;
  return `M ${sx} ${sy} Q ${mx + perpX} ${my + perpY}, ${tx} ${ty}`;
}

// ============================================================================
// SVG Components
// ============================================================================

const DnaLinks = memo(function DnaLinks({ links }: { links: ResolvedLink[] }) {
  return (
    <>
      {links.map((link) => {
        const helix = generateDnaHelix(link.sx, link.sy, link.tx, link.ty);
        return (
          <g key={link.id}>
            <path d={helix.strand1} fill="none" stroke={DNA_STRAND_A} strokeWidth={1.4} strokeLinecap="round" />
            <path d={helix.strand2} fill="none" stroke={DNA_STRAND_B} strokeWidth={1.4} strokeLinecap="round" />
            {helix.rungs.filter((_, j) => j % 2 === 0).map((r, j) => (
              <line key={j} x1={r[0]} y1={r[1]} x2={r[2]} y2={r[3]}
                stroke={DNA_RUNG} strokeWidth={0.8} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </>
  );
});

const FriendLinks = memo(function FriendLinks({ links }: { links: ResolvedLink[] }) {
  return (
    <>
      {links.map((link) => {
        const d = generateChainPath(link.sx, link.sy, link.tx, link.ty);
        return (
          <g key={link.id}>
            <path d={d} fill="none" stroke={FRIEND_COLOR} strokeWidth={3}
              strokeDasharray="2 8" strokeLinecap="round" opacity={0.4} />
            <path d={d} fill="none" stroke={FRIEND_COLOR} strokeWidth={1.5}
              strokeDasharray="8 6" strokeLinecap="round" />
          </g>
        );
      })}
    </>
  );
});

const SpouseLinks = memo(function SpouseLinks({ links }: { links: ResolvedLink[] }) {
  return (
    <>
      {links.map((link) => (
        <path key={link.id}
          d={`M ${link.sx} ${link.sy} L ${link.tx} ${link.ty}`}
          fill="none" stroke={SPOUSE_COLOR} strokeWidth={2.5} strokeLinecap="round" />
      ))}
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
      <SpouseLinks links={spouseLinks} />
      <DnaLinks links={dnaLinks} />
      <FriendLinks links={friendLinks} />
    </svg>
  );
});
