import { describe, it, expect } from "vitest";
import {
  buildPiiContext,
  sanitize,
  restore,
  type KnownMember,
} from "./sanitizer";

// ---------------------------------------------------------------------------
// buildPiiContext
// ---------------------------------------------------------------------------

describe("buildPiiContext", () => {
  it("assigns incremental PERSON tokens", () => {
    const members: KnownMember[] = [
      { displayName: "Alice Johnson" },
      { displayName: "Bob Smith" },
    ];
    const ctx = buildPiiContext(members);

    expect(ctx.nameToToken.get("Alice Johnson")).toBe("[PERSON_1]");
    expect(ctx.nameToToken.get("Bob Smith")).toBe("[PERSON_2]");
    expect(ctx.tokenToName.get("[PERSON_1]")).toBe("Alice Johnson");
    expect(ctx.tokenToName.get("[PERSON_2]")).toBe("Bob Smith");
  });

  it("maps nicknames to the same token as the display name", () => {
    const members: KnownMember[] = [
      { displayName: "Robert Johnson", nickname: "Bobby" },
    ];
    const ctx = buildPiiContext(members);

    expect(ctx.nameToToken.get("Robert Johnson")).toBe("[PERSON_1]");
    expect(ctx.nameToToken.get("Bobby")).toBe("[PERSON_1]");
  });

  it("maps first names (>= 3 chars) from multi-word names", () => {
    const members: KnownMember[] = [
      { displayName: "Alice Johnson" },
    ];
    const ctx = buildPiiContext(members);

    expect(ctx.nameToToken.get("Alice")).toBe("[PERSON_1]");
  });

  it("does not map short first names (< 3 chars)", () => {
    const members: KnownMember[] = [
      { displayName: "Al Johnson" },
    ];
    const ctx = buildPiiContext(members);

    expect(ctx.nameToToken.has("Al")).toBe(false);
  });

  it("does not map first names from single-word display names", () => {
    const members: KnownMember[] = [{ displayName: "Madonna" }];
    const ctx = buildPiiContext(members);

    // "Madonna" is the full name, not a first name from a multi-word name
    expect(ctx.nameToToken.get("Madonna")).toBe("[PERSON_1]");
    expect(ctx.nameToToken.size).toBe(1);
  });

  it("collects known emails and phones", () => {
    const members: KnownMember[] = [
      {
        displayName: "Alice Johnson",
        email: "alice@example.com",
        phone: "555-123-4567",
      },
    ];
    const ctx = buildPiiContext(members);

    expect(ctx.knownEmails.has("alice@example.com")).toBe(true);
    expect(ctx.knownPhones.has("555-123-4567")).toBe(true);
  });

  it("skips members with empty displayName", () => {
    const members: KnownMember[] = [
      { displayName: "" },
      { displayName: "Alice Johnson" },
    ];
    const ctx = buildPiiContext(members);

    // Counter should skip the empty one, so Alice gets PERSON_1
    expect(ctx.nameToToken.size).toBe(2); // "Alice Johnson" + "Alice"
    expect(ctx.tokenToName.size).toBe(1);
  });

  it("does not clobber first-name mapping if already taken by another member", () => {
    const members: KnownMember[] = [
      { displayName: "Alice Johnson" },
      { displayName: "Alice Williams" },
    ];
    const ctx = buildPiiContext(members);

    // "Alice" was already mapped to PERSON_1 by the first member
    expect(ctx.nameToToken.get("Alice")).toBe("[PERSON_1]");
  });
});

// ---------------------------------------------------------------------------
// sanitize
// ---------------------------------------------------------------------------

describe("sanitize", () => {
  const members: KnownMember[] = [
    {
      displayName: "Mary Jane Watson",
      email: "mj@dailybugle.com",
      phone: "555-867-5309",
      nickname: "MJ",
    },
    { displayName: "Peter Parker" },
  ];

  it("replaces known names with PERSON tokens", () => {
    const ctx = buildPiiContext(members);
    const input = "Mary Jane Watson went to the store with Peter Parker.";
    const result = sanitize(input, ctx);

    expect(result).toBe("[PERSON_1] went to the store with [PERSON_2].");
    expect(result).not.toContain("Mary Jane Watson");
    expect(result).not.toContain("Peter Parker");
  });

  it("replaces first names with word-boundary matching", () => {
    const ctx = buildPiiContext(members);
    const input = "Mary went to Maryland.";
    const result = sanitize(input, ctx);

    // "Mary" should be replaced but "Maryland" should NOT (word boundary)
    expect(result).toContain("[PERSON_1]");
    expect(result).toContain("Maryland");
  });

  it("replaces known emails with [REDACTED_EMAIL]", () => {
    const ctx = buildPiiContext(members);
    const input = "Contact me at mj@dailybugle.com for details.";
    const result = sanitize(input, ctx);

    expect(result).toContain("[REDACTED_EMAIL]");
    expect(result).not.toContain("mj@dailybugle.com");
  });

  it("replaces known phones with [REDACTED_PHONE]", () => {
    const ctx = buildPiiContext(members);
    const input = "Call me at 555-867-5309.";
    const result = sanitize(input, ctx);

    expect(result).toContain("[REDACTED_PHONE]");
    expect(result).not.toContain("555-867-5309");
  });

  it("catches unknown emails via regex", () => {
    const ctx = buildPiiContext(members);
    const input = "Send it to stranger@unknown.org please.";
    const result = sanitize(input, ctx);

    expect(result).toContain("[REDACTED_EMAIL]");
    expect(result).not.toContain("stranger@unknown.org");
  });

  it("catches SSN patterns via regex", () => {
    const ctx = buildPiiContext(members);
    const input = "My SSN is 123-45-6789.";
    const result = sanitize(input, ctx);

    expect(result).toContain("[REDACTED_SSN]");
    expect(result).not.toContain("123-45-6789");
  });

  it("does not flag years as phone numbers", () => {
    const ctx = buildPiiContext(members);
    const input = "She was born in 1965 in Chicago.";
    const result = sanitize(input, ctx);

    // 4 digits should not be treated as a phone number
    expect(result).toContain("1965");
  });

  it("replaces nicknames with the same token as the display name", () => {
    const ctx = buildPiiContext(members);
    const input = "MJ said hello.";
    const result = sanitize(input, ctx);

    expect(result).toBe("[PERSON_1] said hello.");
  });
});

// ---------------------------------------------------------------------------
// restore
// ---------------------------------------------------------------------------

describe("restore", () => {
  it("restores PERSON tokens back to real names", () => {
    const members: KnownMember[] = [
      { displayName: "Alice Johnson" },
      { displayName: "Bob Smith" },
    ];
    const ctx = buildPiiContext(members);
    const llmResponse = "[PERSON_1] told [PERSON_2] about the recipe.";
    const result = restore(llmResponse, ctx);

    expect(result).toBe("Alice Johnson told Bob Smith about the recipe.");
  });

  it("does not restore REDACTED markers (they stay redacted)", () => {
    const ctx = buildPiiContext([{ displayName: "Alice Johnson" }]);
    const llmResponse = "[PERSON_1] can be reached at [REDACTED_EMAIL].";
    const result = restore(llmResponse, ctx);

    expect(result).toBe("Alice Johnson can be reached at [REDACTED_EMAIL].");
  });
});

// ---------------------------------------------------------------------------
// Round-trip: sanitize → (LLM simulation) → restore
// ---------------------------------------------------------------------------

describe("sanitize → restore round-trip", () => {
  it("preserves original names through the full pipeline", () => {
    const members: KnownMember[] = [
      { displayName: "Grandma Rosa Parks", nickname: "Nana" },
      { displayName: "Uncle Marcus Johnson" },
    ];
    const ctx = buildPiiContext(members);

    const input =
      "Grandma Rosa Parks always told Uncle Marcus Johnson to be strong. " +
      "Nana had a recipe for cornbread.";

    const sanitized = sanitize(input, ctx);
    expect(sanitized).not.toContain("Grandma Rosa Parks");
    expect(sanitized).not.toContain("Uncle Marcus Johnson");
    expect(sanitized).not.toContain("Nana");

    // Simulate LLM echoing back the tokens
    const llmOutput = sanitized.replace("be strong", "be brave");

    const restored = restore(llmOutput, ctx);
    expect(restored).toContain("Grandma Rosa Parks");
    expect(restored).toContain("Uncle Marcus Johnson");
    expect(restored).not.toContain("[PERSON_");
  });
});
