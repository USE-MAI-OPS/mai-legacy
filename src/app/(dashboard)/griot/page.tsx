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
  const [conversationId, setConversationId] = useState<string>(crypto.randomUUID());
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
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
            // Auto-show sidebar only when there are existing conversations
            if (convos.length > 0) setShowSidebar(true);
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

  // -- Derived state -------------------------------------------------------
  const isEmpty = messages.length === 0;
  const isDisconnected = isConnected === false;

  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden bg-[#161b17] text-stone-200">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-screen pointer-events-none" />
      <div className="flex h-full relative z-10">
        {/* -------- Conversation sidebar -------- */}
        {showSidebar && (
          <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[#2C3B2F] bg-[#111512]">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#2C3B2F]">
              <span className="text-sm font-medium text-stone-400 font-serif tracking-wider uppercase">
                Conversations
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-stone-400 hover:text-stone-200 hover:bg-[#1A221C]"
                  onClick={handleNewConversation}
                  title="New conversation"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-stone-400 hover:text-stone-200 hover:bg-[#1A221C]"
                  onClick={() => setShowSidebar(false)}
                  title="Hide sidebar"
                >
                  <PanelLeftCloseIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-3 space-y-1">
                {!conversationsLoaded ? (
                  <div className="px-3 py-8 text-center">
                    <span className="text-xs text-stone-500 font-serif italic">
                      Loading memories...
                    </span>
                  </div>
                ) : isDisconnected ? (
                  <div className="px-3 py-8 text-center">
                    <span className="text-xs text-stone-500 font-serif italic">
                      Connect Supabase to save conversations
                    </span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <MessageSquareIcon className="h-6 w-6 mx-auto text-stone-600 mb-3 opacity-50" />
                    <span className="text-sm font-serif italic text-stone-500">
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
                          "group w-full text-left px-3 py-3 rounded-lg text-sm transition-all relative border",
                          isActive
                            ? "bg-[#1A221C] text-stone-200 border-[#3D5240] shadow-sm"
                            : "hover:bg-[#1A221C]/50 text-stone-400 border-transparent"
                        )}
                      >
                        <p className="truncate font-serif leading-snug">{preview}</p>
                        <p className="text-[11px] text-stone-500 mt-1.5 uppercase tracking-wider">
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
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            "text-stone-500 hover:text-red-400 hover:bg-red-400/10"
                          )}
                          onClick={(e) =>
                            handleDeleteConversation(e, convo.id)
                          }
                          title="Delete"
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
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
        <div className="flex flex-col flex-1 min-w-0 bg-transparent">
          {/* Demo banner */}
          {isDisconnected && (
            <div className="flex items-center gap-2 px-6 py-2 bg-amber-950/40 border-b border-amber-900/50 shrink-0">
              <AlertTriangleIcon className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm font-serif italic text-amber-200/90">
                Demo mode — connect Supabase for real AI responses
              </span>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C3B2F] bg-[#111512]/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-8 w-8 text-stone-400 hover:text-stone-200 hover:bg-[#1A221C]"
                  onClick={() => setShowSidebar(true)}
                  title="Show sidebar"
                >
                  <PanelLeftOpenIcon className="h-4 w-4" />
                </Button>
              )}
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-900/20 border border-amber-500/20 shadow-[0_0_15px_rgba(217,119,6,0.15)]">
                <SparklesIcon className="size-5 text-amber-500/80" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-serif text-amber-50 tracking-wide">The Griot</h1>
                <p className="text-xs text-stone-400 font-serif italic mt-0.5">
                  Your family's AI knowledge keeper
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewConversation}
              className="gap-2 text-sm h-9 bg-transparent border-[#3D5240] text-stone-300 hover:bg-[#1A221C] hover:text-stone-100 rounded-full px-4"
            >
              <PlusIcon className="size-4" />
              New
            </Button>
          </div>

          {/* Messages / empty state */}
          <div
            className="flex-1 min-h-0 overflow-y-auto scroll-smooth"
            ref={scrollRef}
          >
            {isEmpty && !isLoading ? (
              /* ---- Empty state ---- */
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="max-w-xl w-full">
                  <div className="flex size-24 items-center justify-center rounded-full bg-amber-900/20 border border-amber-500/20 mx-auto mb-8 shadow-[0_0_30px_rgba(217,119,6,0.1)]">
                    <SparklesIcon className="size-10 text-amber-500/80" />
                  </div>
                  <h2 className="text-4xl font-bold mb-4 font-serif text-amber-50 tracking-tight">Ask the Griot</h2>
                  <p className="text-stone-400 text-lg mb-12 leading-relaxed max-w-md mx-auto font-serif italic">
                    Your family's AI knowledge keeper. Ask anything —
                    stories, recipes, skills, traditions — and the Griot will
                    search your family's documented wisdom.
                  </p>
                  <div className="grid gap-3 max-w-md mx-auto">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
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
                        className="text-left text-base px-6 py-4 rounded-2xl bg-[#1A221C]/60 hover:bg-[#232F26] border border-[#2C3B2F] text-stone-300 transition-all shadow-sm font-serif italic hover:shadow-md hover:-translate-y-0.5"
                      >
                        "{suggestion}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ---- Messages ---- */
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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
                    <div className="max-w-[85%] space-y-2">
                      <span className="text-xs font-serif font-medium text-stone-500 ml-2 uppercase tracking-wider">
                        The Griot is thinking...
                      </span>
                      <div className="rounded-2xl rounded-bl-sm bg-[#1A221C] border border-[#2C3B2F] px-6 py-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-amber-600/60 animate-bounce [animation-delay:0ms]" />
                          <span className="size-2 rounded-full bg-amber-600/60 animate-bounce [animation-delay:150ms]" />
                          <span className="size-2 rounded-full bg-amber-600/60 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 px-4 sm:px-6 pb-6 pt-4 border-t border-[#2C3B2F] bg-gradient-to-t from-[#111512] via-[#111512] to-transparent relative z-20">
            <div className="max-w-3xl mx-auto">
              <Card className="flex items-end gap-2 p-1.5 bg-[#1A221C]/90 border border-[#3D5240] rounded-3xl shadow-xl backdrop-blur-md transition-all focus-within:ring-1 focus-within:ring-amber-500/50 focus-within:border-amber-500/50">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the Griot about your family's knowledge..."
                  className="min-h-[52px] max-h-[160px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent px-5 py-4 text-lg text-stone-100 placeholder:text-stone-500 placeholder:font-serif placeholder:italic font-serif leading-relaxed"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || isStreaming}
                  className="shrink-0 size-11 rounded-full bg-amber-700 hover:bg-amber-600 text-white m-1.5 shadow-md border-b-2 border-amber-900/50 disabled:opacity-50 disabled:bg-stone-700 disabled:border-stone-800 disabled:text-stone-400 transition-all"
                >
                  <SendHorizontalIcon className="size-5 ml-0.5" />
                </Button>
              </Card>
              <p className="text-xs text-stone-500 text-center mt-4 font-serif italic px-4">
                The Griot draws from your documented entries to answer questions. Responses are AI-generated — verify important details with family.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
