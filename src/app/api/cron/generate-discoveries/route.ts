import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runDiscoveryGeneration } from "../../discoveries/generate/route";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/generate-discoveries
 *
 * Runs daily. Picks families that qualify for a fresh discovery batch:
 *   - have ≥2 entries
 *   - AND either never had discoveries, OR last generation was ≥7 days ago
 *     AND at least one new entry exists since that generation
 *
 * Sequential LLM calls, capped per run so the whole job fits in the
 * maxDuration envelope.
 */
const BATCH_CAP = 10;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Pull all entries (family_id + created_at) and aggregate per family.
  //    Small payload per row, fine at current scale.
  const { data: entryRows, error: entriesError } = await admin
    .from("entries")
    .select("family_id, created_at");

  if (entriesError) {
    console.error("[cron/discoveries] Failed to fetch entries:", entriesError);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }

  const entryStats = new Map<string, { latest: number; count: number }>();
  for (const row of entryRows ?? []) {
    const familyId = row.family_id as string;
    const ts = new Date(row.created_at as string).getTime();
    const existing = entryStats.get(familyId);
    if (!existing) {
      entryStats.set(familyId, { latest: ts, count: 1 });
    } else {
      if (ts > existing.latest) existing.latest = ts;
      existing.count += 1;
    }
  }

  const eligibleFamilyIds = Array.from(entryStats.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([fid]) => fid);

  if (eligibleFamilyIds.length === 0) {
    return NextResponse.json({ processed: 0, skipped: 0, failed: 0, qualifying: 0 });
  }

  // 2. Latest discovery timestamp per eligible family.
  const { data: discoveryRows, error: discoveriesError } = await admin
    .from("griot_discoveries")
    .select("family_id, created_at")
    .in("family_id", eligibleFamilyIds);

  if (discoveriesError) {
    console.error("[cron/discoveries] Failed to fetch discoveries:", discoveriesError);
    return NextResponse.json({ error: "Failed to fetch discoveries" }, { status: 500 });
  }

  const latestDiscovery = new Map<string, number>();
  for (const row of discoveryRows ?? []) {
    const familyId = row.family_id as string;
    const ts = new Date(row.created_at as string).getTime();
    const existing = latestDiscovery.get(familyId);
    if (existing === undefined || ts > existing) {
      latestDiscovery.set(familyId, ts);
    }
  }

  // 3. Qualifying = never-generated OR (last-gen ≥7d ago AND new entries since).
  const now = Date.now();
  const qualifying = eligibleFamilyIds.filter((fid) => {
    const lastDisc = latestDiscovery.get(fid);
    if (lastDisc === undefined) return true;
    if (now - lastDisc < SEVEN_DAYS_MS) return false;
    const latestEntry = entryStats.get(fid)!.latest;
    return latestEntry > lastDisc;
  });

  if (qualifying.length === 0) {
    return NextResponse.json({
      processed: 0,
      skipped: 0,
      failed: 0,
      qualifying: 0,
      eligible: eligibleFamilyIds.length,
    });
  }

  const batch = qualifying.slice(0, BATCH_CAP);

  // 4. Sequential generation — safer for LLM rate limits than Promise.all.
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const familyId of batch) {
    try {
      const result = await runDiscoveryGeneration(admin, familyId);
      if (!result.ok) {
        console.error(`[cron/discoveries] Family ${familyId} failed:`, result.error);
        failed++;
      } else if (result.generated === 0) {
        skipped++;
      } else {
        processed++;
      }
    } catch (err) {
      console.error(`[cron/discoveries] Family ${familyId} threw:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    processed,
    skipped,
    failed,
    qualifying: qualifying.length,
    eligible: eligibleFamilyIds.length,
    batched: batch.length,
  });
}
