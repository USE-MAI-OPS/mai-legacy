"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GriotFollowUpPills } from "./griot-follow-up-pills";

interface Source {
  entry_id: string;
  title: string;
  chunk_text: string;
}

interface GriotTopicPanelProps {
  sources: Source[];
  onFollowUp: (text: string) => void;
}

export function GriotTopicPanel({ sources, onFollowUp }: GriotTopicPanelProps) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-border bg-card/50 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          On This Topic
        </span>
      </div>

      <ScrollArea className="flex-1">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-serif italic text-muted-foreground leading-relaxed">
              Ask a question to see related entries here
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sources.map((source) => (
              <Link
                key={source.entry_id}
                href={`/entries/${source.entry_id}`}
                className="block rounded-lg border border-border bg-background p-3 hover:bg-accent transition-colors group border-l-2 border-l-[#C17B54]/40"
              >
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {source.title || "Untitled Entry"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-serif">
                  {source.chunk_text}
                </p>
                <span className="text-[10px] text-primary font-medium mt-1.5 inline-block uppercase tracking-wider">
                  View Entry
                </span>
              </Link>
            ))}

            {/* Follow-up pills */}
            <div className="pt-3 border-t border-border mt-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                Continue exploring
              </p>
              <GriotFollowUpPills onSelect={onFollowUp} />
            </div>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
