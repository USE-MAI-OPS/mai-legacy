import { describe, it, expect } from "vitest";
import { getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect", () => {
  it("returns fallback for null input", () => {
    expect(getSafeRedirect(null)).toBe("/dashboard");
  });

  it("returns fallback for undefined input", () => {
    expect(getSafeRedirect(undefined)).toBe("/dashboard");
  });

  it("returns fallback for empty string", () => {
    expect(getSafeRedirect("")).toBe("/dashboard");
  });

  it("returns a valid relative path as-is", () => {
    expect(getSafeRedirect("/settings")).toBe("/settings");
    expect(getSafeRedirect("/dashboard")).toBe("/dashboard");
    expect(getSafeRedirect("/entries/123")).toBe("/entries/123");
  });

  it("blocks protocol-relative URLs (double slash)", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/dashboard");
    expect(getSafeRedirect("//evil.com/path")).toBe("/dashboard");
  });

  it("blocks absolute URLs (no leading slash)", () => {
    expect(getSafeRedirect("https://evil.com")).toBe("/dashboard");
    expect(getSafeRedirect("http://evil.com/login")).toBe("/dashboard");
  });

  it("blocks backslash tricks", () => {
    expect(getSafeRedirect("/\\evil.com")).toBe("/dashboard");
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
