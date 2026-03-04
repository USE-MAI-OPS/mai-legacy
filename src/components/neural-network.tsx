"use client";

import { useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NodeData {
  id: string;
  label: string;
  type: string;
}

interface SimNode {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  label: string;
  type: string;
  active: boolean;
  opacity: number;
  phase: number;
  speed: number;
  amplitudeX: number;
  amplitudeY: number;
}

interface SimEdge {
  a: number;
  b: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TYPE_COLORS: Record<string, { fill: string; glow: string }> = {
  story: { fill: "#60a5fa", glow: "rgba(96, 165, 250, 0.5)" },
  recipe: { fill: "#fb923c", glow: "rgba(251, 146, 60, 0.5)" },
  skill: { fill: "#4ade80", glow: "rgba(74, 222, 128, 0.5)" },
  lesson: { fill: "#c084fc", glow: "rgba(192, 132, 252, 0.5)" },
  connection: { fill: "#f472b6", glow: "rgba(244, 114, 182, 0.5)" },
  general: { fill: "#94a3b8", glow: "rgba(148, 163, 184, 0.4)" },
};

const DEFAULT_ENTRIES: NodeData[] = [
  { id: "1", label: "Grandma's Cornbread", type: "recipe" },
  { id: "2", label: "Family Reunion History", type: "story" },
  { id: "3", label: "Fix Leaky Faucet", type: "skill" },
  { id: "4", label: "Garden Wisdom", type: "lesson" },
  { id: "5", label: "BBQ Rub Secret", type: "recipe" },
  { id: "6", label: "Mississippi Road Trip", type: "story" },
  { id: "7", label: "Aunt Diane's Quilts", type: "skill" },
  { id: "8", label: "Sunday Dinner", type: "story" },
  { id: "9", label: "Peach Cobbler", type: "recipe" },
  { id: "10", label: "Financial Literacy", type: "lesson" },
  { id: "11", label: "Uncle Robert", type: "connection" },
  { id: "12", label: "Collard Greens", type: "recipe" },
  { id: "13", label: "Wedding Stories", type: "story" },
  { id: "14", label: "Car Maintenance", type: "skill" },
  { id: "15", label: "Respect Your Elders", type: "lesson" },
  { id: "16", label: "Cousin James", type: "connection" },
  { id: "17", label: "Mac & Cheese", type: "recipe" },
  { id: "18", label: "Military Service", type: "story" },
  { id: "19", label: "Home Repairs", type: "skill" },
  { id: "20", label: "Faith & Prayer", type: "lesson" },
  { id: "21", label: "Sweet Potato Pie", type: "recipe" },
  { id: "22", label: "First Home", type: "story" },
  { id: "23", label: "Sewing Basics", type: "skill" },
  { id: "24", label: "Community Values", type: "lesson" },
  { id: "25", label: "Grandpa James", type: "connection" },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface NeuralNetworkProps {
  className?: string;
  isQuerying?: boolean;
  entries?: NodeData[];
}

export function NeuralNetwork({
  className = "",
  isQuerying = false,
  entries,
}: NeuralNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const hoveredRef = useRef(-1);
  const timeRef = useRef(0);
  const pulseRef = useRef(0);
  const initRef = useRef(false);
  const dimRef = useRef({ w: 0, h: 0 });

  const nodeData = entries ?? DEFAULT_ENTRIES;

  // --- Build network layout using golden-angle spiral ---
  const buildNetwork = useCallback(
    (w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const spread = Math.min(w, h) * 0.032;
      const golden = Math.PI * (3 - Math.sqrt(5));

      const nodes: SimNode[] = nodeData.map((entry, i) => {
        const angle = i * golden;
        const r = Math.sqrt(i + 0.5) * spread;
        const tc = TYPE_COLORS[entry.type] ?? TYPE_COLORS.general;

        return {
          baseX: cx + Math.cos(angle) * r,
          baseY: cy + Math.sin(angle) * r,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          radius: rand(5, 11),
          color: tc.fill,
          glowColor: tc.glow,
          label: entry.label,
          type: entry.type,
          active: false,
          opacity: rand(0.5, 0.85),
          phase: rand(0, Math.PI * 2),
          speed: rand(0.005, 0.015),
          amplitudeX: rand(8, 25),
          amplitudeY: rand(8, 25),
        };
      });

      // Edges: same-type nodes + random cross-type
      const edges: SimEdge[] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].baseX - nodes[j].baseX;
          const dy = nodes[i].baseY - nodes[j].baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (nodes[i].type === nodes[j].type && dist < 250) {
            edges.push({ a: i, b: j });
          } else if (dist < 160 && Math.random() < 0.25) {
            edges.push({ a: i, b: j });
          }
        }
      }

      nodesRef.current = nodes;
      edgesRef.current = edges;
    },
    [nodeData]
  );

  // --- Draw a single frame ---
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const t = timeRef.current;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const pulse = pulseRef.current;

      // ----- Background -----
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
      bg.addColorStop(0, "#0f172a");
      bg.addColorStop(0.6, "#020617");
      bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // ----- Subtle dot grid -----
      ctx.fillStyle = "rgba(255,255,255,0.015)";
      const gs = 50;
      for (let x = gs; x < w; x += gs) {
        for (let y = gs; y < h; y += gs) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ----- Animate node positions -----
      hoveredRef.current = -1;
      let closestDist = Infinity;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x = n.baseX + Math.sin(t * n.speed + n.phase) * n.amplitudeX;
        n.y = n.baseY + Math.cos(t * n.speed * 0.8 + n.phase + 1) * n.amplitudeY;

        const dx = mx - n.x;
        const dy = my - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < n.radius + 30 && dist < closestDist) {
          hoveredRef.current = i;
          closestDist = dist;
        }
      }

      // ----- Edges -----
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 280) continue;

        const base = Math.max(0, (1 - dist / 280) * 0.12);
        const boost = a.active || b.active ? 0.25 : 0;
        const hoverBoost =
          hoveredRef.current === e.a || hoveredRef.current === e.b
            ? 0.15
            : 0;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(148,163,184,${base + boost + hoverBoost})`;
        ctx.lineWidth = a.active || b.active ? 1.2 : 0.6;
        ctx.stroke();
      }

      // ----- Nodes -----
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const hovered = hoveredRef.current === i;
        const pulseFactor = Math.sin(t * 0.03 + n.phase) * 0.15 + 0.85;
        const activeScale = n.active ? 1.6 : 1;
        const hoverScale = hovered ? 1.3 : 1;
        const r = n.radius * pulseFactor * activeScale * hoverScale;
        const alpha = n.opacity * (n.active ? 1 : 0.7) * (hovered ? 1.1 : 1);

        // Glow
        const glowR = r * (hovered ? 5 : n.active ? 4.5 : 3);
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        grd.addColorStop(0, n.glowColor);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = alpha;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.28, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
      }

      // ----- Query pulse ring -----
      if (pulse > 0 && pulse < 1.2) {
        const pr = pulse * Math.max(w, h) * 0.6;
        const pa = Math.max(0, 0.35 - pulse * 0.3);
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, pr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(129,140,248,${pa})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ----- Hovered label -----
      if (hoveredRef.current >= 0) {
        const n = nodes[hoveredRef.current];
        const labelY = n.y - n.radius * 2.5 - 10;

        // Background pill
        ctx.font = "600 12px system-ui, -apple-system, sans-serif";
        const tm = ctx.measureText(n.label);
        const px = 10;
        const py = 5;
        const pillW = tm.width + px * 2;
        const pillH = 20 + py;

        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.beginPath();
        const pillX = n.x - pillW / 2;
        const pillY = labelY - pillH / 2;
        ctx.roundRect(pillX, pillY, pillW, pillH, 6);
        ctx.fill();

        // Border
        ctx.strokeStyle = `${n.color}60`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Text
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x, labelY);

        // Type badge
        ctx.font = "500 9px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = n.color;
        ctx.fillText(n.type.toUpperCase(), n.x, labelY + 14);
      }
    },
    []
  );

  // --- Animation loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimRef.current = { w: rect.width, h: rect.height };

      // Rebuild network on resize
      buildNetwork(rect.width, rect.height);
      initRef.current = true;
    };

    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const loop = () => {
      timeRef.current++;
      const { w, h } = dimRef.current;
      if (w > 0 && h > 0 && initRef.current) {
        draw(ctx, w, h);
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [buildNetwork, draw]);

  // --- Query animation ---
  useEffect(() => {
    if (!isQuerying) {
      // Deactivate all nodes
      for (const n of nodesRef.current) n.active = false;
      pulseRef.current = 0;
      return;
    }

    // Activate random nodes in a staggered wave
    const nodes = nodesRef.current;
    const count = Math.min(10, nodes.length);
    const shuffled = Array.from({ length: nodes.length }, (_, i) => i).sort(
      () => Math.random() - 0.5
    );

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          if (nodesRef.current[shuffled[i]]) {
            nodesRef.current[shuffled[i]].active = true;
          }
        }, i * 180)
      );
    }

    // Pulse wave
    pulseRef.current = 0;
    const pulseTimer = setInterval(() => {
      pulseRef.current += 0.015;
      if (pulseRef.current > 1.2) pulseRef.current = 0;
    }, 16);

    return () => {
      clearInterval(pulseTimer);
      timers.forEach(clearTimeout);
      for (const n of nodesRef.current) n.active = false;
      pulseRef.current = 0;
    };
  }, [isQuerying]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", cursor: hoveredRef.current >= 0 ? "pointer" : "default" }}
    />
  );
}
