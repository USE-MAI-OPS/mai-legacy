import { createClient } from "@/lib/supabase/client";
import { getActiveFamilyIdClient } from "@/lib/active-family";
import type { ConversationMessage } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GriotStreamResult {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  response: Response;
}

export interface ConversationSummary {
  id: string;
  family_id: string;
  user_id: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

/**
 * Calls the /api/griot streaming endpoint and returns a reader for the
 * response body. The caller is responsible for consuming the stream.
 *
 * Throws if the response is not ok (caller should handle gracefully).
 */
export async function streamGriotResponse(
  message: string,
  familyId: string,
  history: ConversationMessage[],
  conversationId?: string
): Promise<GriotStreamResult> {
  const response = await fetch("/api/griot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      familyId,
      conversationId,
      history,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `API error ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body to stream");
  }

  return { reader, response };
}

// ---------------------------------------------------------------------------
// Conversation persistence
// ---------------------------------------------------------------------------

/**
 * Save or update a conversation in the `griot_conversations` table.
 *
 * If `conversationId` is provided and the conversation already exists, append
 * new messages. Otherwise create a new row.
 */
export async function saveConversation(
  conversationId: string,
  familyId: string,
  messages: ConversationMessage[]
): Promise<{ id: string } | null> {
  try {
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("griot_conversations")
      .select("id, messages")
      .eq("id", conversationId)
      .single();

    const now = new Date().toISOString();

    if (existing) {
      await supabase
        .from("griot_conversations")
        .update({ messages, updated_at: now })
        .eq("id", conversationId);

      return { id: conversationId };
    } else {
      // Need current user for user_id
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from("griot_conversations")
        .insert({
          id: conversationId,
          family_id: familyId,
          user_id: user.id,
          messages,
        })
        .select("id")
        .single();

      if (error) {
        console.error("[griot] Failed to save conversation:", error);
        return null;
      }

      return data;
    }
  } catch (err) {
    console.error("[griot] saveConversation error:", err);
    return null;
  }
}

/**
 * Load the list of conversations for a family, most recent first.
 * Returns a lightweight summary (id, first message preview, timestamps).
 */
export async function loadConversations(
  familyId: string
): Promise<ConversationSummary[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("griot_conversations")
      .select("id, family_id, user_id, messages, created_at, updated_at")
      .eq("family_id", familyId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[griot] loadConversations error:", error);
      return [];
    }

    return (data as ConversationSummary[]) ?? [];
  } catch (err) {
    console.error("[griot] loadConversations error:", err);
    return [];
  }
}

/**
 * Load a single conversation's full messages by its ID.
 */
export async function loadConversation(
  conversationId: string
): Promise<ConversationSummary | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("griot_conversations")
      .select("id, family_id, user_id, messages, created_at, updated_at")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("[griot] loadConversation error:", error);
      return null;
    }

    return data as ConversationSummary;
  } catch (err) {
    console.error("[griot] loadConversation error:", err);
    return null;
  }
}

/**
 * Delete a conversation by its ID.
 */
export async function deleteConversation(
  conversationId: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("griot_conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.error("[griot] deleteConversation error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[griot] deleteConversation error:", err);
    return false;
  }
}

/**
 * Resolve the current user's family_id from the family_members table.
 * Returns null if the user isn't logged in or doesn't belong to a family.
 */
export async function getCurrentFamilyId(): Promise<string | null> {
  try {
    // Try cookie first
    const cookieId = getActiveFamilyIdClient();
    if (cookieId) return cookieId;

    // Fallback: query Supabase
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    return membership?.family_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Get a preview string for a conversation (the first user message, truncated).
 */
export function getConversationPreview(
  messages: ConversationMessage[]
): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "New conversation";
  const text = firstUserMsg.content;
  return text.length > 60 ? text.slice(0, 57) + "..." : text;
}
