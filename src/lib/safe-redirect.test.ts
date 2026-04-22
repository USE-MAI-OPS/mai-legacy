import { describe, it, expect } from "vitest";
import { getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect", () => {
  it("returns fallback for null input", () => {
    expect(getSafeRedirect(null)).toBe("/feed");
  });

  it("returns fallback for undefined input", () => {
    expect(getSafeRedirect(undefined)).toBe("/feed");
  });

  it("returns fallback for empty string", () => {
    expect(getSafeRedirect("")).toBe("/feed");
  });

  it("returns a valid relative path as-is", () => {
    expect(getSafeRedirect("/settings")).toBe("/settings");
    expect(getSafeRedirect("/feed")).toBe("/feed");
    expect(getSafeRedirect("/entries/123")).toBe("/entries/123");
  });

  it("blocks protocol-relative URLs (double slash)", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/feed");
    expect(getSafeRedirect("//evil.com/path")).toBe("/feed");
  });

  it("blocks absolute URLs (no leading slash)", () => {
    expect(getSafeRedirect("https://evil.com")).toBe("/feed");
    expect(getSafeRedirect("http://evil.com/login")).toBe("/feed");
  });

  it("blocks backslash tricks", () => {
    expect(getSafeRedirect("/\\evil.com")).toBe("/feed");
  });

  it("uses custom fallback when provided", () => {
    expect(getSafeRedirect(null, "/home")).toBe("/home");
    expect(getSafeRedirect("//evil.com", "/home")).toBe("/home");
  });

  it("allows paths with query strings and fragments", () => {
    expect(getSafeRedirect("/search?q=hello")).toBe("/search?q=hello");
    expect(getSafeRedirect("/page#section")).toBe("/page#section");
  });
});
