const COOKIE_NAME = "mai_active_family";

/**
 * Client-side: read the active family ID from the cookie.
 */
export function getActiveFamilyIdClient(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Client-side: set the active family cookie.
 */
export function setActiveFamilyIdClient(familyId: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(familyId)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
