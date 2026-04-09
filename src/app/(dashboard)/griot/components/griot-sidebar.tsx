"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MessageSquareIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/griot";
import { getConversationPreview } from "@/lib/griot";

interface GriotSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string;
  conversationsLoaded: boolean;
  isDisconnected: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onNewConversation: () => void;
  onSelectConversation: (convo: ConversationSummary) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
}

function SidebarContent({
  conversations,
  activeConversationId,
  conversationsLoaded,
  isDisconnected,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: Omit<GriotSidebarProps, "mobileOpen" | "onMobileOpenChange">) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <SparklesIcon className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-bold font-serif text-foreground">
            The Griot
          </h2>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-2">
          Conversations
        </p>
      </div>

      {/* New conversation button */}
      <div className="px-3 py-3">
        <Button
          onClick={onNewConversation}
          className="w-full rounded-full gap-1.5 h-9 text-sm"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          New Conversation
        </Button>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-1">
          {!conversationsLoaded ? (
            <div className="px-3 py-8 text-center">
              <span className="text-xs text-muted-foreground font-serif italic">
                Loading memories...
              </span>
            </div>
          ) : isDisconnected ? (
            <div className="px-3 py-8 text-center">
              <span className="text-xs text-muted-foreground font-serif italic">
                Connect Supabase to save conversations
              </span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageSquareIcon className="h-5 w-5 mx-auto text-muted-foreground/50 mb-3" />
              <span className="text-sm font-serif italic text-muted-foreground">
                No conversations yet
              </span>
            </div>
          ) : (
            conversations.map((convo) => {
              const isActive = convo.id === activeConversationId;
              const preview = getConversationPreview(convo.messages);
              const updatedAt = new Date(convo.updated_at);
              return (
                <button
                  key={convo.id}
                  onClick={() => onSelectConversation(convo)}
                  className={cn(
                    "group w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all relative",
                    isActive
                      ? "bg-background text-foreground border border-border shadow-sm border-l-2 border-l-primary"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <p className="truncate font-serif text-sm leading-snug pr-6">
                    {preview}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    {updatedAt.toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    &middot;{" "}
                    {updatedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6",
                      "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
                      "text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    )}
                    onClick={(e) => onDeleteConversation(e, convo.id)}
                    title="Delete"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function GriotSidebar(props: GriotSidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={props.mobileOpen} onOpenChange={props.onMobileOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Griot Conversations</SheetTitle>
          <SidebarContent
            conversations={props.conversations}
            activeConversationId={props.activeConversationId}
            conversationsLoaded={props.conversationsLoaded}
            isDisconnected={props.isDisconnected}
            onNewConversation={() => {
              props.onNewConversation();
              props.onMobileOpenChange(false);
            }}
            onSelectConversation={(convo) => {
              props.onSelectConversation(convo);
              props.onMobileOpenChange(false);
            }}
            onDeleteConversation={props.onDeleteConversation}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-border bg-card h-full">
      <SidebarContent
        conversations={props.conversations}
        activeConversationId={props.activeConversationId}
        conversationsLoaded={props.conversationsLoaded}
        isDisconnected={props.isDisconnected}
        onNewConversation={props.onNewConversation}
        onSelectConversation={props.onSelectConversation}
        onDeleteConversation={props.onDeleteConversation}
      />
    </aside>
  );
}
