import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth check if Supabase is not configured yet
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession() instead of getUser() in middleware for performance.
  // getSession() reads the JWT from cookies locally (no network round-trip),
  // while getUser() hits the Supabase Auth server on every request.
  // Actual user verification still happens in server actions via getUser().
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to login (except for public routes)
  const publicRoutes = ["/", "/login", "/signup", "/invite", "/auth/callback", "/demo", "/terms", "/privacy", "/forgot-password", "/reset-password", "/contact", "/pricing", "/explore", "/blog"];
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith("/auth/") ||
      pathname.startsWith("/invite/") ||
      pathname.startsWith("/demo") ||
      pathname.startsWith("/explore") ||
      pathname.startsWith("/blog") ||
      pathname.startsWith("/p/")
  );

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated, enforce verification + family checks
  if (user && !isPublicRoute) {
    // --- Email verification check ---
    const verifyKey = "mai_email_verified";
    const verifyCached = request.cookies.get(verifyKey)?.value;
    const verifyCachedForUser = verifyCached?.startsWith(user.id + ":");
    const isVerifiedCached = verifyCachedForUser
      ? verifyCached === `${user.id}:1`
      : undefined;

    let isEmailVerified: boolean;
    if (isVerifiedCached !== undefined) {
      isEmailVerified = isVerifiedCached;
    } else {
      // Grandfather existing users created before verification feature (2026-04-08)
      const createdAt = user.created_at ? new Date(user.created_at) : null;
      const verificationLaunchDate = new Date("2026-04-08T00:00:00Z");

      if (createdAt && createdAt < verificationLaunchDate) {
        isEmailVerified = true;
      } else {
        const { data: verification } = await supabase
          .from("email_verifications")
          .select("id")
          .eq("user_id", user.id)
          .not("verified_at", "is", null)
          .limit(1)
          .maybeSingle();
        isEmailVerified = !!verification;
      }
      // Cache for 1 hour
      supabaseResponse.cookies.set(verifyKey, `${user.id}:${isEmailVerified ? "1" : "0"}`, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 3600,
      });
    }

    // Allow /verify-email page for unverified users
    if (pathname === "/verify-email") {
      if (isEmailVerified) {
        // Already verified — move them along
        const url = request.nextUrl.clone();
        const redirect = url.searchParams.get("redirect");
        url.pathname = redirect || "/onboarding";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return supabaseResponse; // Allow access to verify page
    }

    // If not verified, force to /verify-email
    if (!isEmailVerified) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify-email";
      return NextResponse.redirect(url);
    }

    // --- Family membership check ---
    const cacheKey = "mai_has_family";
    const cached = request.cookies.get(cacheKey)?.value;
    const cachedForThisUser = cached?.startsWith(user.id + ":");
    const hasFamilyCached = cachedForThisUser
      ? cached === `${user.id}:1`
      : undefined;

    let hasFamilyMembership: boolean;
    if (hasFamilyCached !== undefined) {
      hasFamilyMembership = hasFamilyCached;
    } else {
      const { data: membership } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      hasFamilyMembership = !!membership;
      supabaseResponse.cookies.set(cacheKey, `${user.id}:${hasFamilyMembership ? "1" : "0"}`, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 300,
      });
    }

    if (!hasFamilyMembership && pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (hasFamilyMembership && pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
