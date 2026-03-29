import { test, expect } from "@playwright/test";

/**
 * Sign-up flow — happy path and basic validation.
 *
 * Server actions redirect on both success and error, so tests assert on
 * resulting URL / page content rather than mocking the Supabase client.
 */

test.describe("Sign-up page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("renders the sign-up form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("shows link to sign-in page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("shows Google sign-in option", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /continue with google/i })
    ).toBeVisible();
  });

  test("terms of service and privacy policy links are present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /terms of service/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy policy/i })).toBeVisible();
  });

  test("empty submission stays on signup with validation error", async ({ page }) => {
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByText(/please fill in all fields/i)).toBeVisible();
  });

  test("passwords that do not match surface an error", async ({ page }) => {
    await page.getByLabel("Display name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("Password1!");
    await page.getByLabel("Confirm password").fill("Password999!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("weak password (< 8 chars) surfaces an error", async ({ page }) => {
    await page.getByLabel("Display name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("short1");
    await page.getByLabel("Confirm password").fill("short1");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(
      page.getByText(/password must be at least 8 characters/i)
    ).toBeVisible();
  });
});
