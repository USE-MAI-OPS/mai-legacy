"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { MessageCircle, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConversationList } from "./conversation-list";
import { NewMessageDialog } from "./new-message-dialog";
import type { ConversationPreview } from "../actions";

interface MessagesSidebarProps {
  conversations: ConversationPreview[];
  activeId: string | null;
  searchQuery: string;
  loading: boolean;
  onSelect: (conv: ConversationPreview) => void;
  onSearchChange: (q: string) => void;
  onConversationCreated: (conversationId: string, memberName: string) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

function SidebarContent({
  conversations,
  activeId,
  searchQuery,
  loading,
  onSelect,
  onSearchChange,
  onConversationCreated,
}: Omit<MessagesSidebarProps, "mobileOpen" | "onMobileOpenChange">) {
  const filtered = searchQuery
    ? conversations.filter((c) =>
        c.otherParticipantName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold font-serif text-foreground">
            Messages
          </h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-8 text-xs rounded-full bg-muted border-0"
          />
        </div>
      </div>

      {/* New message button */}
      <div className="px-3 py-3">
        <NewMessageDialog onConversationCreated={onConversationCreated} />
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-xs text-muted-foreground font-serif italic">
              Loading conversations...
            </span>
          </div>
        ) : (
          <div className="px-2 pb-2">
            <ConversationList
              conversations={filtered}
              activeId={activeId}
              onSelect={onSelect}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function MessagesSidebar(props: MessagesSidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={props.mobileOpen} onOpenChange={props.onMobileOpenChange}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Conversations</SheetTitle>
          <SidebarContent
            conversations={props.conversations}
            activeId={props.activeId}
            searchQuery={props.searchQuery}
            loading={props.loading}
            onSelect={(conv) => {
              props.onSelect(conv);
              props.onMobileOpenChange(false);
            }}
            onSearchChange={props.onSearchChange}
            onConversationCreated={(id, name) => {
              props.onConversationCreated(id, name);
              props.onMobileOpenChange(false);
            }}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex w-80 shrink-0 flex-col border-r border-border bg-card h-full">
      <SidebarContent
        conversations={props.conversations}
        activeId={props.activeId}
        searchQuery={props.searchQuery}
        loading={props.loading}
        onSelect={props.onSelect}
        onSearchChange={props.onSearchChange}
        onConversationCreated={props.onConversationCreated}
      />
    </aside>
  );
}
