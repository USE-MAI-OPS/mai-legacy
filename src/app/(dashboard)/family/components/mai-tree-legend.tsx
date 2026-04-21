"use client";

// MAI Tree — three-dot legend (bottom-left). Port of handoff :739-762.

export function MaiTreeLegend() {
  const items = [
    { label: "Family", color: "#C0704A" },
    { label: "Friends & Connections", color: "#1A1410" },
    { label: "Other", color: "#1A1410" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        bottom: 22,
        left: 22,
        zIndex: 60,
        display: "flex",
        gap: 14,
        padding: "9px 16px",
        borderRadius: 999,
        background: "rgba(253,249,243,0.9)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(192,112,74,0.15)",
        fontFamily: "system-ui, sans-serif",
        fontSize: 11,
        color: "#5b4a3a",
      }}
    >
      {items.map((g) => (
        <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: "transparent",
              border: `2.5px solid ${g.color}`,
            }}
          />
          <span>{g.label}</span>
        </div>
      ))}
    </div>
  );
}
