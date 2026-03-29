import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Paths that use their own secret-based authentication (e.g. webhook
 * signature verification) and must not be subject to Origin checks.
 */
const CSRF_EXEMPT_PATHS = [
  "/api/stripe/webhook",
  "/api/telegram/webhook",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(request: NextRequest) {
  // --- CSRF: validate Origin header on mutating API requests ---
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    MUTATING_METHODS.has(request.method) &&
    !CSRF_EXEMPT_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (!origin) {
      // Reject requests with no Origin header (cross-origin requests
      // from forms and fetch always include it; same-origin requests
      // from browsers do too for mutating methods).
      return NextResponse.json(
        { error: "Missing Origin header" },
        { status: 403 }
      );
    }

    // Compare the Origin's host against the request Host header and
    // the configured app URL.
    const originHost = new URL(origin).host;
    const allowedHosts = new Set<string>();
    if (host) allowedHosts.add(host);
    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        allowedHosts.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host);
      } catch {
        // Ignore malformed env var.
      }
    }
    allowedHosts.add("localhost:3000");

    if (!allowedHosts.has(originHost)) {
      return NextResponse.json(
        { error: "Invalid Origin" },
        { status: 403 }
      );
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
