"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/chat-message";
import {
  AlertTriangleIcon,
  MicIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SendHorizontalIcon,
  SparklesIcon,
} from "lucide-react";
import { GriotFollowUpPills } from "./griot-follow-up-pills";
import { GriotGapSuggestions } from "@/components/griot-gap-suggestions";

interface Source {
  entry_id: string;
  title: string;
  chunk_text: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface GriotChatAreaProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  isStreaming: boolean;
  isEmpty: boolean;
  isDisconnected: boolean;
  isConnected: boolean;
  showSidebarToggle: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggleSidebar: () => void;
  onNewConversation: () => void;
  onSuggestionClick: (text: string) => void;
  onGapAskGriot: (prompt: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function GriotChatArea({
  messages,
  input,
  isLoading,
  isStreaming,
  isEmpty,
  isDisconnected,
  isConnected,
  showSidebarToggle,
  onInputChange,
  onSend,
  onKeyDown,
  onToggleSidebar,
  onNewConversation,
  onSuggestionClick,
  onGapAskGriot,
  textareaRef,
  scrollRef,
}: GriotChatAreaProps) {
  const lastAssistantIdx = messages.length > 0
    ? messages.reduce((acc, m, i) => (m.role === "assistant" ? i : acc), -1)
    : -1;

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-transparent">
      {/* Demo banner */}
      {isDisconnected && (
        <div className="flex items-center gap-2 px-6 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
          <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="text-sm font-serif italic text-amber-700">
            Demo mode — connect Supabase for real AI responses
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onToggleSidebar}
              title="Show sidebar"
            >
              <PanelLeftOpenIcon className="h-4 w-4" />
            </Button>
          )}
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <SparklesIcon className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif text-foreground">
              The Griot
            </h1>
            <p className="text-xs text-muted-foreground font-serif italic">
              Your family&apos;s AI knowledge keeper
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNewConversation}
          className="gap-1.5 text-sm h-8 rounded-full px-4"
        >
          <PlusIcon className="size-3.5" />
          New
        </Button>
      </div>

      {/* Messages / empty state */}
      <div
        className="flex-1 min-h-0 overflow-y-auto scroll-smooth"
        ref={scrollRef}
      >
        {isEmpty && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="max-w-md w-full">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mx-auto mb-6">
                <SparklesIcon className="size-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3 font-serif text-foreground">
                Ask the Griot
              </h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-sm mx-auto font-serif italic">
                Your family&apos;s AI knowledge keeper. Ask anything — stories,
                recipes, skills, traditions — and the Griot will search your
                family&apos;s documented wisdom.
              </p>
              <div className="grid gap-2 max-w-sm mx-auto">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Try asking
                </p>
                {[
                  "What's Grandma Mae's cornbread recipe?",
                  "What home repair skills has our family documented?",
                  "When did our family reunion tradition start?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => onSuggestionClick(suggestion)}
                    className="text-left text-sm px-4 py-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 text-foreground transition-all font-serif italic hover:-translate-y-0.5"
                  >
                    &ldquo;{suggestion}&rdquo;
                  </button>
                ))}
              </div>

              {isConnected && (
                <div className="mt-8 max-w-sm mx-auto text-left">
                  <GriotGapSuggestions
                    onAskGriot={onGapAskGriot}
                    showHeading
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            {messages.map((message, idx) => (
              <div key={message.id}>
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                  timestamp={message.timestamp}
                  isStreaming={
                    isStreaming &&
                    message.id === messages[messages.length - 1]?.id &&
                    message.role === "assistant"
                  }
                />
                {/* Follow-up pills after last assistant message */}
                {idx === lastAssistantIdx &&
                  message.role === "assistant" &&
                  !isStreaming &&
                  !isLoading &&
                  message.content.length > 0 && (
                    <GriotFollowUpPills onSelect={onSuggestionClick} />
                  )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%] space-y-1.5">
                  <span className="text-[10px] font-serif font-medium text-muted-foreground ml-2 uppercase tracking-wider">
                    The Griot is thinking...
                  </span>
                  <div className="rounded-2xl rounded-bl-sm bg-muted border border-border px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
                      <span className="size-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
                      <span className="size-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 sm:px-6 pb-4 pt-3 border-t border-border bg-background relative z-20">
        <div className="max-w-2xl mx-auto">
          <Card className="flex items-end gap-2 p-1 bg-background border border-border rounded-2xl shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/30">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask the Griot about your family's knowledge..."
              className="min-h-[44px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground placeholder:font-serif placeholder:italic font-serif leading-relaxed"
              rows={1}
            />
            <div className="flex items-center gap-1 m-1">
              {/* Microphone placeholder */}
              <Button
                variant="ghost"
                size="icon"
                disabled
                className="shrink-0 size-9 rounded-full text-muted-foreground"
                title="Voice input (coming soon)"
              >
                <MicIcon className="size-4" />
              </Button>
              {/* Send */}
              <Button
                size="icon"
                onClick={onSend}
                disabled={!input.trim() || isLoading || isStreaming}
                className="shrink-0 size-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-50 transition-all"
              >
                <SendHorizontalIcon className="size-4 ml-0.5" />
              </Button>
            </div>
          </Card>
          <p className="text-[11px] text-muted-foreground text-center mt-3 font-serif italic px-4">
            The Griot draws from your documented entries to answer questions.
            Responses are AI-generated — verify important details with family.
          </p>
        </div>
      </div>
    </div>
  );
}
