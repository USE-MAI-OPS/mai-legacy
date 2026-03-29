import { test, expect } from "@playwright/test";
import { mockStripeCheckout } from "./helpers/supabase-mock";

/**
 * Pricing page and Stripe checkout — happy path and UI assertions.
 *
 * The pricing page is fully public and renders without auth.
 * Stripe checkout requires a server-side call to create a session; we mock
 * the /api/stripe/checkout endpoint so the button works end-to-end without
 * real Stripe credentials.
 */

test.describe("Pricing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("renders all three tiers", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /seedling/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /roots/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /legacy/i })).toBeVisible();
  });

  test("shows prices for paid tiers", async ({ page }) => {
    await expect(page.getByText(/\$9/)).toBeVisible();
    await expect(page.getByText(/\$19/)).toBeVisible();
  });

  test("free tier has a Get Started CTA linking to signup", async ({ page }) => {
    const cta = page.getByRole("link", { name: /get started/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /signup/);
  });

  test("paid tiers have Subscribe buttons", async ({ page }) => {
    const subscribeButtons = page.getByRole("button", { name: /subscribe/i });
    await expect(subscribeButtons).toHaveCount(2);
  });
});

test.describe("Stripe checkout flow", () => {
  test("clicking Subscribe on Roots tier initiates checkout", async ({ page }) => {
    // Mock the API so we don't hit real Stripe
    await mockStripeCheckout(page);
    await page.goto("/pricing");

    // Intercept the navigation to Stripe checkout URL
    const checkoutNavigation = page.waitForRequest("**/api/stripe/checkout");

    const subscribeButtons = page.getByRole("button", { name: /subscribe/i });
    await subscribeButtons.first().click();

    // The request was made
    const req = await checkoutNavigation;
    expect(req.method()).toBe("POST");

    const body = req.postDataJSON();
    expect(["roots", "legacy"]).toContain(body?.tier);
  });

  test("Subscribe button shows loading state while waiting", async ({ page }) => {
    // Delay the mock response to observe the loading state
    await page.route("**/api/stripe/checkout**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "https://checkout.stripe.com/pay/cs_test" }),
      });
    });

    await page.goto("/pricing");
    const subscribeButtons = page.getByRole("button", { name: /subscribe/i });
    await subscribeButtons.first().click();

    // During the 300 ms delay the button should be in a loading / disabled state
    const firstBtn = subscribeButtons.first();
    // Either disabled or text changes — at minimum it shouldn't be two enabled buttons during load
    await expect(firstBtn).toBeDisabled({ timeout: 200 });
  });
});
