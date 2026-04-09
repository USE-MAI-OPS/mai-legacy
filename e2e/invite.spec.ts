import { test, expect } from "@playwright/test";
import {
  mockGetUser,
  mockInviteFetch,
  mockFamilyFetch,
  mockFamilyMemberFetch,
} from "./helpers/supabase-mock";

/**
 * Invite acceptance page — tests for the /invite/[id] route.
 *
 * The page is a client component that fetches invite data from Supabase
 * directly, so we intercept REST API calls to control test scenarios.
 */

test.describe("Invite acceptance page", () => {
  const INVITE_URL = "/invite/e2e-test-invite-id";

  test("shows loading state initially", async ({ page }) => {
    // Don't set up mocks so the request hangs
    await page.route("**/rest/v1/family_invites**", async () => {
      // intentionally never fulfill — keeps loading state visible
    });
    await page.route("**/auth/v1/user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    await page.goto(INVITE_URL);
    await expect(page.getByText(/loading invite/i)).toBeVisible();
  });

  test("shows error for invalid invite", async ({ page }) => {
    // Mock no user session
    await page.route("**/auth/v1/user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    // Mock invite not found (Supabase returns error for .single() with no rows)
    await page.route("**/rest/v1/family_invites**", async (route) => {
      await route.fulfill({
        status: 406,
        contentType: "application/json",
        body: JSON.stringify({
          code: "PGRST116",
          message: "JSON object requested, multiple (or no) rows returned",
        }),
      });
    });

    await page.goto(INVITE_URL);
    await expect(
      page.getByText(/invalid invite|has been removed/i)
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /invalid/i })).toBeVisible();
  });

  test("shows expired state for expired invite", async ({ page }) => {
    // Mock no user session
    await page.route("**/auth/v1/user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    // Mock expired invite
    await mockInviteFetch(page, {
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    });
    await mockFamilyFetch(page, { name: "The Powells" });
    await mockFamilyMemberFetch(page, { display_name: "Kobe" });

    await page.goto(INVITE_URL);
    await expect(page.getByText(/invite expired/i)).toBeVisible();
    await expect(page.getByText(/the powells/i)).toBeVisible();
  });

  test("shows login/signup prompt for unauthenticated user", async ({
    page,
  }) => {
    // Mock no user session
    await page.route("**/auth/v1/user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    // Mock valid, non-expired invite
    await mockInviteFetch(page, {
      family_id: "e2e-family-id",
      invited_by: "e2e-inviter-id",
      role: "member",
      accepted: false,
    });
    await mockFamilyFetch(page, { name: "The Powells" });
    await mockFamilyMemberFetch(page, { display_name: "Kobe" });

    await page.goto(INVITE_URL);

    await expect(
      page.getByRole("heading", { name: /you're invited/i })
    ).toBeVisible();
    await expect(page.getByText(/the powells/i)).toBeVisible();
    await expect(page.getByText(/kobe/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /sign up to join/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /already have an account/i })
    ).toBeVisible();
  });

  test("shows accept form for authenticated user with valid invite", async ({
    page,
  }) => {
    // Mock authenticated user
    await mockGetUser(page);

    // Mock valid invite
    await mockInviteFetch(page, {
      family_id: "e2e-family-id",
      invited_by: "e2e-inviter-id",
      role: "member",
      accepted: false,
    });
    await mockFamilyFetch(page, { name: "The Smiths" });
    await mockFamilyMemberFetch(page, { display_name: "Jane" });

    await page.goto(INVITE_URL);

    await expect(
      page.getByRole("heading", { name: /you're invited/i })
    ).toBeVisible();
    await expect(page.getByText(/the smiths/i)).toBeVisible();
    await expect(page.getByText(/jane/i)).toBeVisible();
    await expect(page.getByLabel(/display name/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /accept.*join/i })
    ).toBeVisible();
  });

  test("accept button is disabled when display name is empty", async ({
    page,
  }) => {
    await mockGetUser(page);
    await mockInviteFetch(page, {});
    await mockFamilyFetch(page, { name: "Test Family" });
    await mockFamilyMemberFetch(page, { display_name: "Inviter" });

    await page.goto(INVITE_URL);

    const acceptButton = page.getByRole("button", { name: /accept.*join/i });
    await expect(acceptButton).toBeVisible();
    await expect(acceptButton).toBeDisabled();

    // Fill in a name and verify button enables
    await page.getByLabel(/display name/i).fill("New Member");
    await expect(acceptButton).toBeEnabled();
  });

  test("shows already accepted error", async ({ page }) => {
    await page.route("**/auth/v1/user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    await mockInviteFetch(page, { accepted: true });

    await page.goto(INVITE_URL);
    await expect(page.getByText(/already been accepted/i)).toBeVisible();
  });

  test("signup link includes redirect back to invite", async ({ page }) => {
    await page.route("**/auth/v1/user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    await mockInviteFetch(page, {});
    await mockFamilyFetch(page, { name: "Family" });
    await mockFamilyMemberFetch(page, { display_name: "Admin" });

    await page.goto(INVITE_URL);

    const signupLink = page.getByRole("link", { name: /sign up to join/i });
    await expect(signupLink).toHaveAttribute(
      "href",
      expect.stringContaining("/signup?redirect=/invite/")
    );
  });
});
