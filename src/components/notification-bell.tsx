"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { Bell, Check, Heart, MessageCircle, BookOpen, UserPlus, Calendar, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications";
import type { NotificationData, NotificationType } from "@/lib/notifications";

// ---------------------------------------------------------------------------
// Notification icon mapping
// ---------------------------------------------------------------------------
const notifIcons: Record<NotificationType, React.ReactNode> = {
  reaction: <Heart className="h-4 w-4 text-rose-500" />,
  comment: <MessageCircle className="h-4 w-4 text-blue-500" />,
  reply: <MessageCircle className="h-4 w-4 text-indigo-500" />,
  new_entry: <BookOpen className="h-4 w-4 text-emerald-500" />,
  invite_accepted: <UserPlus className="h-4 w-4 text-green-500" />,
  event_reminder: <Calendar className="h-4 w-4 text-amber-500" />,
  goal_completed: <Target className="h-4 w-4 text-emerald-500" />,
  griot: <Sparkles className="h-4 w-4 text-purple-500" />,
};

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Get link for notification
// ---------------------------------------------------------------------------
function getNotifLink(n: NotificationData): string {
  if (n.reference_type === "entry" && n.reference_id)
    return `/entries/${n.reference_id}`;
  if (n.reference_type === "event") return "/family";
  if (n.reference_type === "goal") return "/goals";
  return "/feed";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications on mount and periodically
  useEffect(() => {
    async function load() {
      try {
        const data = await getNotifications(20);
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // Silently fail — bell still renders
      }
    }

    load();
    const interval = setInterval(load, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  function handleMarkRead(notifId: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    startTransition(async () => {
      await markNotificationRead(notifId);
    });
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-card border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={getNotifLink(notif)}
                  onClick={() => {
                    if (!notif.read) handleMarkRead(notif.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0",
                    !notif.read && "bg-primary/[0.03]"
                  )}
                >
                  {/* Icon */}
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    {notifIcons[notif.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-snug",
                      !notif.read && "font-medium"
                    )}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {notif.body}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
