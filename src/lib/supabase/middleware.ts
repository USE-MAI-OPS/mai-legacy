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

  // If user is authenticated, check if they have a family.
  // Use a cookie cache to avoid a DB query on every single request.
  if (user && !isPublicRoute) {
    const cacheKey = "mai_has_family";
    const cached = request.cookies.get(cacheKey)?.value;
    // Cache format: "<user_id>:1" (has family) or "<user_id>:0" (no family)
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
      // Cache result for 5 minutes to avoid DB hits on subsequent requests
      supabaseResponse.cookies.set(cacheKey, `${user.id}:${hasFamilyMembership ? "1" : "0"}`, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 300, // 5 minutes
      });
    }

    if (!hasFamilyMembership && pathname !== "/onboarding") {
      // No family yet — force onboarding
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (hasFamilyMembership && pathname === "/onboarding") {
      // Already has a family — redirect away from onboarding
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
