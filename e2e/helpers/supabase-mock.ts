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
