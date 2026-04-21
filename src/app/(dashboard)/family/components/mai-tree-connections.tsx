"use client";

// MAI Tree — optional SVG connection lines from YOU to everyone.
// Ported from handoff/MAITree.jsx :416-436. Off by default per LOCKED_SETTINGS.

import type { Person } from "./mai-tree-types";
import { borderColorFor } from "./mai-tree-layout";

interface ConnectionsProps {
  people: Person[];
  me: Person;
  positions: Record<string, { x: number; y: number }>;
  show: boolean;
  opacity: number;
}

export function MaiTreeConnections({
  people,
  me,
  positions,
  show,
  opacity,
}: ConnectionsProps) {
  if (!show) return null;
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {people.map((p) => {
        const from = positions[me.id];
        const to = positions[p.id];
        if (!from || !to) return null;
        const color = borderColorFor(p.group);
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const nx = (to.y - from.y) * 0.1;
        const ny = -(to.x - from.x) * 0.1;
        return (
          <path
            key={p.id}
            d={`M ${from.x} ${from.y} Q ${mx + nx} ${my + ny} ${to.x} ${to.y}`}
            fill="none"
            stroke={color}
            strokeWidth={1.1}
            strokeDasharray="4 6"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}
