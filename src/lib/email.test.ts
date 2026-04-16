import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the Resend module with a proper class constructor
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

describe("sendInviteEmail", () => {
  const originalEnv = process.env.RESEND_API_KEY;

  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockReset();
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalEnv;
    vi.resetModules();
  });

  it("sends email with correct parameters", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });

    // Re-import to get fresh module with mocked env
    const { sendInviteEmail } = await import("./email");

    const result = await sendInviteEmail({
      to: "test@example.com",
      inviteUrl: "https://mailegacy.com/invite/abc-123",
      familyName: "The Powells",
      inviterName: "Kobe",
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const callArgs = mockSend.mock.calls[0][0];

    expect(callArgs.from).toBe("MAI Legacy <noreply@usemai.com>");
    expect(callArgs.to).toBe("test@example.com");
    expect(callArgs.subject).toBe(
      "You're invited to join The Powells on MAI Legacy"
    );
    expect(callArgs.html).toContain("https://mailegacy.com/invite/abc-123");
    expect(callArgs.html).toContain("The Powells");
    expect(callArgs.html).toContain("Kobe");
    expect(result.data).toEqual({ id: "email-123" });
    expect(result.error).toBeNull();
  });

  it("returns error when Resend API fails", async () => {
    const resendError = {
      statusCode: 403,
      message: "The usemai.com domain is not verified.",
      name: "validation_error",
    };
    mockSend.mockResolvedValue({ data: null, error: resendError });

    const { sendInviteEmail } = await import("./email");

    const result = await sendInviteEmail({
      to: "someone@example.com",
      inviteUrl: "https://mailegacy.com/invite/xyz",
      familyName: "Test Family",
      inviterName: "Admin",
    });

    expect(result.error).toEqual(resendError);
    expect(result.data).toBeNull();
  });

  it("throws when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    vi.resetModules();

    // Re-mock after module reset with a proper class
    vi.doMock("resend", () => ({
      Resend: class {
        emails = { send: mockSend };
      },
    }));

    const { sendInviteEmail } = await import("./email");

    await expect(
      sendInviteEmail({
        to: "test@example.com",
        inviteUrl: "https://mailegacy.com/invite/abc",
        familyName: "Family",
        inviterName: "User",
      })
    ).rejects.toThrow("RESEND_API_KEY");
  });

  it("includes invite URL in both button and fallback link", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-456" }, error: null });

    const { sendInviteEmail } = await import("./email");

    await sendInviteEmail({
      to: "recipient@example.com",
      inviteUrl: "https://mailegacy.com/invite/unique-id",
      familyName: "The Smiths",
      inviterName: "Jane",
    });

    const html = mockSend.mock.calls[0][0].html;
    // The invite URL should appear at least twice (button href + fallback link)
    const urlMatches = html.match(
      /https:\/\/mailegacy\.com\/invite\/unique-id/g
    );
    expect(urlMatches).not.toBeNull();
    expect(urlMatches!.length).toBeGreaterThanOrEqual(2);
  });
});
