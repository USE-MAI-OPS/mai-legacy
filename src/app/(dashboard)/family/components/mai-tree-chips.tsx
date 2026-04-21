"use client";

// MAI Tree — active filter chips + split labels.
// Ported from handoff/MAITree.jsx :629-736.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Person, View, TreeSplitSpec } from "./mai-tree-types";
import { matchFilter } from "./mai-tree-layout";

interface ActiveChipsProps {
  views: View[];
  activeFilterIds: string[];
  onRemove: (id: string) => void;
  splitView: View | null;
}

export function MaiTreeActiveChips({
  views,
  activeFilterIds,
  onRemove,
  splitView,
}: ActiveChipsProps) {
  if (!activeFilterIds.length && !splitView) return null;

  const chips: { id: string; label: string; isSplit: boolean }[] = [];
  if (splitView) chips.push({ id: splitView.id, label: splitView.label, isSplit: true });
  activeFilterIds.forEach((id) => {
    const v = views.find((x) => x.id === id);
    if (v) chips.push({ id, label: v.label, isSplit: false });
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 8,
        zIndex: 80,
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "65%",
      }}
    >
      {chips.map((c) => (
        <div
          key={c.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 6px 6px 14px",
            borderRadius: 999,
            background: c.isSplit ? "rgba(138,91,184,0.12)" : "rgba(192,112,74,0.12)",
            border: c.isSplit ? "1.5px solid rgba(138,91,184,0.4)" : "1.5px solid rgba(192,112,74,0.35)",
            fontSize: 11,
            fontWeight: 700,
            color: c.isSplit ? "#8A5BB8" : "#C0704A",
            letterSpacing: "0.05em",
            fontFamily: "system-ui, sans-serif",
            backdropFilter: "blur(8px)",
          }}
        >
          {c.isSplit && <span style={{ fontSize: 9, opacity: 0.8 }}>SPLIT:</span>}
          <span style={{ textTransform: "uppercase" }}>{c.label}</span>
          <button
            onClick={() => onRemove(c.id)}
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: c.isSplit ? "rgba(138,91,184,0.2)" : "rgba(192,112,74,0.2)",
              border: "none",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              color: c.isSplit ? "#8A5BB8" : "#C0704A",
              padding: 0,
            }}
            aria-label="Remove filter"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Split labels (two pills auto-tracking cluster centroids) ─────────────
interface SplitLabelsProps {
  split: TreeSplitSpec | null;
  size: { w: number; h: number };
  positions: Record<string, { x: number; y: number }>;
  people: Person[];
}

export function MaiTreeSplitLabels({ split, size, positions, people }: SplitLabelsProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!split) return;
    // Cleanup resets `visible` to false when split toggles off, so we don't
    // need an else-branch setState here (lint flags setState-in-effect).
    const t = setTimeout(() => setVisible(true), 60);
    return () => {
      clearTimeout(t);
      setVisible(false);
    };
  }, [split]);

  if (!split) return null;
  const leftPeople = people.filter((p) => matchFilter(p, split.left));
  const rightPeople = people.filter((p) => matchFilter(p, split.right));

  const cx = size.w / 2;
  const baseOffset = size.w * 0.28;
  const bias = (n: number) => Math.sqrt(Math.max(0, n - 1)) * 28;
  const leftPredictedX = cx - (baseOffset + bias(leftPeople.length));
  const rightPredictedX = cx + (baseOffset + bias(rightPeople.length));

  const liveCentroidX = (arr: Person[], predictedX: number): number => {
    const xs = arr.map((p) => positions[p.id]?.x).filter((x): x is number => typeof x === "number");
    if (xs.length < Math.max(1, Math.floor(arr.length * 0.5))) return predictedX;
    const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
    return avg;
  };
  const leftX = liveCentroidX(leftPeople, leftPredictedX);
  const rightX = liveCentroidX(rightPeople, rightPredictedX);
  const sharedY = 42;

  const pill = (text: string, count: number, x: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        top: sharedY,
        left: x,
        transform: `translateX(-50%) scale(${visible ? 1 : 0.6})`,
        opacity: visible ? 1 : 0,
        padding: "8px 18px",
        borderRadius: 999,
        background: "rgba(253,249,243,0.92)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(192,112,74,0.18)",
        boxShadow: "0 4px 14px rgba(61,43,31,0.08)",
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 15,
        fontWeight: 600,
        color: "#3D2B1F",
        whiteSpace: "nowrap",
        zIndex: 30,
        transformOrigin: "center bottom",
        transition:
          "opacity 0.2s ease, transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.4s ease",
        pointerEvents: "none",
      }}
    >
      {text} <span style={{ color: "#9b8670", fontWeight: 500 }}>({count})</span>
    </div>
  );

  return (
    <>
      {pill(split.left.label, leftPeople.length, leftX, "left")}
      {pill(split.right.label, rightPeople.length, rightX, "right")}
    </>
  );
}
