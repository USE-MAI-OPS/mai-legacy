"use client";

import { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_GRIOT_MESSAGES } from "./mai-tree-mock-data";

export function MaiTreeGroitPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 right-4 z-20 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
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
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 max-h-64">
        <div className="p-4 space-y-3">
          {MOCK_GRIOT_MESSAGES.map((msg, i) => (
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
        </div>
      </ScrollArea>

      {/* Input bar (non-functional) */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t">
        <Input
          placeholder="Ask about your network..."
          className="h-8 text-xs rounded-full bg-muted border-0"
          readOnly
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          disabled
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
