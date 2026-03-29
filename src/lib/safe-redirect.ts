/**
 * Validates a redirect path to prevent open-redirect attacks.
 * Only allows relative paths that start with "/" and do not escape to external URLs.
 */
export function getSafeRedirect(
  url: string | null | undefined,
  fallback: string = "/dashboard"
): string {
  if (!url) return fallback;

  // Must start with exactly one slash (not "//protocol-relative")
  if (!url.startsWith("/") || url.startsWith("//")) return fallback;

  // Block backslash tricks (e.g. "/\evil.com") that some browsers normalize
  if (url.includes("\\")) return fallback;

  return url;
}
