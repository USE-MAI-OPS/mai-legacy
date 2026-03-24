"use server";

import { revalidatePath } from "next/cache";
import { getFamilyContext } from "@/lib/get-family-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserFamily() {
  const ctx = await getFamilyContext();
  if (!ctx) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { userId: ctx.userId, familyId: ctx.familyId, sb: ctx.supabase as any };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationPreview {
  id: string;
  otherParticipantName: string;
  otherParticipantId: string;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  senderName: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface FamilyMember {
  userId: string;
  displayName: string;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * List the current user's conversations with last message preview and
 * other participant name.
 */
export async function getConversations(): Promise<ConversationPreview[]> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return [];

    // Fetch conversations where the current user is a participant
    const { data: conversations, error } = await ctx.sb
      .from("dm_conversations")
      .select("*")
      .eq("family_id", ctx.familyId)
      .contains("participant_ids", [ctx.userId])
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error || !conversations) return [];

    // Get all participant IDs (other than current user) to resolve names
    const otherIds = conversations.map((c: any) =>
      (c.participant_ids as string[]).find((id: string) => id !== ctx.userId)
    ).filter(Boolean) as string[];

    const nameMap: Record<string, string> = {};
    if (otherIds.length > 0) {
      const { data: members } = await ctx.sb
        .from("family_members")
        .select("user_id, display_name")
        .eq("family_id", ctx.familyId)
        .in("user_id", otherIds);
      for (const m of members ?? []) {
        if (m.user_id && m.display_name) nameMap[m.user_id] = m.display_name;
      }
    }

    // For each conversation, get the last message and unread count
    const previews: ConversationPreview[] = [];
    for (const conv of conversations as any[]) {
      const otherId = (conv.participant_ids as string[]).find(
        (id: string) => id !== ctx.userId
      ) ?? "";

      // Last message
      const { data: lastMsg } = await ctx.sb
        .from("direct_messages")
        .select("content")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Unread count
      const { count } = await ctx.sb
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("read", false)
        .neq("sender_id", ctx.userId);

      previews.push({
        id: conv.id,
        otherParticipantName: nameMap[otherId] ?? "Unknown",
        otherParticipantId: otherId,
        lastMessageContent: lastMsg?.content ?? null,
        lastMessageAt: conv.last_message_at,
        unreadCount: count ?? 0,
      });
    }

    return previews;
  } catch (err) {
    console.error("Failed to fetch conversations:", err);
    return [];
  }
}

/**
 * Fetch messages for a conversation, ordered oldest-first.
 * Also marks unread messages (sent by others) as read.
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return [];

    // Verify user is a participant
    const { data: conv, error: convError } = await ctx.sb
      .from("dm_conversations")
      .select("participant_ids")
      .eq("id", conversationId)
      .eq("family_id", ctx.familyId)
      .maybeSingle();

    if (convError || !conv) return [];
    if (!(conv.participant_ids as string[]).includes(ctx.userId)) return [];

    // Fetch messages
    const { data: messages, error: msgError } = await ctx.sb
      .from("direct_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError || !messages) return [];

    // Resolve sender names
    const senderIds = [...new Set(messages.map((m: any) => m.sender_id))];
    const nameMap: Record<string, string> = {};
    if (senderIds.length > 0) {
      const { data: members } = await ctx.sb
        .from("family_members")
        .select("user_id, display_name")
        .eq("family_id", ctx.familyId)
        .in("user_id", senderIds);
      for (const m of members ?? []) {
        if (m.user_id && m.display_name) nameMap[m.user_id] = m.display_name;
      }
    }

    // Mark unread messages from others as read
    const unreadIds = messages
      .filter((m: any) => !m.read && m.sender_id !== ctx.userId)
      .map((m: any) => m.id);

    if (unreadIds.length > 0) {
      await ctx.sb
        .from("direct_messages")
        .update({ read: true })
        .in("id", unreadIds);
    }

    return messages.map((m: any) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      senderName: nameMap[m.sender_id] ?? "Unknown",
      content: m.content,
      read: m.read,
      created_at: m.created_at,
    }));
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    return [];
  }
}

/**
 * Send a message in an existing conversation.
 */
export async function sendMessage(conversationId: string, content: string) {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return { error: "Not authenticated" };

    const trimmed = content.trim();
    if (!trimmed) return { error: "Message cannot be empty" };

    // Verify user is a participant
    const { data: conv } = await ctx.sb
      .from("dm_conversations")
      .select("participant_ids")
      .eq("id", conversationId)
      .eq("family_id", ctx.familyId)
      .maybeSingle();

    if (!conv || !(conv.participant_ids as string[]).includes(ctx.userId)) {
      return { error: "Conversation not found" };
    }

    // Insert message
    const { error: insertError } = await ctx.sb
      .from("direct_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: ctx.userId,
        content: trimmed,
        read: false,
      });

    if (insertError) return { error: insertError.message };

    // Update last_message_at on the conversation
    await ctx.sb
      .from("dm_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    revalidatePath(`/messages/${conversationId}`);
    revalidatePath("/messages");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

/**
 * Create a new conversation with a family member, or return the existing one.
 */
export async function startConversation(recipientUserId: string): Promise<{ conversationId?: string; error?: string }> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return { error: "Not authenticated" };

    if (recipientUserId === ctx.userId) {
      return { error: "Cannot message yourself" };
    }

    // Check if a conversation already exists between these two users
    const { data: existing } = await ctx.sb
      .from("dm_conversations")
      .select("id, participant_ids")
      .eq("family_id", ctx.familyId)
      .contains("participant_ids", [ctx.userId])
      .contains("participant_ids", [recipientUserId]);

    // Find an exact 2-person match
    const match = (existing ?? []).find(
      (c: any) =>
        (c.participant_ids as string[]).length === 2 &&
        (c.participant_ids as string[]).includes(ctx.userId) &&
        (c.participant_ids as string[]).includes(recipientUserId)
    );

    if (match) {
      return { conversationId: match.id };
    }

    // Create a new conversation
    const { data: newConv, error } = await ctx.sb
      .from("dm_conversations")
      .insert({
        family_id: ctx.familyId,
        participant_ids: [ctx.userId, recipientUserId],
        last_message_at: null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    revalidatePath("/messages");
    return { conversationId: newConv.id };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}

/**
 * List family members the current user can message (excludes self).
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return [];

    const { data: members, error } = await ctx.sb
      .from("family_members")
      .select("user_id, display_name")
      .eq("family_id", ctx.familyId)
      .neq("user_id", ctx.userId);

    if (error || !members) return [];

    return members
      .filter((m: any) => m.user_id && m.display_name)
      .map((m: any) => ({
        userId: m.user_id,
        displayName: m.display_name,
      }));
  } catch {
    return [];
  }
}

/**
 * Get the other participant's name for a conversation.
 */
export async function getConversationInfo(conversationId: string): Promise<{ otherName: string; otherUserId: string } | null> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return null;

    const { data: conv } = await ctx.sb
      .from("dm_conversations")
      .select("participant_ids")
      .eq("id", conversationId)
      .eq("family_id", ctx.familyId)
      .maybeSingle();

    if (!conv) return null;
    if (!(conv.participant_ids as string[]).includes(ctx.userId)) return null;

    const otherId = (conv.participant_ids as string[]).find(
      (id: string) => id !== ctx.userId
    ) ?? "";

    const { data: member } = await ctx.sb
      .from("family_members")
      .select("display_name")
      .eq("user_id", otherId)
      .eq("family_id", ctx.familyId)
      .maybeSingle();

    return {
      otherName: member?.display_name ?? "Unknown",
      otherUserId: otherId,
    };
  } catch {
    return null;
  }
}

/**
 * Return the current user's ID (for use in client components to identify
 * which messages are "mine").
 */
export async function getCurrentUserId(): Promise<string | null> {
  const ctx = await getUserFamily();
  return ctx?.userId ?? null;
}
