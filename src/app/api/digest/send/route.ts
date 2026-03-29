import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWeeklyDigest } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://usemai.com";

/**
 * POST /api/digest/send
 *
 * Sends the weekly digest email to all eligible family members.
 * Triggered by cron (every Sunday at 20:00 UTC).
 *
 * Auth: CRON_SECRET header required.
 * Skips: families with 0 new entries this week, members with digest_opt_out=true.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all families that have at least one entry in the last 7 days
  const { data: activeEntries, error: entriesError } = await supabase
    .from("entries")
    .select("family_id")
    .gte("created_at", oneWeekAgo);

  if (entriesError) {
    console.error("[digest/send] Failed to fetch active entries:", entriesError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const activeFamilyIds = [...new Set(activeEntries?.map((e) => e.family_id) ?? [])];

  if (activeFamilyIds.length === 0) {
    return NextResponse.json({ sent: 0, skippedFamilies: 0 });
  }

  // Fetch all members in active families who have not opted out
  const { data: members, error: membersError } = await supabase
    .from("family_members")
    .select("id, family_id, display_name, digest_opt_out, digest_unsubscribe_token, user_id")
    .in("family_id", activeFamilyIds)
    .eq("digest_opt_out", false);

  if (membersError) {
    console.error("[digest/send] Failed to fetch members:", membersError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Fetch user emails via auth.users (admin only)
  const userIds = [...new Set(members?.map((m) => m.user_id) ?? [])];
  const emailMap: Record<string, string> = {};

  for (const userId of userIds) {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (userData?.user?.email) {
      emailMap[userId] = userData.user.email;
    }
  }

  // Fetch families info
  const { data: families } = await supabase
    .from("families")
    .select("id, name")
    .in("id", activeFamilyIds);

  const familyNameMap: Record<string, string> = {};
  for (const f of families ?? []) {
    familyNameMap[f.id] = f.name;
  }

  // Fetch entries per family for this week
  const { data: weekEntries } = await supabase
    .from("entries")
    .select("family_id, title, type, author_id")
    .in("family_id", activeFamilyIds)
    .gte("created_at", oneWeekAgo)
    .order("created_at", { ascending: false });

  // Fetch author display names
  const authorIds = [...new Set(weekEntries?.map((e) => e.author_id) ?? [])];
  const authorNameMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: authorMembers } = await supabase
      .from("family_members")
      .select("user_id, display_name, family_id")
      .in("user_id", authorIds);

    for (const am of authorMembers ?? []) {
      authorNameMap[`${am.family_id}:${am.user_id}`] = am.display_name;
    }
  }

  // Fetch Griot discoveries per family for this week
  const { data: weekDiscoveries } = await supabase
    .from("griot_discoveries")
    .select("family_id, title, body")
    .in("family_id", activeFamilyIds)
    .gte("created_at", oneWeekAgo)
    .order("created_at", { ascending: false });

  // Fetch upcoming family events (next 7 days)
  const nowIso = new Date().toISOString();
  const nextWeekIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: upcomingEvents } = await supabase
    .from("family_events")
    .select("family_id, title, event_date")
    .in("family_id", activeFamilyIds)
    .gte("event_date", nowIso)
    .lte("event_date", nextWeekIso)
    .order("event_date", { ascending: true });

  let sent = 0;
  const errors: string[] = [];

  for (const member of members ?? []) {
    const email = emailMap[member.user_id];
    if (!email) continue;

    const familyId = member.family_id;
    const familyName = familyNameMap[familyId] ?? "Your Family";

    const entries = (weekEntries ?? [])
      .filter((e) => e.family_id === familyId)
      .map((e) => ({
        title: e.title,
        type: e.type,
        authorName: authorNameMap[`${familyId}:${e.author_id}`] ?? "A family member",
      }));

    const discoveries = (weekDiscoveries ?? [])
      .filter((d) => d.family_id === familyId)
      .map((d) => ({ title: d.title, body: d.body }));

    const events = (upcomingEvents ?? [])
      .filter((ev) => ev.family_id === familyId)
      .map((ev) => ({
        title: ev.title,
        eventDate: new Date(ev.event_date).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      }));

    const unsubscribeUrl = `${APP_URL}/api/digest/unsubscribe?token=${member.digest_unsubscribe_token}`;

    try {
      await sendWeeklyDigest({
        to: email,
        memberName: member.display_name,
        familyName,
        entries,
        discoveries,
        events,
        unsubscribeUrl,
        appUrl: APP_URL,
      });
      sent++;
    } catch (err) {
      console.error(`[digest/send] Failed to send to member ${member.id}:`, err);
      errors.push(member.id);
    }
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
}
