"use server";

import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/get-family-context";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type NotificationType =
  | "reaction"
  | "comment"
  | "reply"
  | "new_entry"
  | "invite_accepted"
  | "event_reminder"
  | "goal_completed"
  | "griot";

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  reference_type: string | null;
  reference_id: string | null;
  actor_id: string | null;
  actor_name: string | null;
  read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Create a notification (called from server actions)
// ---------------------------------------------------------------------------
export async function createNotification({
  userId,
  familyId,
  type,
  title,
  body,
  referenceType,
  referenceId,
  actorId,
}: {
  userId: string;
  familyId: string;
  type: NotificationType;
  title: string;
  body?: string;
  referenceType?: string;
  referenceId?: string;
  actorId?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // Guard: require an authenticated session even though this is an internal helper,
    // because the file-level "use server" makes it callable as a server action.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notifications").insert({
      user_id: userId,
      family_id: familyId,
      type,
      title,
      body: body ?? null,
      reference_type: referenceType ?? null,
      reference_id: referenceId ?? null,
      actor_id: actorId ?? null,
    });
  } catch (err) {
    // Notification creation should never block the main action
    console.error("Failed to create notification:", err);
  }
}

// ---------------------------------------------------------------------------
// Get notifications for current user
// ---------------------------------------------------------------------------
export async function getNotifications(
  limit: number = 20
): Promise<{ notifications: NotificationData[]; unreadCount: number }> {
  const ctx = await getFamilyContext();
  if (!ctx) return { notifications: [], unreadCount: 0 };

  const { userId, familyId, supabase } = ctx;

  // Fetch recent notifications
  const { data: notifs } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Get unread count
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  // Resolve actor names
  const actorIds = [
    ...new Set(
      (notifs ?? [])
        .map((n) => n.actor_id)
        .filter(Boolean)
    ),
  ] as string[];
  const actorMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: members } = await supabase
      .from("family_members")
      .select("user_id, display_name")
      .eq("family_id", familyId)
      .in("user_id", actorIds);
    for (const m of members ?? []) {
      if (m.user_id && m.display_name) actorMap[m.user_id] = m.display_name;
    }
  }

  const notifications: NotificationData[] = (notifs ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      reference_type: n.reference_type,
      reference_id: n.reference_id,
      actor_id: n.actor_id,
      actor_name: n.actor_id ? actorMap[n.actor_id] ?? null : null,
      read: n.read,
      created_at: n.created_at,
    })
  );

  return { notifications, unreadCount: count ?? 0 };
}

// ---------------------------------------------------------------------------
// Mark notification as read
// ---------------------------------------------------------------------------
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  const ctx = await getFamilyContext();
  if (!ctx) return;

  await ctx.supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", ctx.userId);

  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Mark all notifications as read
// ---------------------------------------------------------------------------
export async function markAllNotificationsRead(): Promise<void> {
  const ctx = await getFamilyContext();
  if (!ctx) return;

  await ctx.supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", ctx.userId)
    .eq("read", false);

  revalidatePath("/", "layout");
}
