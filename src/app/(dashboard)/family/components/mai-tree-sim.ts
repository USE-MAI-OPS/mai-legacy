"use client";

// MAI Tree — force-directed simulation hook.
// Verbatim port of handoff/MAITree.jsx :102-280. Only changes: types + the
// `running` flag now defaults true (we don't have a pause control).

import { useEffect, useRef, useState } from "react";
import type { Person } from "./mai-tree-types";

export interface SimulationInput {
  people: Person[];
  me: Person;
  size: { w: number; h: number };
  splitTargets: Record<string, { x: number; y: number }> | null;
  clusterCenters: Record<string, { x: number; y: number }> | null;
  density: number;
  bubble: number;
  splitDensity?: number;
  meBarrierPad?: number;
  mode: "bloom" | "orbit" | "drift";
  filtersActive: boolean;
  matches: Record<string, boolean>;
  running: boolean;
}

type Vec = { x: number; y: number };
type Vel = { vx: number; vy: number };

function hueOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

export function useSimulation({
  people,
  me,
  size,
  splitTargets,
  clusterCenters,
  density,
  bubble,
  splitDensity = 160,
  meBarrierPad = 14,
  mode,
  matches,
  running,
}: SimulationInput) {
  const [positions, setPositions] = useState<Record<string, Vec>>({});
  const posRef = useRef<Record<string, Vec>>({});
  const velRef = useRef<Record<string, Vel>>({});
  const rafRef = useRef<number | null>(null);

  // init / re-init when people change (identity-based, not count — matches the
  // handoff's behavior where adding a member re-seeds only the new node).
  useEffect(() => {
    const next = { ...posRef.current };
    const vels = { ...velRef.current };
    const cx = size.w / 2;
    const cy = size.h / 2;
    const golden = Math.PI * (3 - Math.sqrt(5));
    [me, ...people].forEach((p, i) => {
      if (!next[p.id]) {
        const a = i * golden;
        const r = 140 + Math.sqrt(i) * 28;
        next[p.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      }
      if (!vels[p.id]) vels[p.id] = { vx: 0, vy: 0 };
    });
    posRef.current = next;
    velRef.current = vels;
    setPositions(next);
    // We intentionally depend on `people.length` + `me.id` to match the
    // handoff's seeding semantics. Exhaustive-deps would force re-seeds
    // every time the filter changes, which is wrong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people.length, me.id]);

  useEffect(() => {
    if (!running) return;
    const cx = size.w / 2;
    const cy = size.h / 2;
    const inSplit = !!splitTargets;
    const activeDensity = inSplit ? splitDensity : density;
    const spacing = Math.max(0.3, activeDensity / 55);
    const labelBlockH = inSplit ? 56 : 48;
    const footprint = bubble + labelBlockH;
    const desired = Math.max(footprint, footprint * spacing);
    const repel = 1800 * spacing;
    const attractK = inSplit ? 0.008 : 0.015;
    const centerK = inSplit ? 0.001 : 0.003;
    const damping = 0.82;
    const meBubbleR = (bubble * 1.35) / 2;
    const meBarrier = meBubbleR + labelBlockH / 2 + meBarrierPad + bubble / 2;
    const n = people.length;
    const packR = (n * desired * 0.85) / (2 * Math.PI);
    const maxViewR = Math.min(size.w, size.h) / 2 - bubble / 2 - labelBlockH - 20;
    const outerR = Math.max(meBarrier + bubble, Math.min(packR, maxViewR));

    const tick = () => {
      const pos = posRef.current;
      const vel = velRef.current;

      pos[me.id] = { x: cx, y: cy };
      vel[me.id] = { vx: 0, vy: 0 };

      const targets: Record<string, Vec> = {};
      people.forEach((p) => {
        const match = matches[p.id];
        if (!match) {
          const hue = hueOf(p.name);
          const a = (hue / 360) * Math.PI * 2;
          targets[p.id] = {
            x: cx + Math.cos(a) * (Math.max(size.w, size.h) * 0.75),
            y: cy + Math.sin(a) * (Math.max(size.w, size.h) * 0.75),
          };
          return;
        }
        if (splitTargets && splitTargets[p.id]) {
          targets[p.id] = splitTargets[p.id];
          return;
        }
        if (clusterCenters && clusterCenters[p.group]) {
          targets[p.id] = clusterCenters[p.group];
          return;
        }
        targets[p.id] = { x: cx, y: cy };
      });

      const idSet = [me.id, ...people.map((p) => p.id)];
      idSet.forEach((id) => {
        if (!vel[id]) vel[id] = { vx: 0, vy: 0 };
      });

      // Pairwise isotropic repulsion
      for (let i = 0; i < idSet.length; i++) {
        for (let j = i + 1; j < idSet.length; j++) {
          const a = pos[idSet[i]];
          const b = pos[idSet[j]];
          if (!a || !b) continue;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 1) {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            dist2 = 1;
          }
          const dist = Math.sqrt(dist2);
          const force = repel / dist2 + (dist < desired ? (desired - dist) * 0.9 : 0);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (idSet[i] !== me.id) {
            vel[idSet[i]].vx -= fx * 0.02;
            vel[idSet[i]].vy -= fy * 0.02;
          }
          if (idSet[j] !== me.id) {
            vel[idSet[j]].vx += fx * 0.02;
            vel[idSet[j]].vy += fy * 0.02;
          }
        }
      }

      // Per-person: attraction + centering + YOU barrier + outer boundary
      people.forEach((p) => {
        const t = targets[p.id];
        const cur = pos[p.id];
        if (!cur || !t) return;
        vel[p.id].vx += (t.x - cur.x) * attractK;
        vel[p.id].vy += (t.y - cur.y) * attractK;
        vel[p.id].vx += (cx - cur.x) * centerK;
        vel[p.id].vy += (cy - cur.y) * centerK;

        const dxMe = cur.x - cx;
        const dyMe = cur.y - cy;
        const distMe = Math.hypot(dxMe, dyMe) || 0.01;
        if (distMe < meBarrier) {
          const push = (meBarrier - distMe) * 0.35;
          vel[p.id].vx += (dxMe / distMe) * push;
          vel[p.id].vy += (dyMe / distMe) * push;
        }

        const jitter = ((hueOf(p.id || p.name) % 100) / 100 - 0.5) * 0.35;
        const myOuterR = outerR * (1 + jitter);
        if (!splitTargets && distMe > myOuterR) {
          const pullBack = (distMe - myOuterR) * 0.08;
          vel[p.id].vx -= (dxMe / distMe) * pullBack;
          vel[p.id].vy -= (dyMe / distMe) * pullBack;
        }

        vel[p.id].vx *= damping;
        vel[p.id].vy *= damping;
        const v = Math.hypot(vel[p.id].vx, vel[p.id].vy);
        if (v > 18) {
          vel[p.id].vx = (vel[p.id].vx / v) * 18;
          vel[p.id].vy = (vel[p.id].vy / v) * 18;
        }
        pos[p.id] = { x: cur.x + vel[p.id].vx, y: cur.y + vel[p.id].vy };
      });

      // Hard separation (footprint collision) — 2 relaxation passes
      const minSep = footprint;
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < idSet.length; i++) {
          for (let j = i + 1; j < idSet.length; j++) {
            const a = pos[idSet[i]];
            const b = pos[idSet[j]];
            if (!a || !b) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.01;
            if (dist < minSep) {
              const overlap = (minSep - dist) * 0.5;
              const ux = dx / dist;
              const uy = dy / dist;
              if (idSet[i] === me.id) {
                b.x += ux * overlap * 2;
                b.y += uy * overlap * 2;
              } else if (idSet[j] === me.id) {
                a.x -= ux * overlap * 2;
                a.y -= uy * overlap * 2;
              } else {
                a.x -= ux * overlap;
                a.y -= uy * overlap;
                b.x += ux * overlap;
                b.y += uy * overlap;
              }
            }
          }
        }
      }

      setPositions({ ...pos });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [
    running,
    size.w,
    size.h,
    density,
    splitDensity,
    meBarrierPad,
    bubble,
    JSON.stringify(splitTargets),
    JSON.stringify(clusterCenters),
    JSON.stringify(matches),
    mode,
    people,
    me.id,
  ]);

  return positions;
}
