"use client";

// MAI Tree — sidebar. Ported from handoff/MAITree.jsx :550-625.
// Built-ins + SAVED VIEWS (from DB) + Save current as view + Add Member.

import {
  Sparkles,
  Users,
  Heart,
  Briefcase,
  GraduationCap,
  TreePine,
  Cpu,
  Split,
  Bookmark,
  Plus,
  X,
  TriangleAlert,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { View, ViewIcon as ViewIconName } from "./mai-tree-types";

function ViewIconFor({
  name,
  size = 18,
  color,
}: {
  name: ViewIconName;
  size?: number;
  color: string;
}) {
  const common = { size, color };
  switch (name) {
    case "sparkle":
      return <Sparkles {...common} />;
    case "people":
      return <Users {...common} />;
    case "heart":
      return <Heart {...common} />;
    case "briefcase":
      return <Briefcase {...common} />;
    case "cap":
      return <GraduationCap {...common} />;
    case "tree":
      return <TreePine {...common} />;
    case "chip":
      return <Cpu {...common} />;
    case "split":
      return <Split {...common} />;
    case "bookmark":
      return <Bookmark {...common} />;
    case "plus":
      return <Plus {...common} />;
    case "warning":
      return <TriangleAlert {...common} />;
  }
}

interface SidebarProps {
  views: View[];
  activeFilterIds: string[];
  onToggleFilter: (id: string) => void;
  onClearAll: () => void;
  onAddMember: () => void;
  onSaveCurrent: () => void;
  canSave: boolean;
  onDeleteView: (id: string) => void;
}

function SidebarContent({
  views,
  activeFilterIds,
  onToggleFilter,
  onClearAll,
  onAddMember,
  onSaveCurrent,
  canSave,
  onDeleteView,
}: SidebarProps) {
  const builtins = views.filter((v) => v.builtin);
  const customs = views.filter((v) => !v.builtin && !v.griot);

  const renderItem = (v: View) => {
    const active = activeFilterIds.includes(v.id);
    return (
      <div key={v.id} style={{ position: "relative" }}>
        <button
          onClick={() => onToggleFilter(v.id)}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 10px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            background: active ? "rgba(192,112,74,0.12)" : "transparent",
            color: active ? "#C0704A" : "#3D2B1F",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 2,
            fontWeight: active ? 600 : 500,
            fontSize: 14,
            fontFamily: "system-ui, -apple-system, sans-serif",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.background = "rgba(192,112,74,0.05)";
          }}
          onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.background = "transparent";
          }}
        >
          <ViewIconFor name={v.icon} size={18} color={active ? "#C0704A" : "#7a6550"} />
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
            {v.label}
            {v.hint && (
              <div
                style={{
                  fontSize: 10,
                  color: "#9b8670",
                  marginTop: 2,
                  fontWeight: 500,
                }}
              >
                {v.hint}
              </div>
            )}
          </div>
          {v.split && (
            <span
              style={{
                fontSize: 9,
                padding: "1px 6px",
                borderRadius: 6,
                background: "rgba(138,91,184,0.12)",
                color: "#8A5BB8",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              SPLIT
            </span>
          )}
          {!v.builtin && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteView(v.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onDeleteView(v.id);
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                padding: 2,
                cursor: "pointer",
                color: "#bfad97",
                display: "inline-flex",
                alignItems: "center",
              }}
              title="Delete view"
              aria-label="Delete view"
            >
              <X size={12} />
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: "#FDF9F3",
        borderRight: "1px solid rgba(192,112,74,0.12)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        height: "100%",
      }}
    >
      <div style={{ padding: "22px 20px 14px" }}>
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 20,
            fontWeight: 700,
            color: "#3D2B1F",
          }}
        >
          Legacy Network
        </div>
        <div style={{ fontSize: 13, color: "#9b8670", marginTop: 2 }}>
          Your family tapestry
        </div>
      </div>
      <div style={{ padding: "4px 12px", flex: 1, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "12px 8px 6px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#9b8670",
              letterSpacing: "0.1em",
            }}
          >
            FILTERS
          </span>
          {activeFilterIds.length > 0 && (
            <button
              onClick={onClearAll}
              style={{
                fontSize: 10,
                color: "#C0704A",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              CLEAR
            </button>
          )}
        </div>
        {builtins.map(renderItem)}
        {customs.length > 0 && (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#9b8670",
                letterSpacing: "0.1em",
                padding: "16px 8px 6px",
              }}
            >
              SAVED VIEWS
            </div>
            {customs.map(renderItem)}
          </>
        )}
        <button
          onClick={onSaveCurrent}
          disabled={!canSave}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px",
            borderRadius: 10,
            border: "1px dashed rgba(192,112,74,0.3)",
            cursor: canSave ? "pointer" : "default",
            background: "transparent",
            color: canSave ? "#C0704A" : "#bfad97",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 10,
            fontWeight: 600,
            fontSize: 13,
            opacity: canSave ? 1 : 0.6,
          }}
        >
          <Bookmark size={16} />
          Save current as view
        </button>
      </div>
      <div style={{ padding: 16 }}>
        <Button
          onClick={onAddMember}
          style={{
            width: "100%",
            background: "#C0704A",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(192,112,74,0.35)",
            height: "auto",
          }}
        >
          <Plus size={16} />
          Add Member
        </Button>
      </div>
    </aside>
  );
}

export function MaiTreeSidebar(props: SidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 left-3 z-20 bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Legacy Network</SheetTitle>
          </SheetHeader>
          <SidebarContent {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return <SidebarContent {...props} />;
}
