"use client";

// MAI Tree — quick card. Ported from handoff/MAITree.jsx :439-485.

import type { Person } from "./mai-tree-types";
import { borderColorFor, getHue, getInitials } from "./mai-tree-layout";

interface QuickCardProps {
  person: Person | null;
  pos: { x: number; y: number } | undefined;
  size: { w: number; h: number };
  onClose: () => void;
  onOpen: () => void;
}

export function MaiTreeQuickCard({ person, pos, size, onClose, onOpen }: QuickCardProps) {
  if (!person || !pos) return null;
  const color = borderColorFor(person.group);
  const cardW = 250;
  const x = Math.min(Math.max(pos.x + 50, 20), size.w - cardW - 20);
  const y = Math.max(Math.min(pos.y - 40, size.h - 240), 80);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: cardW,
        zIndex: 120,
        background: "#FDF9F3",
        borderRadius: 16,
        border: "1px solid rgba(192,112,74,0.18)",
        boxShadow: "0 16px 48px rgba(61,43,31,0.16)",
        padding: 18,
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "maiTreeFadeIn 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, hsl(${getHue(person.name)} 38% 78%), hsl(${getHue(person.name)} 35% 62%))`,
            border: `2px solid ${color}`,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            fontFamily: "'Lora', Georgia, serif",
          }}
        >
          {getInitials(person.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 17,
              fontWeight: 700,
              color: "#3D2B1F",
              lineHeight: 1.2,
            }}
          >
            {person.name}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 3,
              padding: "2px 9px",
              borderRadius: 8,
              background: person.group === "family" ? "rgba(192,112,74,0.12)" : "rgba(26,20,16,0.08)",
              color,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            {(person.relationship || person.group).toUpperCase()}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#9b8670",
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#7a6550", lineHeight: 1.45, marginBottom: 10 }}>
        {person.age != null ? `${person.age} yrs` : ""}
        {person.age != null && person.occupation ? " · " : ""}
        {person.occupation ?? ""}
      </div>

      <div
        style={{
          display: "flex",
          gap: 14,
          fontSize: 12,
          color: "#5b4a3a",
          marginBottom: 12,
        }}
      >
        <span>📖 {person.stories} Stories</span>
        <span>🍴 {person.recipes} Recipes</span>
      </div>

      <button
        onClick={onOpen}
        style={{
          width: "100%",
          padding: "9px 0",
          borderRadius: 10,
          border: `1.5px solid ${color}`,
          background: "transparent",
          color,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        View Full Profile →
      </button>
    </div>
  );
}
