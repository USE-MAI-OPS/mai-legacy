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
        <p key={`p-${i}`} className="my-3 leading-loose">
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
        "flex w-full mb-6 chat-message-appear",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex flex-col gap-1.5 max-w-[85%]", isUser ? "items-end" : "items-start")}>
        {!isUser && (
          <span className="text-xs font-serif font-medium text-stone-500 ml-2 uppercase tracking-wider">
            The Griot
          </span>
        )}
        <div className="group relative">
          <div
            className={cn(
              "px-5 sm:px-6 py-4 sm:py-5 shadow-sm transition-all",
              isUser
                ? "bg-amber-700/90 text-amber-50 rounded-3xl rounded-tr-md text-base"
                : "bg-[#1A221C] text-stone-200 border border-[#2C3B2F] rounded-3xl rounded-tl-md font-serif text-lg leading-loose"
            )}
          >
            {isUser ? (
              <p className="leading-relaxed">{content}</p>
            ) : (
              <div className="prose prose-invert prose-stone max-w-none prose-p:my-2 prose-p:leading-loose prose-li:my-1 prose-headings:font-serif">
                {renderFormattedText(content)}
                {isStreaming && (
                  <span className="inline-block w-2 h-5 bg-amber-500/60 ml-1 animate-pulse rounded-sm align-middle" />
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
          <div className="flex flex-wrap gap-2 mt-2 ml-2">
            <span className="text-xs font-serif italic text-stone-500 self-center">
              Sources:
            </span>
            {sources.map((source) => (
              <Link
                key={source.entry_id}
                href={`/entries/${source.entry_id}`}
              >
                <Badge
                  variant="outline"
                  className="text-[11px] px-2 py-0.5 rounded-full cursor-pointer bg-[#1A221C] border-[#2C3B2F] text-stone-400 hover:text-stone-200 hover:bg-[#232F26] transition-colors shadow-sm"
                >
                  {source.title}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {timestamp && (
          <span className={cn(
            "text-[10px] font-medium uppercase tracking-widest text-stone-600 mt-1 block",
            isUser ? "text-right mr-3" : "ml-3"
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
