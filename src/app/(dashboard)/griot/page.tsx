"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  streamGriotResponse,
  saveConversation,
  loadConversations,
  loadConversation,
  getCurrentFamilyId,
  deleteConversation,
  renameConversation,
  type ConversationSummary,
} from "@/lib/griot";
import type { ConversationMessage } from "@/types/database";

import { GriotSidebar } from "./components/griot-sidebar";
import { GriotChatArea } from "./components/griot-chat-area";
import { GriotTopicPanel } from "./components/griot-topic-panel";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------
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

// -------------------------------------------------------------------------
// Mock data for disconnected / demo mode
// -------------------------------------------------------------------------
const MOCK_RESPONSES: { content: string; sources?: Source[] }[] = [
  {
    content:
      "Based on your family's knowledge base, **Grandma Mae's cornbread recipe** has been a staple at family gatherings since the 1960s. The key difference from store-bought mixes is that she always used:\n\n- Buttermilk instead of regular milk\n- A cast iron skillet, preheated with butter\n- A pinch of sugar (though some family members debate this!)\n\nThe recipe was passed down from *her mother*, who grew up in rural Georgia. Would you like me to pull up the full step-by-step recipe?",
    sources: [
      { entry_id: "entry-1", title: "Grandma Mae's Cornbread", chunk_text: "The original cornbread recipe..." },
      { entry_id: "entry-2", title: "Family Reunion 2019 Notes", chunk_text: "At the reunion we discussed..." },
    ],
  },
  {
    content:
      "Your family has documented **several home repair skills** that have been passed down. The most detailed one is Uncle Robert's guide to fixing leaky faucets, which he learned from *Grandpa James* back in the 1970s.\n\nHe emphasizes:\n1. Always turn off the water supply first\n2. Keep a towel nearby for drips\n3. Take a photo before disassembly so you remember the order\n\nThere's also a tutorial on basic electrical work and one on patching drywall.",
    sources: [
      { entry_id: "entry-3", title: "How to Fix a Leaky Faucet", chunk_text: "Uncle Robert's plumbing guide..." },
      { entry_id: "entry-4", title: "Grandpa James - Life Skills", chunk_text: "Grandpa always said..." },
    ],
  },
  {
    content:
      "That's a great question! From what your family has shared, the **annual family reunion** tradition started in **1985** when your great-aunt Diane organized the first one in her backyard in Atlanta.\n\nSince then, it's grown to include:\n- A potluck with everyone's signature dishes\n- A storytelling circle for the elders\n- Games and activities for the kids\n- A memory wall where people post photos from the past year\n\nThe tradition of having it on the *third Saturday in July* has been consistent since 1992.",
    sources: [{ entry_id: "entry-5", title: "Family Reunion History", chunk_text: "The first reunion was..." }],
  },
];

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// -------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------
export default function GriotPage() {
  // -- State ---------------------------------------------------------------
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);

  // Connection / family state
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Conversation management
  const [conversationId, setConversationId] = useState<string>(crypto.randomUUID());
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  // Sidebar
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // -- Derived state -------------------------------------------------------
  const isEmpty = messages.length === 0;
  const isDisconnected = isConnected === false;

  const latestSources = useMemo(() => {
    // Accumulate sources across every assistant message in the
    // current conversation, deduped by entry_id. Walking messages
    // NEWEST-first and keeping the first sighting of each entry_id
    // naturally floats re-referenced entries to the top of the
    // "On This Topic" panel — so if an earlier entry gets buried
    // and then becomes relevant again in a later turn, it pops
    // back up without any manual reordering.
    const seen = new Map<string, Source>();
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== "assistant" || !m.sources) continue;
      for (const s of m.sources) {
        if (!seen.has(s.entry_id)) seen.set(s.entry_id, s);
      }
    }
    return Array.from(seen.values());
  }, [messages]);

  // -- Scroll to bottom ----------------------------------------------------
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // -- Initialize ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const fid = await getCurrentFamilyId();
        if (cancelled) return;
        if (fid) {
          setFamilyId(fid);
          setIsConnected(true);
          const convos = await loadConversations(fid);
          if (!cancelled) {
            setConversations(convos);
            setConversationsLoaded(true);
          }
        } else {
          setIsConnected(false);
          setConversationsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setIsConnected(false);
          setConversationsLoaded(true);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // -- Build history for API -----------------------------------------------
  const buildHistory = useCallback((): ConversationMessage[] => {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      sources: m.sources?.map((s) => ({
        entry_id: s.entry_id,
        chunk_text: s.chunk_text,
      })),
    }));
  }, [messages]);

  // -- Persist conversation ------------------------------------------------
  const persistConversation = useCallback(
    async (allMessages: Message[]) => {
      if (!isConnected || !familyId) return;
      const conversationMessages: ConversationMessage[] = allMessages.map(
        (m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          sources: m.sources?.map((s) => ({
            entry_id: s.entry_id,
            chunk_text: s.chunk_text,
            title: s.title,
          })),
        })
      );
      await saveConversation(conversationId, familyId, conversationMessages);
      const convos = await loadConversations(familyId);
      setConversations(convos);
    },
    [isConnected, familyId, conversationId]
  );

  // -- Send (connected) ----------------------------------------------------
  const handleSendConnected = useCallback(
    async (userContent: string) => {
      if (!familyId) return;
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: userContent,
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      const assistantId = generateId();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      try {
        const history = buildHistory();
        const { reader } = await streamGriotResponse(
          userContent,
          familyId,
          history,
          conversationId
        );
        setIsLoading(false);
        setIsStreaming(true);
        setMessages([...updatedMessages, assistantMessage]);

        const decoder = new TextDecoder();
        let rawBuffer = ""; // Only used to detect the leading __META__ line.
        let fullContent = "";
        let metaParsed = false;
        let sources: Source[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // The server prepends a single `__META__:{...}\n` line
          // carrying RAG source citations so the topic panel can
          // render them live. We need to peel that off before
          // appending to visible content.
          if (!metaParsed) {
            rawBuffer += chunk;
            if (rawBuffer.startsWith("__META__:")) {
              const newlineIdx = rawBuffer.indexOf("\n");
              if (newlineIdx === -1) {
                // Meta line still incomplete — wait for more.
                continue;
              }
              const metaJson = rawBuffer.slice("__META__:".length, newlineIdx);
              try {
                const parsed = JSON.parse(metaJson) as { sources?: Source[] };
                sources = parsed.sources;
              } catch {
                // If parse fails we just drop the meta line.
              }
              fullContent = rawBuffer.slice(newlineIdx + 1);
              rawBuffer = "";
              metaParsed = true;
            } else {
              // No meta line for this response — promote everything
              // read so far into visible content and move on.
              fullContent = rawBuffer;
              rawBuffer = "";
              metaParsed = true;
            }
          } else {
            fullContent += chunk;
          }

          setMessages((prev) => {
            const next = [...prev];
            const last = next.length - 1;
            if (last >= 0 && next[last].id === assistantId) {
              next[last] = {
                ...next[last],
                content: fullContent,
                ...(sources ? { sources } : {}),
              };
            }
            return next;
          });
        }

        setIsStreaming(false);
        const finalMessages: Message[] = [
          ...updatedMessages,
          {
            ...assistantMessage,
            content: fullContent,
            ...(sources ? { sources } : {}),
          },
        ];
        setMessages(finalMessages);
        await persistConversation(finalMessages);
      } catch (err) {
        console.error("[griot] Streaming error:", err);
        setIsLoading(false);
        setIsStreaming(false);
        const mock = MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length];
        setMessages([
          ...updatedMessages,
          {
            id: assistantId,
            role: "assistant",
            content:
              mock.content +
              "\n\n---\n*Note: Connect Supabase and OpenRouter to enable the Griot.*",
            sources: mock.sources,
            timestamp: new Date(),
          },
        ]);
        setResponseIndex((p) => p + 1);
      }
    },
    [
      familyId,
      messages,
      buildHistory,
      conversationId,
      persistConversation,
      responseIndex,
    ]
  );

  // -- Send (disconnected) -------------------------------------------------
  const handleSendDisconnected = useCallback(
    async (userContent: string) => {
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: userContent,
        timestamp: new Date(),
      };
      setMessages((p) => [...p, userMessage]);
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
      const mock = MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length];
      setMessages((p) => [
        ...p,
        {
          id: generateId(),
          role: "assistant",
          content: mock.content,
          sources: mock.sources,
          timestamp: new Date(),
        },
      ]);
      setResponseIndex((p) => p + 1);
      setIsLoading(false);
    },
    [responseIndex]
  );

  // -- Gap suggestion callback ------------------------------------------------
  const handleGapAskGriot = useCallback((prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  }, []);

  // -- Unified send --------------------------------------------------------
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isStreaming) return;
    setInput("");
    textareaRef.current?.focus();
    if (isConnected) await handleSendConnected(trimmed);
    else await handleSendDisconnected(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // -- Conversation management ---------------------------------------------
  const handleNewConversation = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setResponseIndex(0);
    setInput("");
    setIsLoading(false);
    setIsStreaming(false);
    setConversationId(crypto.randomUUID());
    textareaRef.current?.focus();
  };

  const handleSelectConversation = async (convo: ConversationSummary) => {
    if (convo.id === conversationId) return;
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setIsStreaming(false);
    setConversationId(convo.id);
    const full = await loadConversation(convo.id);
    if (full?.messages) {
      setMessages(
        full.messages.map((m, i) => ({
          id: `${convo.id}-${i}`,
          role: m.role,
          content: m.content,
          sources: m.sources?.map((s) => ({
            entry_id: s.entry_id,
            title: "",
            chunk_text: s.chunk_text,
          })),
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        }))
      );
    } else {
      setMessages([]);
    }
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    convoId: string
  ) => {
    e.stopPropagation();
    const ok = await deleteConversation(convoId);
    if (ok) {
      setConversations((p) => p.filter((c) => c.id !== convoId));
      if (convoId === conversationId) handleNewConversation();
    }
  };

  const handleRenameConversation = async (
    convoId: string,
    newTitle: string
  ) => {
    // Optimistic update so the sidebar feels instant.
    const previous = conversations;
    setConversations((p) =>
      p.map((c) =>
        c.id === convoId
          ? { ...c, title: newTitle.trim().length > 0 ? newTitle.trim() : null }
          : c
      )
    );
    const ok = await renameConversation(convoId, newTitle);
    if (!ok) {
      // Revert on failure.
      setConversations(previous);
    }
  };

  // -- Follow-up / suggestion click ----------------------------------------
  const handleSuggestionClick = useCallback((text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  }, []);

  // -- Render --------------------------------------------------------------
  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden bg-background text-foreground">
      <div className="flex h-full relative z-10">
        {/* Left: Conversation sidebar */}
        <GriotSidebar
          conversations={conversations}
          activeConversationId={conversationId}
          conversationsLoaded={conversationsLoaded}
          isDisconnected={isDisconnected}
          mobileOpen={sidebarMobileOpen}
          onMobileOpenChange={setSidebarMobileOpen}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
        />

        {/* Center: Chat area */}
        <GriotChatArea
          messages={messages}
          input={input}
          isLoading={isLoading}
          isStreaming={isStreaming}
          isEmpty={isEmpty}
          isDisconnected={isDisconnected}
          isConnected={isConnected === true}
          showSidebarToggle={true}
          onInputChange={setInput}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          onToggleSidebar={() => setSidebarMobileOpen(true)}
          onNewConversation={handleNewConversation}
          onSuggestionClick={handleSuggestionClick}
          onGapAskGriot={handleGapAskGriot}
          textareaRef={textareaRef}
          scrollRef={scrollRef}
        />

        {/* Right: Topic panel */}
        <GriotTopicPanel
          sources={latestSources}
          onFollowUp={handleSuggestionClick}
        />
      </div>
    </div>
  );
}
