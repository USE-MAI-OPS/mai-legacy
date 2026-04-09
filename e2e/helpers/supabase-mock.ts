import type { Page, Route } from "@playwright/test";

/**
 * Stubs the Supabase Auth REST API so E2E tests run without a real Supabase
 * project. Call this in beforeEach / test body before navigating.
 */

const FAKE_USER = {
  id: "e2e-user-id",
  email: "e2e@example.com",
  role: "authenticated",
  aud: "authenticated",
  created_at: new Date().toISOString(),
  user_metadata: { display_name: "E2E User" },
};

const FAKE_SESSION = {
  access_token: "e2e-access-token",
  refresh_token: "e2e-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: FAKE_USER,
};

/** Mock a successful sign-up response */
export async function mockSignUp(page: Page) {
  await page.route("**/auth/v1/signup**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...FAKE_SESSION }),
    });
  });
}

/** Mock a successful sign-in response */
export async function mockSignIn(page: Page) {
  await page.route("**/auth/v1/token**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...FAKE_SESSION }),
    });
  });
}

/** Mock Supabase getUser to return the fake authenticated user */
export async function mockGetUser(page: Page) {
  await page.route("**/auth/v1/user**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FAKE_USER),
    });
  });
}

/** Mock the Stripe checkout endpoint to return a fake redirect URL */
export async function mockStripeCheckout(page: Page) {
  await page.route("**/api/stripe/checkout**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "https://checkout.stripe.com/pay/test_session" }),
    });
  });
}

/** Mock a family_invites REST query to return a specific invite */
export async function mockInviteFetch(
  page: Page,
  invite: {
    id?: string;
    family_id?: string;
    invited_by?: string;
    role?: string;
    accepted?: boolean;
    expires_at?: string;
  } | null
) {
  await page.route("**/rest/v1/family_invites**", async (route: Route) => {
    if (!invite) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        family_id: invite.family_id ?? "e2e-family-id",
        invited_by: invite.invited_by ?? "e2e-inviter-id",
        role: invite.role ?? "member",
        accepted: invite.accepted ?? false,
        expires_at:
          invite.expires_at ??
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });
}

/** Mock a families REST query to return a specific family */
export async function mockFamilyFetch(
  page: Page,
  family: { id?: string; name?: string } | null
) {
  await page.route("**/rest/v1/families**", async (route: Route) => {
    if (!family) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        name: family.name ?? "Test Family",
      }),
    });
  });
}

/** Mock a family_members REST query to return a specific member */
export async function mockFamilyMemberFetch(
  page: Page,
  member: { display_name?: string } | null
) {
  await page.route("**/rest/v1/family_members**", async (route: Route) => {
    if (!member) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        display_name: member.display_name ?? "E2E Inviter",
      }),
    });
  });
}
