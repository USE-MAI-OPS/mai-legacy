"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  getConversations,
  getMessages,
  getConversationInfo,
  getCurrentUserId,
  type ConversationPreview,
  type Message,
} from "./actions";
import { MessagesSidebar } from "./components/messages-sidebar";
import { MessageThread } from "./components/message-thread";
import { MessagesSharedPanel } from "./components/messages-shared-panel";
import { NewMessageDialog } from "./components/new-message-dialog";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [activeOtherName, setActiveOtherName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // -- Init: load conversations + currentUserId ----------------------------
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [convos, userId] = await Promise.all([
          getConversations(),
          getCurrentUserId(),
        ]);
        if (cancelled) return;
        setConversations(convos);
        setCurrentUserId(userId);

        // Check URL for ?conversation= param
        const params = new URLSearchParams(window.location.search);
        const convId = params.get("conversation");
        if (convId) {
          const match = convos.find((c) => c.id === convId);
          if (match) {
            setActiveConversationId(match.id);
            setActiveOtherName(match.otherParticipantName);
          }
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // -- Load messages when active conversation changes ----------------------
  useEffect(() => {
    if (!activeConversationId) {
      setActiveMessages([]);
      return;
    }

    let cancelled = false;
    async function loadMessages() {
      setMessagesLoading(true);
      try {
        const [msgs, info] = await Promise.all([
          getMessages(activeConversationId!),
          getConversationInfo(activeConversationId!),
        ]);
        if (cancelled) return;
        setActiveMessages(msgs);
        if (info) setActiveOtherName(info.otherName);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }
    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  // -- Handlers ------------------------------------------------------------
  const handleSelectConversation = useCallback(
    (conv: ConversationPreview) => {
      setActiveConversationId(conv.id);
      setActiveOtherName(conv.otherParticipantName);
      window.history.replaceState(null, "", `/messages?conversation=${conv.id}`);
    },
    []
  );

  const handleConversationCreated = useCallback(
    async (conversationId: string, memberName: string) => {
      setActiveConversationId(conversationId);
      setActiveOtherName(memberName);
      window.history.replaceState(null, "", `/messages?conversation=${conversationId}`);
      // Refresh conversation list
      const convos = await getConversations();
      setConversations(convos);
    },
    []
  );

  const handleMessageSent = useCallback(async () => {
    // Refresh conversation list to update last message preview
    const convos = await getConversations();
    setConversations(convos);
  }, []);

  // -- Render --------------------------------------------------------------
  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        {/* Left: Conversations sidebar */}
        <MessagesSidebar
          conversations={conversations}
          activeId={activeConversationId}
          searchQuery={searchQuery}
          loading={loading}
          onSelect={handleSelectConversation}
          onSearchChange={setSearchQuery}
          onConversationCreated={handleConversationCreated}
          mobileOpen={sidebarMobileOpen}
          onMobileOpenChange={setSidebarMobileOpen}
        />

        {/* Center: Message thread or empty state */}
        {activeConversationId && currentUserId && !messagesLoading ? (
          <MessageThread
            key={activeConversationId}
            conversationId={activeConversationId}
            initialMessages={activeMessages}
            currentUserId={currentUserId}
            otherName={activeOtherName}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 min-w-0">
            {messagesLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground font-serif italic">
                  Loading conversation...
                </p>
              </div>
            ) : (
              <>
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-6">
                  <MessageCircle className="size-8" />
                </div>
                <h2 className="text-xl font-semibold font-serif mb-2">
                  {loading ? "Loading..." : "Your Messages"}
                </h2>
                <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                  {conversations.length === 0
                    ? "Start a conversation with a family member to share thoughts, coordinate plans, or just say hello."
                    : "Select a conversation from the sidebar to view messages."}
                </p>
                <NewMessageDialog
                  onConversationCreated={handleConversationCreated}
                />
              </>
            )}
          </div>
        )}

        {/* Right: Shared entries panel */}
        <MessagesSharedPanel
          otherName={activeOtherName}
          conversationId={activeConversationId}
        />
      </div>
    </div>
  );
}
