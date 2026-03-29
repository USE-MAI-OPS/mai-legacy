import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/digest/unsubscribe?token=<token>
 *
 * Verifies the unsubscribe token, sets digest_opt_out=true for the member,
 * and returns a confirmation HTML page.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(confirmationPage("Invalid link", "This unsubscribe link is missing a token."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = createAdminClient();

  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, digest_opt_out")
    .eq("digest_unsubscribe_token", token)
    .single();

  if (error || !member) {
    return new NextResponse(
      confirmationPage("Invalid link", "We couldn't find an account matching this unsubscribe link."),
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  if (!member.digest_opt_out) {
    await supabase
      .from("family_members")
      .update({ digest_opt_out: true })
      .eq("id", member.id);
  }

  return new NextResponse(
    confirmationPage(
      "Unsubscribed",
      "You've been unsubscribed from weekly digest emails. You can re-enable them at any time from your family settings."
    ),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function confirmationPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — MAI Legacy</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:420px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background-color:#18181b;padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">MAI Legacy</h1>
    </div>
    <div style="padding:32px;text-align:center;">
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#18181b;">${title}</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">${message}</p>
      <a href="/" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
        Back to MAI Legacy
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
      <p style="margin:0;font-size:12px;color:#a1a1aa;">MAI Legacy — Preserve what matters.</p>
    </div>
  </div>
</body>
</html>`;
}
