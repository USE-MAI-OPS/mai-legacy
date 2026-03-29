/**
 * PII Sanitizer — strips or tokenizes personally identifiable information
 * before text is sent to external LLM providers.
 *
 * Handles:
 *   - Names       → replaced with consistent [PERSON_N] tokens (reversible)
 *   - Emails      → stripped entirely (not needed by LLMs)
 *   - Phones      → stripped entirely (not needed by LLMs)
 *   - SSN-like    → stripped (###-##-####)
 *
 * Usage:
 *   const ctx = buildPiiContext(members);
 *   const clean = sanitize(text, ctx);
 *   // ... send `clean` to LLM, get response ...
 *   const restored = restore(response, ctx);
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnownMember {
  displayName: string;
  email?: string | null;
  phone?: string | null;
  nickname?: string | null;
}

export interface PiiContext {
  /** Real name → token, sorted longest-first so "Mary Jane" replaces before "Mary" */
  nameToToken: Map<string, string>;
  /** Token → real name for restoring LLM responses */
  tokenToName: Map<string, string>;
  /** Known email addresses to strip */
  knownEmails: Set<string>;
  /** Known phone numbers to strip */
  knownPhones: Set<string>;
}

// ---------------------------------------------------------------------------
// Build context from known family members
// ---------------------------------------------------------------------------

export function buildPiiContext(members: KnownMember[]): PiiContext {
  const nameToToken = new Map<string, string>();
  const tokenToName = new Map<string, string>();
  const knownEmails = new Set<string>();
  const knownPhones = new Set<string>();

  let counter = 1;

  for (const m of members) {
    if (!m.displayName) continue;

    const token = `[PERSON_${counter}]`;
    counter++;

    // Map full display name
    nameToToken.set(m.displayName, token);
    tokenToName.set(token, m.displayName);

    // Map nickname if present
    if (m.nickname && m.nickname !== m.displayName) {
      nameToToken.set(m.nickname, token);
    }

    // Map first name if multi-word and at least 3 chars (avoid "Jo", "Al" collisions)
    const parts = m.displayName.split(/\s+/);
    if (parts.length > 1 && parts[0].length >= 3) {
      if (!nameToToken.has(parts[0])) {
        nameToToken.set(parts[0], token);
      }
    }

    if (m.email) knownEmails.add(m.email);
    if (m.phone) knownPhones.add(m.phone);
  }

  return { nameToToken, tokenToName, knownEmails, knownPhones };
}

// ---------------------------------------------------------------------------
// Regex patterns for PII we always strip (not tokenized — just removed)
// ---------------------------------------------------------------------------

/** Matches most email addresses */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Matches US/intl phone patterns: +1 (555) 123-4567, 555-123-4567, etc. */
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;

/** Matches US SSN patterns: 123-45-6789 */
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;

// ---------------------------------------------------------------------------
// Sanitize — replace PII with tokens / redaction markers
// ---------------------------------------------------------------------------

/**
 * Sanitize a block of text by replacing known PII with tokens.
 *
 * Order of operations:
 *   1. Replace known emails and phones with [REDACTED]
 *   2. Replace names with [PERSON_N] tokens (longest first)
 *   3. Catch remaining emails/phones/SSNs via regex
 */
export function sanitize(text: string, ctx: PiiContext): string {
  let result = text;

  // 1. Strip known emails
  for (const email of ctx.knownEmails) {
    result = replaceAll(result, email, "[REDACTED_EMAIL]");
  }

  // 2. Strip known phones
  for (const phone of ctx.knownPhones) {
    result = replaceAll(result, phone, "[REDACTED_PHONE]");
  }

  // 3. Replace names — process longest names first to avoid partial matches
  const sortedNames = [...ctx.nameToToken.entries()].sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [name, token] of sortedNames) {
    result = replaceName(result, name, token);
  }

  // 4. Catch any remaining emails/phones/SSNs via regex
  result = result.replace(EMAIL_RE, "[REDACTED_EMAIL]");
  result = result.replace(SSN_RE, "[REDACTED_SSN]");

  // Phone regex is aggressive — only apply if the match looks like a real phone
  // (at least 7 digits to avoid matching years like 1965)
  result = result.replace(PHONE_RE, (match) => {
    const digits = match.replace(/\D/g, "");
    return digits.length >= 7 ? "[REDACTED_PHONE]" : match;
  });

  return result;
}

// ---------------------------------------------------------------------------
// Restore — replace tokens in LLM output with real names
// ---------------------------------------------------------------------------

/**
 * Restore [PERSON_N] tokens in an LLM response back to real names.
 * Only restores name tokens — redacted emails/phones stay redacted.
 */
export function restore(text: string, ctx: PiiContext): string {
  let result = text;

  for (const [token, name] of ctx.tokenToName) {
    result = replaceAll(result, token, name);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Case-sensitive replaceAll (no regex special chars in the needle). */
function replaceAll(haystack: string, needle: string, replacement: string): string {
  if (!needle) return haystack;
  let result = haystack;
  let idx = result.indexOf(needle);
  while (idx !== -1) {
    result = result.slice(0, idx) + replacement + result.slice(idx + needle.length);
    idx = result.indexOf(needle, idx + replacement.length);
  }
  return result;
}

/**
 * Replace a name in text with a token, using word-boundary-aware matching.
 * This prevents replacing "Mary" inside "Maryland".
 */
function replaceName(text: string, name: string, token: string): string {
  // Escape regex special chars in the name
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escaped}\\b`, "g");
  return text.replace(re, token);
}
