import { cookies } from "next/headers";

const COOKIE_NAME = "mai_active_family";

/**
 * Server-side: read the active family ID from the cookie.
 * Returns null if the cookie doesn't exist.
 */
export async function getActiveFamilyIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Server-side: set the active family cookie.
 */
export async function setActiveFamilyCookie(familyId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, familyId, {
    path: "/",
    httpOnly: false, // client-side needs to read it for the switcher
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
