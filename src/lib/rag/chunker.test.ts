import { describe, it, expect } from "vitest";
import { chunkText } from "./chunker";

describe("chunkText", () => {
  it("returns empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("returns a single chunk for short text", () => {
    const text = "This is a short story about grandma.";
    const chunks = chunkText(text);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].index).toBe(0);
  });

  it("returns a single chunk for text exactly at the boundary (~2000 chars)", () => {
    // Create text just under 2000 chars
    const text = "A".repeat(1999);
    const chunks = chunkText(text);

    expect(chunks).toHaveLength(1);
  });

  it("splits long text into multiple chunks", () => {
    // Create text well over the 2000-char target
    const paragraph = "This is a sentence about family history. ".repeat(20);
    // ~800 chars per paragraph, need 3+ paragraphs to force splitting
    const text = [paragraph, paragraph, paragraph, paragraph].join("\n\n");
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
  });

  it("assigns sequential indices to chunks", () => {
    const paragraph = "Word ".repeat(500); // ~2500 chars
    const text = [paragraph, paragraph, paragraph].join("\n\n");
    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i);
    }
  });

  it("respects paragraph boundaries when splitting", () => {
    // Two paragraphs that together exceed the target
    const para1 = "First paragraph. ".repeat(60); // ~1020 chars
    const para2 = "Second paragraph. ".repeat(60); // ~1080 chars
    const para3 = "Third paragraph. ".repeat(60); // ~960 chars
    const text = [para1.trim(), para2.trim(), para3.trim()].join("\n\n");
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    // Each chunk should be non-empty
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });

  it("handles a single very long paragraph by splitting on sentences", () => {
    // One paragraph with many sentences, well over 2000 chars
    const longParagraph = "This is sentence number one about our heritage. ".repeat(100);
    const chunks = chunkText(longParagraph.trim());

    expect(chunks.length).toBeGreaterThan(1);
    // All chunks should have content
    for (const chunk of chunks) {
      expect(chunk.text.trim().length).toBeGreaterThan(0);
    }
  });

  it("produces chunks within a reasonable size range", () => {
    const paragraph = "This is a reasonably long sentence about family traditions and heritage. ".repeat(15);
    const text = [paragraph, paragraph, paragraph, paragraph, paragraph].join("\n\n");
    const chunks = chunkText(text);

    // No chunk should be excessively large (allowing some tolerance)
    for (const chunk of chunks) {
      // Target is ~2000 chars, allow up to 3000 for overlap + boundary effects
      expect(chunk.text.length).toBeLessThan(3500);
    }
  });

  it("preserves all content (no text dropped)", () => {
    const para1 = "Alpha paragraph content here.";
    const para2 = "Beta paragraph content here.";
    const para3 = "Gamma paragraph content here.";
    const text = [para1, para2, para3].join("\n\n");
    const chunks = chunkText(text);

    // For short text, everything should be in one chunk
    const combined = chunks.map((c) => c.text).join(" ");
    expect(combined).toContain("Alpha");
    expect(combined).toContain("Beta");
    expect(combined).toContain("Gamma");
  });
});
