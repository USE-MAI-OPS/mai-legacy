"use client";

// MAI Tree — Griot panel. Ported from handoff/MAITree.jsx :765-862, with the
// LLM call as primary (returns a FilterPlan JSON) and local planFromQuery as
// fallback on any failure. Matches the handoff's graceful-degradation behavior.

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { planFromQuery } from "./mai-tree-plan-from-query";
import type { FilterPlan } from "./mai-tree-types";

interface Message {
  role: "user" | "griot";
  text: string;
}

interface MaiTreeGriotPanelProps {
  familyId: string;
  onPlan: (plan: FilterPlan) => void;
}

const SUGGESTIONS = [
  "Show me mom's side",
  "Family vs Friends",
  "Everyone in tech",
  "Morehouse alumni",
  "Dad's side + tech",
];

export function MaiTreeGriotPanel({ familyId, onPlan }: MaiTreeGriotPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || pending) return;

      setMessages((m) => [...m, { role: "user", text: q }]);
      setInput("");
      setPending(true);

      let plan: FilterPlan | null = null;

      // Primary: the LLM endpoint.
      try {
        const res = await fetch("/api/griot/tree-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, familyId }),
        });
        if (res.ok) {
          const json = (await res.json()) as { plan?: FilterPlan };
          if (json.plan && (json.plan.type === "filter" || json.plan.type === "split")) {
            plan = json.plan;
          }
        }
      } catch {
        // fall through to local fallback
      }

      // Fallback: local keyword parser. Always produces something.
      if (!plan) {
        plan = planFromQuery(q);
      }

      setMessages((m) => [...m, { role: "griot", text: plan!.summary }]);
      onPlan(plan);
      setPending(false);
    },
    [familyId, onPlan, pending]
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Griot"
        style={{
          position: "absolute",
          bottom: 22,
          right: 22,
          zIndex: 100,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#C0704A",
          color: "#fff",
          border: "none",
          boxShadow: "0 8px 22px rgba(192,112,74,0.42)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          fontSize: 22,
          fontFamily: "'Lora', Georgia, serif",
        }}
      >
        ✦
      </button>
    );
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          right: 22,
          bottom: 86,
          zIndex: 110,
          width: 340,
          maxHeight: 460,
          background: "#FDF9F3",
          borderRadius: 18,
          border: "1px solid rgba(192,112,74,0.2)",
          boxShadow: "0 18px 48px rgba(61,43,31,0.18)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          animation: "maiTreeSlideUp 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(192,112,74,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#C0704A", fontSize: 16 }}>✦</span>
          <span
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#3D2B1F",
            }}
          >
            Griot
          </span>
          <span style={{ fontSize: 11, color: "#9b8670", flex: 1 }}>
            — ask me to reorganize
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close Griot"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#9b8670",
              padding: 2,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            padding: "12px 16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {messages.length === 0 && !pending && (
            <>
              <div style={{ fontSize: 12, color: "#9b8670", marginBottom: 4 }}>
                Try one of these:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(192,112,74,0.08)",
                      border: "1px solid rgba(192,112,74,0.2)",
                      color: "#C0704A",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius: 14,
                background: m.role === "user" ? "#3D2B1F" : "rgba(192,112,74,0.08)",
                color: m.role === "user" ? "#fff" : "#3D2B1F",
                border: m.role === "griot" ? "1px solid rgba(192,112,74,0.18)" : "none",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              {m.role === "griot" && (
                <span style={{ color: "#C0704A", marginRight: 4 }}>✦</span>
              )}
              {m.text}
            </div>
          ))}
          {pending && (
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius: 14,
                background: "rgba(192,112,74,0.08)",
                border: "1px solid rgba(192,112,74,0.18)",
                color: "#9b8670",
                fontSize: 13,
                fontStyle: "italic",
              }}
            >
              <span style={{ color: "#C0704A", marginRight: 4 }}>✦</span>
              Reorganizing…
            </div>
          )}
        </div>

        <div
          style={{
            padding: 12,
            borderTop: "1px solid rgba(192,112,74,0.15)",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            placeholder="Ask about your network..."
            disabled={pending}
            style={{
              flex: 1,
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid rgba(192,112,74,0.2)",
              background: "#fff",
              color: "#3D2B1F",
              fontSize: 13,
              outline: "none",
              fontFamily: "system-ui, sans-serif",
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={pending || !input.trim()}
            aria-label="Send"
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              border: "none",
              background: "#C0704A",
              color: "#fff",
              cursor: pending || !input.trim() ? "default" : "pointer",
              opacity: pending || !input.trim() ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      <button
        onClick={() => setOpen(false)}
        aria-label="Close Griot"
        style={{
          position: "absolute",
          bottom: 22,
          right: 22,
          zIndex: 100,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#C0704A",
          color: "#fff",
          border: "none",
          boxShadow: "0 8px 22px rgba(192,112,74,0.42)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          fontSize: 22,
          fontFamily: "'Lora', Georgia, serif",
        }}
      >
        ✦
      </button>
    </>
  );
}
