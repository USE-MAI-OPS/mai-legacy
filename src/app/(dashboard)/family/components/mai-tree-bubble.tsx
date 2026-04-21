"use client";

// MAI Tree — bubble component. Ported from handoff/MAITree.jsx :349-413.

import { memo } from "react";
import type { Person } from "./mai-tree-types";
import { borderColorFor, getHue, getInitials } from "./mai-tree-layout";

interface BubbleProps {
  person: Person;
  pos: { x: number; y: number } | undefined;
  bubble: number;
  nameSize: number;
  showNames: boolean;
  borderThick: number;
  isMe?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  matched?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const MaiTreeBubble = memo(function MaiTreeBubble({
  person,
  pos,
  bubble,
  nameSize,
  showNames,
  borderThick,
  isMe = false,
  selected = false,
  dimmed = false,
  matched = true,
  onClick,
  onDoubleClick,
}: BubbleProps) {
  const initials = getInitials(person.name);
  const hue = getHue(person.name);
  const size = isMe ? bubble * 1.35 : bubble;
  const isHidden = !matched;
  const groupColor = borderColorFor(person.group);

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        position: "absolute",
        left: (pos?.x ?? 0) - size / 2,
        top: (pos?.y ?? 0) - size / 2,
        width: size,
        height: size,
        opacity: isHidden ? 0 : dimmed ? 0.25 : 1,
        pointerEvents: isHidden ? "none" : "auto",
        cursor: isMe ? "default" : "pointer",
        zIndex: selected ? 40 : isMe ? 30 : 20,
        transition: "opacity 0.5s ease, transform 0.3s ease",
        transform: selected ? "scale(1.06)" : "scale(1)",
        willChange: "left, top",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, hsl(${hue} 38% 78%), hsl(${hue} 35% 60%))`,
          border: isMe ? "none" : `${borderThick}px solid ${groupColor}`,
          boxShadow: selected
            ? `0 14px 36px rgba(61,43,31,0.28), 0 0 0 6px ${groupColor}22`
            : `0 4px 14px rgba(61,43,31,0.14)`,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontFamily: "'Lora', Georgia, serif",
          fontWeight: 600,
          fontSize: Math.max(11, size * 0.3),
          letterSpacing: "0.02em",
          textShadow: "0 1px 2px rgba(0,0,0,0.18)",
          userSelect: "none",
        }}
      >
        {initials}
      </div>
      {showNames && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            marginTop: 10,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: nameSize,
            fontWeight: isMe ? 700 : 500,
            color: isMe ? "#3D2B1F" : "#5b4a3a",
            whiteSpace: "nowrap",
            fontFamily: "system-ui, -apple-system, sans-serif",
            textAlign: "center",
            lineHeight: 1.15,
            textShadow: "0 1px 2px rgba(253,249,243,0.9)",
          }}
        >
          <div>{isMe ? "You" : person.first}</div>
        </div>
      )}
    </div>
  );
});
