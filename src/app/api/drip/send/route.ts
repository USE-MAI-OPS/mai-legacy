import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendDripDay3, sendDripDay7 } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://usemai.com";

/**
 * POST /api/drip/send
 *
 * Sends Day 3 and Day 7 drip onboarding emails to eligible users.
 * Triggered by Vercel Cron (daily at 14:00 UTC).
 *
 * Eligibility:
 *   - Day 3: user enrolled (has 'welcome' log entry) >= 3 days ago, no 'day3' log entry
 *   - Day 7: user enrolled >= 7 days ago, no 'day7' log entry
 *
 * Auth: CRON_SECRET header required.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find users enrolled >= 3 days ago who haven't received day3 yet
  const { data: day3Candidates, error: day3Err } = await supabase
    .from("drip_email_log")
    .select("user_id, sent_at")
    .eq("step", "welcome")
    .lte("sent_at", threeDaysAgo);

  if (day3Err) {
    console.error("[drip/send] Failed to query day3 candidates:", day3Err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Find users enrolled >= 7 days ago who haven't received day7 yet
  const { data: day7Candidates, error: day7Err } = await supabase
    .from("drip_email_log")
    .select("user_id, sent_at")
    .eq("step", "welcome")
    .lte("sent_at", sevenDaysAgo);

  if (day7Err) {
    console.error("[drip/send] Failed to query day7 candidates:", day7Err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Collect user IDs that already have day3/day7 sent
  const allCandidateIds = [
    ...new Set([
      ...(day3Candidates ?? []).map((r) => r.user_id),
      ...(day7Candidates ?? []).map((r) => r.user_id),
    ]),
  ];

  if (allCandidateIds.length === 0) {
    return NextResponse.json({ day3Sent: 0, day7Sent: 0 });
  }

  const { data: alreadySent } = await supabase
    .from("drip_email_log")
    .select("user_id, step")
    .in("user_id", allCandidateIds)
    .in("step", ["day3", "day7"]);

  const sentSet = new Set((alreadySent ?? []).map((r) => `${r.user_id}:${r.step}`));

  const day3Pending = (day3Candidates ?? []).filter(
    (r) => !sentSet.has(`${r.user_id}:day3`)
  );
  const day7Pending = (day7Candidates ?? []).filter(
    (r) => !sentSet.has(`${r.user_id}:day7`)
  );

  let day3Sent = 0;
  let day7Sent = 0;

  async function resolveUser(userId: string): Promise<{ email: string; displayName: string } | null> {
    const { data } = await supabase.auth.admin.getUserById(userId);
    const user = data?.user;
    if (!user?.email) return null;
    const displayName =
      (user.user_metadata?.display_name as string | undefined) ?? user.email.split("@")[0];
    return { email: user.email, displayName };
  }

  for (const candidate of day3Pending) {
    const user = await resolveUser(candidate.user_id);
    if (!user) continue;
    try {
      await sendDripDay3({ to: user.email, displayName: user.displayName, appUrl: APP_URL });
      await supabase.from("drip_email_log").insert({ user_id: candidate.user_id, step: "day3" });
      day3Sent++;
    } catch (err) {
      console.error(`[drip/send] day3 failed for ${candidate.user_id}:`, err);
    }
  }

  for (const candidate of day7Pending) {
    const user = await resolveUser(candidate.user_id);
    if (!user) continue;
    try {
      await sendDripDay7({ to: user.email, displayName: user.displayName, appUrl: APP_URL });
      await supabase.from("drip_email_log").insert({ user_id: candidate.user_id, step: "day7" });
      day7Sent++;
    } catch (err) {
      console.error(`[drip/send] day7 failed for ${candidate.user_id}:`, err);
    }
  }

  return NextResponse.json({ day3Sent, day7Sent });
}
