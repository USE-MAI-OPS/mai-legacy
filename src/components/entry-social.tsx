"use client";

import { useState, useTransition, useRef } from "react";
import { Heart, Flame, MessageCircle, Reply, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  toggleReaction,
  addComment,
  deleteComment,
} from "@/app/(dashboard)/entries/social-actions";
import type {
  ReactionType,
  ReactionCount,
  CommentData,
} from "@/app/(dashboard)/entries/social-actions";

// ---------------------------------------------------------------------------
// Reaction config
// ---------------------------------------------------------------------------
const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "heart", emoji: "\u2764\uFE0F", label: "Love" },
  { type: "pray", emoji: "\uD83D\uDE4F", label: "Amen" },
  { type: "laugh", emoji: "\uD83D\uDE02", label: "Haha" },
  { type: "cry", emoji: "\uD83D\uDE22", label: "Touched" },
  { type: "fire", emoji: "\uD83D\uDD25", label: "Fire" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface EntrySocialProps {
  entryId: string;
  currentUserId: string;
  initialReactions: ReactionCount[];
  initialUserReaction: ReactionType | null;
  initialTotalReactions: number;
  initialComments: CommentData[];
  initialTotalComments: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Comment component
// ---------------------------------------------------------------------------
function Comment({
  comment,
  entryId,
  currentUserId,
  depth = 0,
}: {
  comment: CommentData;
  entryId: string;
  currentUserId: string;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();
  const isOwn = comment.user_id === currentUserId;

  function handleReply() {
    if (!replyText.trim()) return;
    startTransition(async () => {
      await addComment(entryId, replyText, comment.id);
      setReplyText("");
      setReplying(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(comment.id, entryId);
    });
  }

  return (
    <div className={cn("group", depth > 0 && "ml-8 border-l-2 border-muted pl-4")}>
      <div className="flex items-start gap-3 py-3">
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {comment.author_initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            {depth === 0 && (
              <button
                onClick={() => setReplying(!replying)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>

          {/* Reply input */}
          {replying && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder="Write a reply..."
                className="flex-1 text-sm bg-muted/50 border rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReply}
                disabled={isPending || !replyText.trim()}
                className="rounded-full h-8 w-8 p-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          entryId={entryId}
          currentUserId={currentUserId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function EntrySocial({
  entryId,
  currentUserId,
  initialReactions,
  initialUserReaction,
  initialTotalReactions,
  initialComments,
  initialTotalComments,
}: EntrySocialProps) {
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    initialUserReaction
  );
  const [reactionCounts, setReactionCounts] = useState(initialReactions);
  const [totalReactions, setTotalReactions] = useState(initialTotalReactions);
  const [comments, setComments] = useState(initialComments);
  const [totalComments, setTotalComments] = useState(initialTotalComments);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const commentInputRef = useRef<HTMLInputElement>(null);

  function handleReaction(type: ReactionType) {
    // Optimistic update
    const wasActive = userReaction === type;

    if (wasActive) {
      // Removing reaction
      setUserReaction(null);
      setTotalReactions((t) => t - 1);
      setReactionCounts((prev) =>
        prev
          .map((r) =>
            r.type === type ? { ...r, count: r.count - 1 } : r
          )
          .filter((r) => r.count > 0)
      );
    } else {
      // Adding/switching reaction
      if (userReaction) {
        // Switching — decrement old
        setReactionCounts((prev) =>
          prev
            .map((r) =>
              r.type === userReaction ? { ...r, count: r.count - 1 } : r
            )
            .filter((r) => r.count > 0)
        );
      } else {
        setTotalReactions((t) => t + 1);
      }
      setUserReaction(type);
      setReactionCounts((prev) => {
        const existing = prev.find((r) => r.type === type);
        if (existing) {
          return prev.map((r) =>
            r.type === type ? { ...r, count: r.count + 1 } : r
          );
        }
        return [...prev, { type, count: 1 }];
      });
    }

    startTransition(async () => {
      await toggleReaction(entryId, type);
    });
  }

  function handleAddComment() {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment(entryId, newComment);
      setNewComment("");
      // Comments will be refreshed via revalidation
    });
  }

  // Get count for a specific reaction type
  function getCount(type: ReactionType): number {
    return reactionCounts.find((r) => r.type === type)?.count ?? 0;
  }

  return (
    <div className="mt-2">
      <Separator />

      {/* Reaction summary bar */}
      {totalReactions > 0 && (
        <div className="px-6 py-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {reactionCounts
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map((r) => (
              <span key={r.type}>
                {REACTIONS.find((rx) => rx.type === r.type)?.emoji}
              </span>
            ))}
          <span className="ml-1">
            {totalReactions} {totalReactions === 1 ? "reaction" : "reactions"}
          </span>
          {totalComments > 0 && (
            <>
              <span className="mx-1">&bull;</span>
              <button
                onClick={() => commentInputRef.current?.focus()}
                className="hover:underline"
              >
                {totalComments} {totalComments === 1 ? "comment" : "comments"}
              </button>
            </>
          )}
        </div>
      )}

      <Separator />

      {/* Reaction buttons */}
      <div className="px-4 py-2 flex items-center justify-around">
        {REACTIONS.map(({ type, emoji, label }) => {
          const isActive = userReaction === type;
          const count = getCount(type);
          return (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              disabled={isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                isActive
                  ? "bg-primary/10 text-primary scale-105"
                  : "text-muted-foreground hover:bg-muted hover:scale-105"
              )}
            >
              <span className={cn("text-lg", isActive && "animate-bounce")}>{emoji}</span>
              <span className="text-xs font-medium">
                {count > 0 ? count : label}
              </span>
            </button>
          );
        })}

        {/* Comment button */}
        <button
          onClick={() => commentInputRef.current?.focus()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:bg-muted transition-all hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs font-medium">
            {totalComments > 0 ? totalComments : "Comment"}
          </span>
        </button>
      </div>

      <Separator />

      {/* Comments section */}
      <div className="px-6 py-4">
        {/* Comment input */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            You
          </div>
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Write a comment..."
              className="flex-1 text-sm bg-muted/50 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddComment}
              disabled={isPending || !newComment.trim()}
              className="rounded-full h-9 w-9 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comment list */}
        {comments.length > 0 && (
          <div className="space-y-0">
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                entryId={entryId}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
