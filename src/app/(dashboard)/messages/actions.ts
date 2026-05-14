"use server";

import { revalidatePath } from "next/cache";
import { getFamilyContext } from "@/lib/get-family-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserFamily() {
  const ctx = await getFamilyContext();
  if (!ctx) return null;
  return {
    userId: ctx.userId,
    /** Active hub — used when we have to pick *one* (e.g. home for a new DM). */
    familyId: ctx.familyId,
    /** Every hub the user belongs to — used to aggregate DMs. */
    familyIds: ctx.familyIds,
    sb: ctx.supabase,
  };
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
  /** 'direct' (1:1) or 'family_group' (hub-wide Message Board) */
  type: "direct" | "family_group";
  /** For family_group: number of members in the group */
  participantCount?: number;
  /** Hub the conversation lives in (for the subtitle badge). */
  hubId: string;
  hubName: string;
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
 * List the current user's conversations across every hub they belong to.
 * Each conversation is tagged with its hub name so the UI can show a badge
 * — we keep per-hub 1:1 threads distinct rather than merging them.
 */
export async function getConversations(): Promise<ConversationPreview[]> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return [];

    // Fetch conversations across every hub the user belongs to.
    const { data: conversations, error } = await ctx.sb
      .from("dm_conversations")
      .select("*")
      .in("family_id", ctx.familyIds)
      .contains("participant_ids", [ctx.userId])
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error || !conversations) return [];

    // Resolve the "other" participant's display name. Look across all hubs
    // since the other user might be in a different hub than the active one.
    const otherIds = conversations
      .filter((c) => c.type !== "family_group")
      .map((c) => c.participant_ids.find((id: string) => id !== ctx.userId))
      .filter(Boolean) as string[];

    const nameMap: Record<string, string> = {};
    if (otherIds.length > 0) {
      const { data: members } = await ctx.sb
        .from("family_members")
        .select("user_id, display_name")
        .in("family_id", ctx.familyIds)
        .in("user_id", otherIds);
      for (const m of members ?? []) {
        if (m.user_id && m.display_name && !(m.user_id in nameMap)) {
          nameMap[m.user_id] = m.display_name;
        }
      }
    }

    // Resolve hub names for every hub that has at least one conversation.
    const uniqueHubIds = Array.from(
      new Set(conversations.map((c) => c.family_id as string))
    );
    const hubNameMap: Record<string, string> = {};
    if (uniqueHubIds.length > 0) {
      const { data: hubs } = await ctx.sb
        .from("families")
        .select("id, name")
        .in("id", uniqueHubIds);
      for (const h of hubs ?? []) {
        if (h.id && h.name) hubNameMap[h.id] = h.name;
      }
    }

    // Batch-fetch last messages and unread counts in parallel.
    const convIds = conversations.map((c) => c.id);
    const [lastMessagesResult, unreadResult] = await Promise.all([
      ctx.sb
        .from("direct_messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false }),
      ctx.sb
        .from("direct_messages")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .eq("read", false)
        .neq("sender_id", ctx.userId),
    ]);

    const lastMsgMap: Record<string, string | null> = {};
    for (const msg of lastMessagesResult.data ?? []) {
      if (!(msg.conversation_id in lastMsgMap)) {
        lastMsgMap[msg.conversation_id] = msg.content;
      }
    }

    const unreadMap: Record<string, number> = {};
    for (const msg of unreadResult.data ?? []) {
      unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] ?? 0) + 1;
    }

    const previews: ConversationPreview[] = conversations.map((conv) => {
      const isGroup = conv.type === "family_group";
      const otherId = isGroup
        ? ""
        : conv.participant_ids.find((id: string) => id !== ctx.userId) ?? "";
      const hubId = conv.family_id as string;
      const hubName = hubNameMap[hubId] ?? "Family";

      return {
        id: conv.id,
        otherParticipantName: isGroup
          ? `${hubName} Message Board`
          : nameMap[otherId] ?? "Unknown",
        otherParticipantId: otherId,
        lastMessageContent: lastMsgMap[conv.id] ?? null,
        lastMessageAt: conv.last_message_at,
        unreadCount: unreadMap[conv.id] ?? 0,
        type: isGroup ? "family_group" : "direct",
        participantCount: isGroup ? conv.participant_ids.length : undefined,
        hubId,
        hubName,
      };
    });

    // Pin every hub's Message Board to the top, then order 1:1s by recency.
    // Group-ordering by hub name keeps boards grouped deterministically.
    previews.sort((a, b) => {
      if (a.type === "family_group" && b.type !== "family_group") return -1;
      if (b.type === "family_group" && a.type !== "family_group") return 1;
      if (a.type === "family_group" && b.type === "family_group") {
        return a.hubName.localeCompare(b.hubName);
      }
      return 0;
    });

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

    // Verify user is a participant in a conversation in one of their hubs.
    const { data: conv, error: convError } = await ctx.sb
      .from("dm_conversations")
      .select("participant_ids, family_id")
      .eq("id", conversationId)
      .in("family_id", ctx.familyIds)
      .maybeSingle();

    if (convError || !conv) return [];
    if (!conv.participant_ids.includes(ctx.userId)) return [];

    const { data: messages, error: msgError } = await ctx.sb
      .from("direct_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError || !messages) return [];

    // Resolve sender names across all the user's hubs.
    const senderIds = [...new Set(messages.map((m) => m.sender_id))];
    const nameMap: Record<string, string> = {};
    if (senderIds.length > 0) {
      const { data: members } = await ctx.sb
        .from("family_members")
        .select("user_id, display_name")
        .in("family_id", ctx.familyIds)
        .in("user_id", senderIds);
      for (const m of members ?? []) {
        if (m.user_id && m.display_name && !(m.user_id in nameMap)) {
          nameMap[m.user_id] = m.display_name;
        }
      }
    }

    const unreadIds = messages
      .filter((m) => !m.read && m.sender_id !== ctx.userId)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await ctx.sb
        .from("direct_messages")
        .update({ read: true })
        .in("id", unreadIds);
    }

    return messages.map((m) => ({
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

    const { data: conv } = await ctx.sb
      .from("dm_conversations")
      .select("participant_ids")
      .eq("id", conversationId)
      .in("family_id", ctx.familyIds)
      .maybeSingle();

    if (!conv || !conv.participant_ids.includes(ctx.userId)) {
      return { error: "Conversation not found" };
    }

    const { error: insertError } = await ctx.sb
      .from("direct_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: ctx.userId,
        content: trimmed,
        read: false,
      });

    if (insertError) return { error: insertError.message };

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
 * Create a 1:1 conversation with another user, or return an existing one.
 * Looks for an existing thread across any hub both users share; only falls
 * back to creating a fresh thread (in the active hub) if none exists.
 */
export async function startConversation(
  recipientUserId: string
): Promise<{ conversationId?: string; error?: string }> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return { error: "Not authenticated" };

    if (recipientUserId === ctx.userId) {
      return { error: "Cannot message yourself" };
    }

    // Search across every hub the current user belongs to. Any shared hub
    // that already has a 1:1 thread between these two users is a match.
    const { data: existing } = await ctx.sb
      .from("dm_conversations")
      .select("id, participant_ids, family_id")
      .in("family_id", ctx.familyIds)
      .contains("participant_ids", [ctx.userId])
      .contains("participant_ids", [recipientUserId]);

    const match = (existing ?? []).find(
      (c) =>
        c.participant_ids.length === 2 &&
        c.participant_ids.includes(ctx.userId) &&
        c.participant_ids.includes(recipientUserId)
    );

    if (match) {
      return { conversationId: match.id };
    }

    // Pick a hub for the new thread. Prefer the active hub if the recipient
    // is a member; otherwise fall back to any hub they share with the user.
    let homeFamilyId: string | null = null;
    const { data: sharedMembership } = await ctx.sb
      .from("family_members")
      .select("family_id")
      .eq("user_id", recipientUserId)
      .in("family_id", ctx.familyIds);

    const sharedHubs = (sharedMembership ?? [])
      .map((r) => r.family_id as string)
      .filter(Boolean);

    if (sharedHubs.length === 0) {
      return { error: "No shared hub with this user" };
    }

    homeFamilyId = sharedHubs.includes(ctx.familyId)
      ? ctx.familyId
      : sharedHubs[0];

    const { data: newConv, error } = await ctx.sb
      .from("dm_conversations")
      .insert({
        family_id: homeFamilyId,
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
 * List family members the current user can start a new DM with. Scoped to
 * the active hub — the picker is for "start a conversation from this hub",
 * not an aggregate of everyone you could ever DM.
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
      .filter((m) => m.user_id && m.display_name)
      .map((m) => ({
        userId: m.user_id,
        displayName: m.display_name,
      }));
  } catch {
    return [];
  }
}

/**
 * Get the conversation header info. For 1:1 DMs returns the other user; for
 * the hub's group conversation returns the hub name. Returns the hub info
 * so the header can render the badge too.
 */
export async function getConversationInfo(conversationId: string): Promise<{
  otherName: string;
  otherUserId: string;
  type: "direct" | "family_group";
  participantCount: number;
  hubId: string;
  hubName: string;
} | null> {
  try {
    const ctx = await getUserFamily();
    if (!ctx) return null;

    const { data: conv } = await ctx.sb
      .from("dm_conversations")
      .select("participant_ids, type, family_id")
      .eq("id", conversationId)
      .in("family_id", ctx.familyIds)
      .maybeSingle();

    if (!conv) return null;
    if (!conv.participant_ids.includes(ctx.userId)) return null;

    const hubId = conv.family_id as string;
    const { data: hub } = await ctx.sb
      .from("families")
      .select("name")
      .eq("id", hubId)
      .maybeSingle();
    const hubName = hub?.name ?? "Family";

    const isGroup = conv.type === "family_group";
    if (isGroup) {
      return {
        otherName: `${hubName} Message Board`,
        otherUserId: "",
        type: "family_group",
        participantCount: conv.participant_ids.length,
        hubId,
        hubName,
      };
    }

    const otherId = conv.participant_ids.find(
      (id: string) => id !== ctx.userId
    ) ?? "";

    // Look up the name across all hubs — the recipient might live elsewhere.
    const { data: member } = await ctx.sb
      .from("family_members")
      .select("display_name")
      .eq("user_id", otherId)
      .in("family_id", ctx.familyIds)
      .limit(1)
      .maybeSingle();

    return {
      otherName: member?.display_name ?? "Unknown",
      otherUserId: otherId,
      type: "direct",
      participantCount: conv.participant_ids.length,
      hubId,
      hubName,
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
