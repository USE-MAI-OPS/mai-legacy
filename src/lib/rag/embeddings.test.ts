import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateEmbedding, generateEmbeddings } from "./embeddings";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.stubEnv("GOOGLE_AI_API_KEY", "test-api-key");
  mockFetch.mockReset();
});

function mockEmbeddingResponse(count: number) {
  const embeddings = Array.from({ length: count }, () => ({
    values: Array.from({ length: 768 }, () => Math.random()),
  }));
  return {
    ok: true,
    json: async () => ({ embeddings }),
    text: async () => "",
  };
}

describe("generateEmbedding", () => {
  it("returns a 768-dimension vector for a single text", async () => {
    mockFetch.mockResolvedValueOnce(mockEmbeddingResponse(1));

    const result = await generateEmbedding("test query");

    expect(result).toHaveLength(768);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("defaults to RETRIEVAL_QUERY task type", async () => {
    mockFetch.mockResolvedValueOnce(mockEmbeddingResponse(1));

    await generateEmbedding("test query");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.requests[0].taskType).toBe("RETRIEVAL_QUERY");
  });

  it("passes RETRIEVAL_DOCUMENT when specified", async () => {
    mockFetch.mockResolvedValueOnce(mockEmbeddingResponse(1));

    await generateEmbedding("document content", "RETRIEVAL_DOCUMENT");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.requests[0].taskType).toBe("RETRIEVAL_DOCUMENT");
  });

  it("throws when GOOGLE_AI_API_KEY is missing", async () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "");

    await expect(generateEmbedding("test")).rejects.toThrow(
      "Missing GOOGLE_AI_API_KEY"
    );
  });
});

describe("generateEmbeddings", () => {
  it("returns empty array for empty input", async () => {
    const result = await generateEmbeddings([]);

    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles multiple texts in a single batch", async () => {
    mockFetch.mockResolvedValueOnce(mockEmbeddingResponse(3));

    const result = await generateEmbeddings(["text1", "text2", "text3"]);

    expect(result).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.requests).toHaveLength(3);
  });

  it("batches requests in groups of 100", async () => {
    mockFetch
      .mockResolvedValueOnce(mockEmbeddingResponse(100))
      .mockResolvedValueOnce(mockEmbeddingResponse(10));

    const texts = Array.from({ length: 110 }, (_, i) => `text ${i}`);
    const result = await generateEmbeddings(texts);

    expect(result).toHaveLength(110);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // First batch should have 100 requests
    const body1 = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body1.requests).toHaveLength(100);

    // Second batch should have 10
    const body2 = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body2.requests).toHaveLength(10);
  });

  it("includes the correct model and dimensions in requests", async () => {
    mockFetch.mockResolvedValueOnce(mockEmbeddingResponse(1));

    await generateEmbeddings(["test"]);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.requests[0].model).toBe("models/gemini-embedding-001");
    expect(body.requests[0].outputDimensionality).toBe(768);
  });

  it("throws on API error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    });

    await expect(generateEmbeddings(["test"])).rejects.toThrow(
      "Gemini embeddings API error (429)"
    );
  });

  it("defaults to RETRIEVAL_DOCUMENT task type", async () => {
    mockFetch.mockResolvedValueOnce(mockEmbeddingResponse(1));

    await generateEmbeddings(["test"]);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.requests[0].taskType).toBe("RETRIEVAL_DOCUMENT");
  });
});
