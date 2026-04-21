"use client";

// MAI Tree — root canvas. Ported from handoff/MAITree.jsx :892-1168.
// Owns: filter state, split state, views state (seeded with built-ins + DB customs),
// pan offset, selected node, modal. Delegates physics to useSimulation and layout
// planning to planLayout.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { MaiTreeSidebar } from "./mai-tree-sidebar";
import { MaiTreeBubble } from "./mai-tree-bubble";
import { MaiTreeConnections } from "./mai-tree-connections";
import { MaiTreeActiveChips, MaiTreeSplitLabels } from "./mai-tree-chips";
import { MaiTreeLegend } from "./mai-tree-legend";
import { MaiTreeQuickCard } from "./mai-tree-quick-card";
import { MaiTreeProfileModal } from "./mai-tree-profile-modal";
import { MaiTreeGriotPanel } from "./mai-tree-griot-panel";
import { useSimulation } from "./mai-tree-sim";
import { planLayout, borderColorFor } from "./mai-tree-layout";
import {
  BUILTIN_VIEWS,
  LOCKED_SETTINGS,
  type Person,
  type View,
  type FilterPlan,
  type TreeFilterSpec,
} from "./mai-tree-types";

interface MaiTreeCanvasProps {
  people: Person[];
  me: Person;
  familyId: string;
  familyName: string;
  /** Custom views loaded from the tree_views table. Merged with BUILTIN_VIEWS. */
  savedViews: View[];
  /** Called with a new view when the user clicks "Save current as view". */
  onSaveView: (view: Omit<View, "id">) => Promise<{ id?: string; error?: string }>;
  /** Called when the user clicks × on a custom view. */
  onDeleteView: (id: string) => Promise<{ error?: string }>;
  /** Add-Member click handler (opens the existing AddTreeMemberDialog). */
  onAddMember: () => void;
}

export function MaiTreeCanvas({
  people,
  me,
  familyId,
  familyName,
  savedViews,
  onSaveView,
  onDeleteView,
  onAddMember,
}: MaiTreeCanvasProps) {
  const [views, setViews] = useState<View[]>(() => [...BUILTIN_VIEWS, ...savedViews]);
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);
  const [splitViewId, setSplitViewId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Person | null>(null);
  const [modal, setModal] = useState<Person | null>(null);
  const [size, setSize] = useState({ w: 1200, h: 700 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local views in sync when the server-loaded savedViews change.
  useEffect(() => {
    setViews([...BUILTIN_VIEWS, ...savedViews]);
  }, [savedViews]);

  // ─── Pan offset ───────────────────────────────────────────────
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const didPan = useRef(false);

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    didPan.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (!panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    if (!didPan.current && Math.hypot(dx, dy) > 3) didPan.current = true;
    if (didPan.current) {
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
    }
  };
  const onCanvasPointerUp = (e: React.PointerEvent) => {
    panStart.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };
  const onCanvasClick = () => {
    if (didPan.current) {
      didPan.current = false;
      return;
    }
    setSelected(null);
  };
  const resetPan = () => setPan({ x: 0, y: 0 });

  // ─── Resize observer ──────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ─── Layout + simulation ──────────────────────────────────────
  const activeFilters: TreeFilterSpec[] = activeFilterIds
    .map((id) => views.find((v) => v.id === id)?.filters)
    .filter((f): f is TreeFilterSpec => !!f);
  const splitView = (splitViewId ? views.find((v) => v.id === splitViewId) : null) ?? null;
  const splitFilters = splitView?.split ?? null;

  const { matches, splitTargets, clusterCenters } = useMemo(
    () =>
      planLayout({
        people,
        size,
        activeFilters,
        splitFilters,
        mode: "bloom",
        splitDistance: LOCKED_SETTINGS.splitDistance,
      }),
    // Stringify for stable equality; the inputs are small.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      size.w,
      size.h,
      JSON.stringify(activeFilters),
      JSON.stringify(splitFilters),
      people,
    ]
  );

  const positions = useSimulation({
    people,
    me,
    size,
    splitTargets,
    clusterCenters,
    matches,
    density: LOCKED_SETTINGS.density,
    bubble: LOCKED_SETTINGS.bubbleSize,
    splitDensity: LOCKED_SETTINGS.splitDensity,
    meBarrierPad: LOCKED_SETTINGS.meBarrierPad,
    mode: "bloom",
    filtersActive: activeFilters.length > 0,
    running: true,
  });

  // ─── Filter handlers ──────────────────────────────────────────
  const toggleFilter = useCallback(
    (id: string) => {
      const v = views.find((x) => x.id === id);
      if (!v) return;
      if (v.split) {
        setActiveFilterIds([]);
        setSplitViewId((prev) => (prev === id ? null : id));
        return;
      }
      // "Everyone" is a reset affordance — clear everything else rather than
      // stacking, since stacking it with another filter would AND an empty
      // groups list into the prior filter (no visible change, but confusing).
      if (id === "all") {
        setActiveFilterIds([]);
        setSplitViewId(null);
        return;
      }
      setSplitViewId(null);
      setActiveFilterIds((prev) => {
        const withoutAll = prev.filter((x) => x !== "all");
        return withoutAll.includes(id)
          ? withoutAll.filter((x) => x !== id)
          : [...withoutAll, id];
      });
    },
    [views]
  );
  const removeChip = useCallback(
    (id: string) => {
      if (splitViewId === id) {
        setSplitViewId(null);
        return;
      }
      setActiveFilterIds((prev) => prev.filter((x) => x !== id));
    },
    [splitViewId]
  );
  const clearAll = useCallback(() => {
    setActiveFilterIds([]);
    setSplitViewId(null);
  }, []);

  // ─── Save current as view ─────────────────────────────────────
  const canSave = activeFilterIds.length > 0 || !!splitViewId;
  const onSaveCurrent = useCallback(async (name: string) => {
    if (!name.trim()) return;
    if (splitView?.split) {
      const newView: Omit<View, "id"> = {
        label: name,
        icon: "split",
        filters: {},
        split: splitView.split,
        builtin: false,
      };
      const result = await onSaveView(newView);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.id) {
        const full: View = { ...newView, id: result.id };
        setViews((vs) => [...vs, full]);
        setSplitViewId(result.id);
      }
    } else {
      // Stack all active filters (AND) into one saved FilterSpec.
      const merged: TreeFilterSpec = {};
      activeFilters.forEach((f) => {
        if (f.groups) merged.groups = Array.from(new Set([...(merged.groups ?? []), ...f.groups]));
        if (f.side) merged.side = f.side;
        if (f.tags) merged.tags = Array.from(new Set([...(merged.tags ?? []), ...f.tags]));
        if (f.q) merged.q = f.q;
        if (f.minAge != null) merged.minAge = f.minAge;
        if (f.maxAge != null) merged.maxAge = f.maxAge;
        if (f.location) merged.location = f.location;
      });
      const newView: Omit<View, "id"> = {
        label: name,
        icon: "bookmark",
        filters: merged,
        split: null,
        builtin: false,
      };
      const result = await onSaveView(newView);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.id) {
        const full: View = { ...newView, id: result.id };
        setViews((vs) => [...vs, full]);
        setActiveFilterIds([result.id]);
      }
    }
  }, [activeFilters, splitView, onSaveView]);

  const deleteView = useCallback(
    async (id: string) => {
      const result = await onDeleteView(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setViews((vs) => vs.filter((v) => v.id !== id));
      setActiveFilterIds((prev) => prev.filter((x) => x !== id));
      if (splitViewId === id) setSplitViewId(null);
    },
    [onDeleteView, splitViewId]
  );

  // ─── Bubble interaction ───────────────────────────────────────
  const handleBubbleClick = (p: Person) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      return;
    }
    clickTimer.current = setTimeout(() => {
      setSelected(p);
      clickTimer.current = null;
    }, 220);
  };
  const handleBubbleDouble = (p: Person) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    setSelected(null);
    setModal(p);
  };

  // ─── Griot reorganize ─────────────────────────────────────────
  const onGriotPlan = useCallback((plan: FilterPlan) => {
    if (plan.type === "split" && plan.split) {
      const id = `griot-split-${Date.now()}`;
      const v: View = {
        id,
        label: plan.split.label,
        icon: "split",
        filters: {},
        split: { left: plan.split.left, right: plan.split.right },
        builtin: false,
        griot: true,
      };
      setViews((vs) => [...vs.filter((x) => !x.griot), v]);
      setActiveFilterIds([]);
      setSplitViewId(id);
    } else if (plan.type === "filter" && plan.filters) {
      const ids: string[] = [];
      const newViews: View[] = [];
      plan.filters.forEach((f, i) => {
        const id = `griot-filter-${Date.now()}-${i}`;
        const label = f.__label || "Custom";
        const clean: TreeFilterSpec = { ...f };
        delete (clean as { __label?: string }).__label;
        newViews.push({
          id,
          label,
          icon: "sparkle",
          filters: clean,
          split: null,
          builtin: false,
          griot: true,
        });
        ids.push(id);
      });
      setViews((vs) => [...vs.filter((x) => !x.griot), ...newViews]);
      setSplitViewId(null);
      setActiveFilterIds(ids);
    }
  }, []);

  // ─── Title + subtitle ─────────────────────────────────────────
  // familyName usually already begins with "The" (e.g. "The Powells") — don't double-prefix.
  const title = /^the\b/i.test(familyName)
    ? `${familyName} MAI Tree`
    : `The ${familyName} MAI Tree`;
  const subtitle = `${people.length + 1} members · bloom layout`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: "#F7F3EE",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes maiTreeFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes maiTreeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <MaiTreeSidebar
          views={views}
          activeFilterIds={splitViewId ? [splitViewId] : activeFilterIds}
          onToggleFilter={toggleFilter}
          onClearAll={clearAll}
          onAddMember={onAddMember}
          onSaveCurrent={onSaveCurrent}
          canSave={canSave}
          onDeleteView={deleteView}
        />
        <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 20,
              zIndex: 50,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#3D2B1F",
              }}
            >
              <TriangleAlert size={18} color="#C0704A" />
              {title}
            </div>
            <div style={{ fontSize: 13, color: "#9b8670", marginTop: 2 }}>{subtitle}</div>
          </div>

          <div
            ref={canvasRef}
            onClick={onCanvasClick}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerCancel={onCanvasPointerUp}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background:
                "radial-gradient(ellipse 85% 75% at center, #FDF9F3 0%, #F2EAD8 60%, #E6D8BE 100%)",
              overflow: "hidden",
              cursor: panStart.current ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transition: panStart.current ? "none" : "transform 0.25s ease",
                pointerEvents: "none",
              }}
            >
              <MaiTreeConnections
                people={people}
                me={me}
                positions={positions}
                show={LOCKED_SETTINGS.showConnections}
                opacity={LOCKED_SETTINGS.connOpacity / 100}
              />
              <MaiTreeSplitLabels
                split={splitFilters}
                size={size}
                positions={positions}
                people={people}
              />

              {/* YOU */}
              <MaiTreeBubble
                person={me}
                pos={positions[me.id] || { x: size.w / 2, y: size.h / 2 }}
                bubble={LOCKED_SETTINGS.bubbleSize}
                nameSize={LOCKED_SETTINGS.nameSize}
                showNames={LOCKED_SETTINGS.showNames}
                borderThick={LOCKED_SETTINGS.borderThick + 1}
                isMe
                matched
              />

              {people.map((p) => {
                const pos = positions[p.id];
                if (!pos) return null;
                const matched = matches[p.id] ?? true;
                // Re-enable pointer events on each interactive bubble (wrapper is pointer-events:none).
                return (
                  <div key={p.id} style={{ pointerEvents: "auto", position: "absolute" }}>
                    <MaiTreeBubble
                      person={p}
                      pos={pos}
                      bubble={LOCKED_SETTINGS.bubbleSize}
                      nameSize={LOCKED_SETTINGS.nameSize}
                      showNames={LOCKED_SETTINGS.showNames && matched}
                      borderThick={LOCKED_SETTINGS.borderThick}
                      selected={selected?.id === p.id}
                      matched={matched}
                      dimmed={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBubbleClick(p);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleBubbleDouble(p);
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <MaiTreeActiveChips
              views={views}
              activeFilterIds={activeFilterIds}
              onRemove={removeChip}
              splitView={splitView}
            />
            {LOCKED_SETTINGS.showLegend && <MaiTreeLegend />}
            {(pan.x !== 0 || pan.y !== 0) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetPan();
                }}
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "7px 16px",
                  borderRadius: 999,
                  background: "rgba(253,249,243,0.96)",
                  border: "1px solid rgba(192,112,74,0.3)",
                  boxShadow: "0 3px 10px rgba(61,43,31,0.12)",
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#C0704A",
                  cursor: "pointer",
                  zIndex: 40,
                }}
              >
                Re-center
              </button>
            )}
          </div>

          <MaiTreeGriotPanel familyId={familyId} onPlan={onGriotPlan} />

          {selected && !modal && (
            <MaiTreeQuickCard
              person={selected}
              pos={positions[selected.id]}
              size={size}
              onClose={() => setSelected(null)}
              onOpen={() => {
                setModal(selected);
                setSelected(null);
              }}
            />
          )}
          {modal && <MaiTreeProfileModal person={modal} onClose={() => setModal(null)} />}
        </main>
      </div>
    </div>
  );
}

// Suppress unused-import warning for borderColorFor in dev while refactoring.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepBorderHelper = borderColorFor;
