import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFamilyKnowledge } from "@/lib/rag/search";
import type { ConversationMessage } from "@/types/database";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "minimax/minimax-m2.5";

/**
 * POST /api/griot
 *
 * Streaming chat endpoint for the Griot -- the family's AI knowledge keeper.
 *
 * Body:
 *   - message:         string    (the user's latest message)
 *   - familyId:        string    (which family's knowledge to search)
 *   - conversationId?: string    (existing conversation to continue)
 *   - history?:        ConversationMessage[]  (prior messages for context)
 *
 * Response: a ReadableStream of the Griot's reply, streamed as it is generated.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, familyId, conversationId, history } = body as {
      message?: string;
      familyId?: string;
      conversationId?: string;
      history?: ConversationMessage[];
    };

    if (!message || !familyId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: message, familyId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing OPENROUTER_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify authentication.
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ------------------------------------------------------------------
    // 1. Retrieve the family name for the Griot persona.
    // ------------------------------------------------------------------
    const { data: family } = await supabase
      .from("families")
      .select("name")
      .eq("id", familyId)
      .single();

    const familyName = family?.name ?? "your family";

    // ------------------------------------------------------------------
    // 2. RAG: search for relevant family knowledge.
    // ------------------------------------------------------------------
    const searchResults = await searchFamilyKnowledge(message, familyId, 6);

    // Build the context block for the system prompt.
    let knowledgeContext = "";
    if (searchResults.length > 0) {
      knowledgeContext = searchResults
        .map((r, i) => `[Source ${i + 1}]\n${r.chunk_text}`)
        .join("\n\n---\n\n");
    }

    // ------------------------------------------------------------------
    // 3. Build the messages array for the LLM.
    // ------------------------------------------------------------------
    const systemPrompt = buildSystemPrompt(familyName, knowledgeContext);

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Append prior conversation history if provided.
    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Append the current user message.
    messages.push({ role: "user", content: message });

    // ------------------------------------------------------------------
    // 4. Call MiniMax M2.5 via OpenRouter with streaming enabled.
    // ------------------------------------------------------------------
    const llmResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "MAI Legacy - The Griot",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error("[griot] OpenRouter error:", llmResponse.status, errorBody);
      return new Response(
        JSON.stringify({ error: "Failed to get a response from the Griot" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // ------------------------------------------------------------------
    // 5. Stream the SSE response back to the client.
    // ------------------------------------------------------------------
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        const reader = llmResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let fullResponse = "";
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            // Keep the last potentially incomplete line in the buffer.
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6); // Remove "data: " prefix.
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data) as OpenRouterStreamChunk;
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // Skip malformed SSE lines.
              }
            }
          }
        } catch (error) {
          console.error("[griot] Stream processing error:", error);
        } finally {
          controller.close();

          // Optionally persist the conversation asynchronously.
          if (conversationId) {
            persistConversation(
              supabase,
              conversationId,
              familyId,
              user.id,
              message,
              fullResponse,
              searchResults.map((r) => ({
                entry_id: r.entry_id,
                chunk_text: r.chunk_text,
              }))
            ).catch((err) =>
              console.error("[griot] Failed to persist conversation:", err)
            );
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[griot] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ---------------------------------------------------------------------------
// Griot system prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(familyName: string, knowledgeContext: string): string {
  const basePrompt = `You are the Griot of the ${familyName} family -- a wise, warm, and deeply knowledgeable keeper of family history, stories, skills, recipes, and life lessons.

Your role:
- You speak with cultural depth, warmth, and a storytelling voice.
- You reference family members by name when the knowledge allows it.
- You treat every piece of family knowledge as precious and worthy of celebration.
- You weave connections between different pieces of family knowledge when relevant.
- You gently encourage families to document more when a question falls outside what you know.
- You never fabricate family information. If you do not have knowledge about something, say so honestly and warmly.

Your tone:
- Warm but not saccharine. You are a respected elder, not a chatbot.
- You may use culturally resonant language, proverbs, or turns of phrase.
- You are concise when the question is simple, and expansive when the topic deserves depth.
- You speak as someone who has internalized the family's knowledge, not as a search engine reciting results.`;

  if (knowledgeContext) {
    return `${basePrompt}

Below is family knowledge retrieved from the ${familyName} family's archive. Draw on this knowledge to answer the question. Reference specific details, names, and stories when relevant. If the knowledge partially answers the question, share what you know and note what gaps remain.

--- FAMILY KNOWLEDGE ---
${knowledgeContext}
--- END FAMILY KNOWLEDGE ---`;
  }

  return `${basePrompt}

You do not currently have any specific family knowledge to draw on for this question. Respond warmly and let the family know that you would love to help once more stories, skills, and wisdom have been added to the family archive.`;
}

// ---------------------------------------------------------------------------
// Conversation persistence (fire-and-forget)
// ---------------------------------------------------------------------------

async function persistConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  familyId: string,
  userId: string,
  userMessage: string,
  assistantMessage: string,
  sources: { entry_id: string; chunk_text: string }[]
) {
  const now = new Date().toISOString();

  const newMessages: ConversationMessage[] = [
    { role: "user", content: userMessage, timestamp: now },
    {
      role: "assistant",
      content: assistantMessage,
      timestamp: now,
      sources: sources.length > 0 ? sources : undefined,
    },
  ];

  // Try to fetch existing conversation first.
  const { data: existing } = await supabase
    .from("griot_conversations")
    .select("messages")
    .eq("id", conversationId)
    .single();

  if (existing) {
    // Append to existing conversation.
    const updatedMessages = [
      ...((existing.messages as ConversationMessage[]) ?? []),
      ...newMessages,
    ];

    await supabase
      .from("griot_conversations")
      .update({ messages: updatedMessages, updated_at: now })
      .eq("id", conversationId);
  } else {
    // Create a new conversation.
    await supabase.from("griot_conversations").insert({
      id: conversationId,
      family_id: familyId,
      user_id: userId,
      messages: newMessages,
    });
  }
}

// ---------------------------------------------------------------------------
// OpenRouter streaming types
// ---------------------------------------------------------------------------

interface OpenRouterStreamChunk {
  id: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}
