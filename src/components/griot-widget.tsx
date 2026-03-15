"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, Send, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamGriotResponse, getCurrentFamilyId } from "@/lib/griot";
import type { ConversationMessage } from "@/types/database";

// ---------------------------------------------------------------------------
// Example prompts
// ---------------------------------------------------------------------------
const EXAMPLE_PROMPTS = [
  "What family recipes do we have?",
  "Tell me about our family history",
  "What skills has our family preserved?",
  "What traditions does our family keep?",
  "Who are the key members of our family?",
  "What lessons have been passed down?",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function GriotWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const responseAreaRef = useRef<HTMLDivElement>(null);

  // Resolve family ID on mount
  useEffect(() => {
    getCurrentFamilyId().then(setFamilyId);
  }, []);

  // Auto-scroll response area
  useEffect(() => {
    if (responseAreaRef.current) {
      responseAreaRef.current.scrollTop = responseAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !familyId) return;

      const userMessage: ChatMessage = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setError(null);
      setIsStreaming(true);

      // Build history for context
      const history: ConversationMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
      }));

      try {
        const { reader } = await streamGriotResponse(
          text.trim(),
          familyId,
          history
        );

        // Add empty assistant message to fill via streaming
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + chunk,
                };
              }
              return updated;
            });
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get a response."
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, familyId, messages]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="rounded-2xl overflow-hidden border bg-card shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[360px]">
        {/* Left: Title + Input */}
        <div className="lg:col-span-2 p-8 md:p-10 flex flex-col justify-between lg:border-r border-border/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <p className="text-base uppercase tracking-widest text-orange-600 dark:text-orange-400 font-semibold">
                The Griot
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-3">
              Ask your family&apos;s AI anything.
            </h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              The Griot knows your family&apos;s stories, recipes, skills, and
              wisdom. Ask a question and get an answer drawn from your collective
              knowledge.
            </p>
          </div>

          <div className="space-y-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Griot something..."
                disabled={isStreaming || !familyId}
                className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 disabled:opacity-50 transition-all"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isStreaming || !input.trim() || !familyId}
                className="rounded-full h-12 w-12 shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full text-base h-12"
              asChild
            >
              <Link href="/griot">
                <MessageCircle className="mr-2 h-5 w-5" />
                Start Full Conversation
              </Link>
            </Button>
          </div>
        </div>

        {/* Right: Example prompts / Chat responses */}
        <div className="lg:col-span-3 flex flex-col bg-muted/30">
          {!hasMessages ? (
            /* Example prompts grid */
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-4">
                Try asking
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={isStreaming || !familyId}
                    className="text-left px-4 py-3.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 hover:border-primary/30 transition-all text-sm text-foreground/80 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-orange-500 mr-1.5">&ldquo;</span>
                    {prompt}
                    <span className="text-orange-500 ml-0.5">&rdquo;</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat messages */
            <div
              ref={responseAreaRef}
              className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[360px] space-y-4"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-orange-100 dark:bg-orange-900/30 text-foreground rounded-bl-sm"
                        : "bg-card border border-border/50 text-foreground rounded-br-sm shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" && msg.content === "" ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs">Thinking...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-br-sm">
                    {error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer link to full griot */}
          {hasMessages && (
            <div className="border-t border-border/30 px-6 py-3 flex justify-end">
              <Link
                href="/griot"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                Continue in full chat
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
