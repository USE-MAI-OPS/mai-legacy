"use client";

// MAI Tree — profile modal. Ported from handoff/MAITree.jsx :488-548.

import { X } from "lucide-react";
import type { Person } from "./mai-tree-types";
import { borderColorFor, getHue, getInitials } from "./mai-tree-layout";

interface ProfileModalProps {
  person: Person | null;
  onClose: () => void;
}

export function MaiTreeProfileModal({ person, onClose }: ProfileModalProps) {
  if (!person) return null;
  const color = borderColorFor(person.group);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(61,43,31,0.28)",
        backdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        animation: "maiTreeFadeIn 0.22s ease",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxWidth: "92vw",
          maxHeight: "90vh",
          overflow: "auto",
          background: "#FDF9F3",
          borderRadius: 22,
          boxShadow: "0 30px 80px rgba(61,43,31,0.3)",
          padding: "34px 32px 24px",
          position: "relative",
          animation: "maiTreeSlideUp 0.3s cubic-bezier(0.34, 1.3, 0.64, 1)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1.5px solid ${color}`,
            background: "rgba(192,112,74,0.08)",
            color,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            padding: 0,
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              margin: "0 auto 14px",
              background: `radial-gradient(circle at 35% 30%, hsl(${getHue(person.name)} 38% 78%), hsl(${getHue(person.name)} 35% 62%))`,
              border: `3px solid ${color}`,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: 32,
              fontFamily: "'Lora', Georgia, serif",
            }}
          >
            {getInitials(person.name)}
          </div>
          <div
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#3D2B1F",
            }}
          >
            {person.name}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "3px 14px",
              borderRadius: 12,
              background: person.group === "family" ? "rgba(192,112,74,0.12)" : "rgba(26,20,16,0.08)",
              color,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            {(person.relationship || person.group).toUpperCase()}
          </div>
          <div style={{ fontSize: 14, color: "#7a6550", marginTop: 12 }}>
            {person.age != null ? `${person.age} years old` : ""}
            {person.age != null && person.occupation ? " · " : ""}
            {person.occupation ?? ""}
          </div>
          {person.location && (
            <div style={{ fontSize: 14, color: "#9b8670", marginTop: 2 }}>
              {person.location}
            </div>
          )}
          {person.bio && (
            <div
              style={{
                fontStyle: "italic",
                color: "#7a6550",
                fontSize: 14,
                marginTop: 16,
                lineHeight: 1.55,
                fontFamily: "'Lora', Georgia, serif",
              }}
            >
              &ldquo;{person.bio}&rdquo;
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(192,112,74,0.15)", margin: "22px 0 16px" }} />
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#3D2B1F",
            letterSpacing: "0.04em",
            marginBottom: 10,
          }}
        >
          Contributions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "📖", label: "Stories", v: person.stories },
            { icon: "🍴", label: "Recipes", v: person.recipes },
            { icon: "📍", label: "Lessons", v: Math.max(0, Math.floor(person.stories / 4)) },
            { icon: "🔧", label: "Skills", v: Math.max(0, Math.floor(person.stories / 6)) },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: "rgba(192,112,74,0.06)",
                border: "1px solid rgba(192,112,74,0.12)",
                borderRadius: 12,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#3D2B1F",
                  fontFamily: "'Lora', Georgia, serif",
                }}
              >
                {c.icon} {c.v}
              </div>
              <div style={{ fontSize: 12, color: "#7a6550", marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <button
          style={{
            marginTop: 20,
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "none",
            background: "#C0704A",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Add Entry About {person.first}
        </button>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: "1.5px solid rgba(192,112,74,0.25)",
              background: "transparent",
              color: "#3D2B1F",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View All Memories
          </button>
          <button
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: "1.5px solid rgba(192,112,74,0.25)",
              background: "transparent",
              color: "#3D2B1F",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            💬 Message
          </button>
        </div>
      </div>
    </div>
  );
}
