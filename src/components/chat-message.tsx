"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";

interface Source {
  entry_id: string;
  title: string;
  chunk_text: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp?: Date;
  isStreaming?: boolean;
}

function renderFormattedText(text: string) {
  // Split by lines first for list handling
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${elements.length}`}
          className={cn(
            "my-2 space-y-1 pl-5",
            listType === "ul" ? "list-disc" : "list-decimal"
          )}
        >
          {listItems.map((item, i) => (
            <li key={i}>{formatInline(item)}</li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Unordered list item
    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(olMatch[1]);
      continue;
    }

    flushList();

    if (line.trim() === "") {
      elements.push(<br key={`br-${i}`} />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="my-1 leading-relaxed">
          {formatInline(line)}
        </p>
      );
    }
  }
  flushList();

  return elements;
}

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, and plain text
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // Bold
      parts.push(
        <strong key={idx} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italic
      parts.push(
        <em key={idx} className="italic">
          {match[3]}
        </em>
      );
    } else if (match[4]) {
      parts.push(<span key={idx}>{match[4]}</span>);
    }
    idx++;
  }

  return parts.length > 0 ? parts : [text];
}

export function ChatMessage({
  role,
  content,
  sources,
  timestamp,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some environments
    }
  };

  return (
    <div
      className={cn(
        "flex w-full mb-4 chat-message-appear",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("max-w-[80%] space-y-2", isUser ? "items-end" : "items-start")}>
        {!isUser && (
          <span className="text-xs font-medium text-muted-foreground ml-1">
            Griot
          </span>
        )}
        <div className="group relative">
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}
          >
            {isUser ? (
              <p className="leading-relaxed">{content}</p>
            ) : (
              <div className="prose-sm">
                {renderFormattedText(content)}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-foreground/60 ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
            )}
          </div>

          {/* Copy button for assistant messages */}
          {!isUser && !isStreaming && content.length > 0 && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className={cn(
                      "absolute -bottom-1 right-1 h-6 w-6 rounded-md",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {copied ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : (
                      <CopyIcon className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {copied ? "Copied!" : "Copy message"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5 ml-1">
            <span className="text-[10px] text-muted-foreground self-center">
              Sources:
            </span>
            {sources.map((source) => (
              <Link
                key={source.entry_id}
                href={`/entries/${source.entry_id}`}
              >
                <Badge
                  variant="outline"
                  className="text-[10px] cursor-pointer hover:bg-accent transition-colors"
                >
                  {source.title}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {timestamp && (
          <span className={cn(
            "text-[10px] text-muted-foreground mt-0.5 block",
            isUser ? "text-right mr-1" : "ml-1"
          )}>
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
