"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { TreeViewSpec } from "./legacy-hub-types";

interface PanelMessage {
  role: "user" | "assistant";
  text: string;
}

interface MaiTreeGroitPanelProps {
  familyId: string;
  onViewSpec: (spec: TreeViewSpec) => void;
}

const SUGGESTIONS = [
  "Show me just my family",
  "Show family and friends separately",
  "Who did I go to school with?",
];

export function MaiTreeGroitPanel({
  familyId,
  onViewSpec,
}: MaiTreeGroitPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep chat scrolled to the latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  const submit = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query || pending) return;

      setMessages((prev) => [...prev, { role: "user", text: query }]);
      setInput("");
      setPending(true);

      try {
        const res = await fetch("/api/griot/tree-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, familyId }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          toast.error(body.error ?? "Griot couldn't reorganize the view");
          // Keep the user's message so they can try again; don't touch spec.
          return;
        }

        const data = (await res.json()) as {
          viewSpec: TreeViewSpec;
          narration: string;
        };

        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.narration },
        ]);
        onViewSpec(data.viewSpec);
      } catch (err) {
        console.error("[griot-panel] request failed", err);
        toast.error("Couldn't reach the Griot");
      } finally {
        setPending(false);
      }
    },
    [familyId, onViewSpec, pending]
  );

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 right-4 z-20 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
        aria-label="Open Griot"
      >
        <Sparkles className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-20 w-80 bg-card border rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
          </div>
          <span className="text-sm font-semibold">The Griot</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setOpen(false)}
          aria-label="Close Griot"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 max-h-64">
        <div ref={scrollRef} className="p-4 space-y-3">
          {messages.length === 0 && !pending && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Ask me to reorganize the view. Try:
              </p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-left text-xs rounded-lg px-3 py-2 bg-muted/60 hover:bg-muted transition-colors text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      Griot
                    </span>
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}

          {pending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Reorganizing…
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 px-3 py-2.5 border-t"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your network..."
          className="h-8 text-xs rounded-full bg-muted border-0"
          disabled={pending}
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={pending || !input.trim()}
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
