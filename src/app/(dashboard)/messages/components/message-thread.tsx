"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { sendMessage, type Message } from "../actions";
import { cn } from "@/lib/utils";
import {
  MessageEntryCard,
  detectEntryInMessage,
} from "./message-entry-card";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

interface MessageThreadProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  otherName: string;
  onMessageSent?: () => void;
}

export function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  otherName,
  onMessageSent,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on load and when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend() {
    const content = input.trim();
    if (!content) return;

    // Optimistic update
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: currentUserId,
      senderName: "You",
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    startTransition(async () => {
      const result = await sendMessage(conversationId, content);
      if (result.error) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setInput(content);
      } else {
        onMessageSent?.();
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Conversation header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {getInitials(otherName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-sm font-semibold">{otherName}</h2>
          <p className="text-[10px] text-muted-foreground">Direct message</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm font-serif italic">
              No messages yet. Start the conversation with {otherName}!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUserId;
            const showAvatar =
              idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
            const entryMatch = detectEntryInMessage(msg.content);

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                {!isMe && showAvatar ? (
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarFallback className="text-xs">
                      {getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                ) : !isMe ? (
                  <div className="w-8 shrink-0" />
                ) : null}

                <div
                  className={cn(
                    "max-w-[75%] space-y-1",
                    isMe ? "items-end" : "items-start"
                  )}
                >
                  {showAvatar && (
                    <p
                      className={cn(
                        "text-xs text-muted-foreground",
                        isMe ? "text-right" : "text-left"
                      )}
                    >
                      {isMe ? "You" : msg.senderName}
                    </p>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm leading-relaxed break-words",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                  {/* Inline entry card (mock detection) */}
                  {entryMatch && !isMe && (
                    <MessageEntryCard {...entryMatch} />
                  )}
                  <p
                    className={cn(
                      "text-[10px] text-muted-foreground",
                      isMe ? "text-right" : "text-left"
                    )}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-border bg-background px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherName}...`}
            disabled={isPending}
            className="flex-1 rounded-full"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            className="rounded-full"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
