"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "@/components/chat-message";
import {
  AlertTriangleIcon,
  MessageSquareIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SendHorizontalIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import {
  streamGriotResponse,
  saveConversation,
  loadConversations,
  loadConversation,
  getCurrentFamilyId,
  getConversationPreview,
  deleteConversation,
  type ConversationSummary,
} from "@/lib/griot";
import type { ConversationMessage } from "@/types/database";
import { cn } from "@/lib/utils";

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
  const [conversationId, setConversationId] = useState<string>(generateId());
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
        let fullContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            const last = next.length - 1;
            if (last >= 0 && next[last].id === assistantId) {
              next[last] = { ...next[last], content: fullContent };
            }
            return next;
          });
        }

        setIsStreaming(false);
        const finalMessages: Message[] = [
          ...updatedMessages,
          { ...assistantMessage, content: fullContent },
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
    setConversationId(generateId());
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

  // -- Derived state -------------------------------------------------------
  const isEmpty = messages.length === 0;
  const isDisconnected = isConnected === false;

  return (
    <div className="relative h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden bg-background">
      <div className="flex h-full">
        {/* -------- Conversation sidebar -------- */}
        {showSidebar && (
          <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-muted/30">
            <div className="flex items-center justify-between px-3 py-3 border-b">
              <span className="text-xs font-medium text-muted-foreground">
                Conversations
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={handleNewConversation}
                  title="New conversation"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSidebar(false)}
                  title="Hide sidebar"
                >
                  <PanelLeftCloseIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-0.5">
                {!conversationsLoaded ? (
                  <div className="px-3 py-8 text-center">
                    <span className="text-[10px] text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                ) : isDisconnected ? (
                  <div className="px-3 py-8 text-center">
                    <span className="text-[10px] text-muted-foreground">
                      Connect Supabase to save conversations
                    </span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <MessageSquareIcon className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                    <span className="text-[10px] text-muted-foreground">
                      No conversations yet
                    </span>
                  </div>
                ) : (
                  conversations.map((convo) => {
                    const isActive = convo.id === conversationId;
                    const preview = getConversationPreview(convo.messages);
                    const updatedAt = new Date(convo.updated_at);
                    return (
                      <button
                        key={convo.id}
                        onClick={() => handleSelectConversation(convo)}
                        className={cn(
                          "group w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors relative",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50 text-muted-foreground"
                        )}
                      >
                        <p className="truncate font-medium">{preview}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {updatedAt.toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          {updatedAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5",
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            "text-muted-foreground hover:text-destructive hover:bg-transparent"
                          )}
                          onClick={(e) =>
                            handleDeleteConversation(e, convo.id)
                          }
                          title="Delete"
                        >
                          <Trash2Icon className="h-3 w-3" />
                        </Button>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        )}

        {/* -------- Main chat area -------- */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Demo banner */}
          {isDisconnected && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 shrink-0">
              <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                Demo mode — connect Supabase for real AI responses
              </span>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-background shrink-0">
            <div className="flex items-center gap-2.5">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSidebar(true)}
                  title="Show sidebar"
                >
                  <PanelLeftOpenIcon className="h-4 w-4" />
                </Button>
              )}
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <SparklesIcon className="size-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">The Griot</h1>
                <p className="text-[10px] text-muted-foreground">
                  Your family&apos;s AI knowledge keeper
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewConversation}
              className="gap-1.5 text-xs h-7"
            >
              <PlusIcon className="size-3.5" />
              New
            </Button>
          </div>

          {/* Messages / empty state */}
          <div
            className="flex-1 min-h-0 overflow-y-auto"
            ref={scrollRef}
          >
            {isEmpty && !isLoading ? (
              /* ---- Empty state ---- */
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="max-w-lg">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-6">
                    <SparklesIcon className="size-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Ask the Griot</h2>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-md mx-auto">
                    Your family&apos;s AI knowledge keeper. Ask anything —
                    stories, recipes, skills, traditions — and the Griot will
                    search your family&apos;s documented wisdom.
                  </p>
                  <div className="grid gap-2 max-w-sm mx-auto">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
                      Try asking
                    </p>
                    {[
                      "What's Grandma Mae's cornbread recipe?",
                      "What home repair skills has our family documented?",
                      "When did our family reunion tradition start?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          textareaRef.current?.focus();
                        }}
                        className="text-left text-sm px-4 py-2.5 rounded-xl bg-muted hover:bg-accent border border-border text-foreground transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ---- Messages ---- */
              <div className="max-w-2xl mx-auto px-4 py-6 space-y-1">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
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
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[80%] space-y-2">
                      <span className="text-xs font-medium text-muted-foreground ml-1">
                        Griot
                      </span>
                      <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 px-4 pb-4 pt-2 border-t bg-background">
            <div className="max-w-2xl mx-auto">
              <Card className="flex items-end gap-2 p-2.5">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the Griot about your family's knowledge..."
                  className="min-h-[40px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent p-2 text-sm"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || isStreaming}
                  className="shrink-0 size-8 rounded-lg"
                >
                  <SendHorizontalIcon className="size-4" />
                </Button>
              </Card>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                The Griot draws from your family&apos;s documented knowledge to
                answer questions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
