import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendWaitlistConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // Rate-limit: 5 requests per IP per hour
  const ip = getClientIp(req);
  const rl = rateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { email, name, source = "landing", _hp } = body as Record<string, string>;

  // Honeypot field — bots fill this, humans don't
  if (_hp) {
    return NextResponse.json({ ok: true }); // silent reject
  }

  // Email validation
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 422 });
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("waitlist").upsert(
    {
      email: trimmedEmail,
      name: typeof name === "string" ? name.trim() || null : null,
      source: typeof source === "string" ? source.slice(0, 64) : "landing",
    },
    { onConflict: "email", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[waitlist] upsert error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Send confirmation email — fire and forget, don't block the response
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://usemai.com";
  sendWaitlistConfirmation({ to: trimmedEmail, name: typeof name === "string" ? name.trim() : undefined, appUrl }).catch(
    (err) => console.error("[waitlist] email error", err)
  );

  return NextResponse.json({ ok: true });
}
