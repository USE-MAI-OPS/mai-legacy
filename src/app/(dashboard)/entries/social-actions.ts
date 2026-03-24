"use server";

import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/get-family-context";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ReactionType = "heart" | "pray" | "laugh" | "cry" | "fire";

export interface ReactionCount {
  type: ReactionType;
  count: number;
}

export interface CommentData {
  id: string;
  content: string;
  user_id: string;
  author_name: string;
  author_initials: string;
  parent_comment_id: string | null;
  created_at: string;
  replies?: CommentData[];
}

export interface SocialData {
  reactions: ReactionCount[];
  userReaction: ReactionType | null;
  totalReactions: number;
  comments: CommentData[];
  totalComments: number;
}

// ---------------------------------------------------------------------------
// Toggle reaction (add or remove)
// ---------------------------------------------------------------------------
export async function toggleReaction(
  entryId: string,
  reactionType: ReactionType
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getFamilyContext();
  if (!ctx) return { success: false, error: "Not authenticated" };

  const { userId, familyId, supabase } = ctx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Check if user already reacted
  const { data: existing } = await sb
    .from("entry_reactions")
    .select("id, reaction_type")
    .eq("entry_id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      // Same reaction — remove it (toggle off)
      await sb.from("entry_reactions").delete().eq("id", existing.id);
    } else {
      // Different reaction — update it
      await sb
        .from("entry_reactions")
        .update({ reaction_type: reactionType })
        .eq("id", existing.id);
    }
  } else {
    // No existing reaction — insert
    await sb.from("entry_reactions").insert({
      entry_id: entryId,
      user_id: userId,
      family_id: familyId,
      reaction_type: reactionType,
    });
  }

  revalidatePath(`/entries/${entryId}`);
  revalidatePath("/feed");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Add comment
// ---------------------------------------------------------------------------
export async function addComment(
  entryId: string,
  content: string,
  parentCommentId?: string
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getFamilyContext();
  if (!ctx) return { success: false, error: "Not authenticated" };

  const { userId, familyId, supabase } = ctx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Comment cannot be empty" };
  if (trimmed.length > 2000)
    return { success: false, error: "Comment too long (max 2000 chars)" };

  const { error } = await sb.from("entry_comments").insert({
    entry_id: entryId,
    user_id: userId,
    family_id: familyId,
    parent_comment_id: parentCommentId ?? null,
    content: trimmed,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/entries/${entryId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Delete comment (own only)
// ---------------------------------------------------------------------------
export async function deleteComment(
  commentId: string,
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getFamilyContext();
  if (!ctx) return { success: false, error: "Not authenticated" };

  const { supabase } = ctx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // RLS ensures only own comments can be deleted
  const { error } = await sb
    .from("entry_comments")
    .delete()
    .eq("id", commentId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/entries/${entryId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Get reactions and comments for an entry
// ---------------------------------------------------------------------------
export async function getSocialData(entryId: string): Promise<SocialData> {
  const ctx = await getFamilyContext();
  if (!ctx) {
    return {
      reactions: [],
      userReaction: null,
      totalReactions: 0,
      comments: [],
      totalComments: 0,
    };
  }

  const { userId, familyId, supabase } = ctx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Fetch reactions
  const { data: reactions } = await sb
    .from("entry_reactions")
    .select("reaction_type, user_id")
    .eq("entry_id", entryId);

  const reactionList = (reactions ?? []) as {
    reaction_type: ReactionType;
    user_id: string;
  }[];

  // Count by type
  const countMap: Record<string, number> = {};
  let userReaction: ReactionType | null = null;
  for (const r of reactionList) {
    countMap[r.reaction_type] = (countMap[r.reaction_type] ?? 0) + 1;
    if (r.user_id === userId) userReaction = r.reaction_type;
  }

  const reactionCounts: ReactionCount[] = Object.entries(countMap).map(
    ([type, count]) => ({ type: type as ReactionType, count })
  );

  // Fetch comments
  const { data: comments } = await sb
    .from("entry_comments")
    .select("id, content, user_id, parent_comment_id, created_at")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });

  const commentList = (comments ?? []) as {
    id: string;
    content: string;
    user_id: string;
    parent_comment_id: string | null;
    created_at: string;
  }[];

  // Resolve author names
  const authorIds = [...new Set(commentList.map((c) => c.user_id))];
  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: members } = await sb
      .from("family_members")
      .select("user_id, display_name")
      .eq("family_id", familyId)
      .in("user_id", authorIds);
    for (const m of members ?? []) {
      if (m.user_id && m.display_name) authorMap[m.user_id] = m.display_name;
    }
  }

  // Build threaded comments
  const commentData: CommentData[] = commentList.map((c) => {
    const name = authorMap[c.user_id] ?? "Unknown";
    return {
      id: c.id,
      content: c.content,
      user_id: c.user_id,
      author_name: name,
      author_initials: name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      parent_comment_id: c.parent_comment_id,
      created_at: c.created_at,
    };
  });

  // Nest replies under parents
  const topLevel: CommentData[] = [];
  const replyMap: Record<string, CommentData[]> = {};

  for (const c of commentData) {
    if (c.parent_comment_id) {
      if (!replyMap[c.parent_comment_id]) replyMap[c.parent_comment_id] = [];
      replyMap[c.parent_comment_id].push(c);
    } else {
      topLevel.push(c);
    }
  }

  for (const c of topLevel) {
    c.replies = replyMap[c.id] ?? [];
  }

  return {
    reactions: reactionCounts,
    userReaction,
    totalReactions: reactionList.length,
    comments: topLevel,
    totalComments: commentData.length,
  };
}
