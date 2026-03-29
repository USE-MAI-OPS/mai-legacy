import { test, expect } from "@playwright/test";

/**
 * Entries — create, view, edit.
 *
 * The entries list and entry detail pages render mock data when Supabase is
 * not configured, so these tests run without real credentials.
 *
 * The "create entry" page requires auth to submit; we test the form renders
 * correctly but do not attempt a real submission.
 */

test.describe("Entries list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/entries");
  });

  test("renders mock entries", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /grandma rosa/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /duct tape/i })
    ).toBeVisible();
  });

  test("shows entry type badges", async ({ page }) => {
    // Entries list includes type labels for mock entries
    await expect(page.getByText(/recipe/i).first()).toBeVisible();
    await expect(page.getByText(/story/i).first()).toBeVisible();
  });

  test("has a link to create a new entry", async ({ page }) => {
    // Dashboard should provide a way to navigate to /entries/new
    const newEntryLink = page
      .getByRole("link", { name: /new entry|add entry|new memory/i })
      .first();
    await expect(newEntryLink).toBeVisible();
  });
});

test.describe("Entry detail page", () => {
  test("renders a mock entry by id", async ({ page }) => {
    await page.goto("/entries/1");
    await expect(
      page.getByRole("heading", { name: /grandma rosa/i })
    ).toBeVisible();
    // Edit button is present even in mock mode
    await expect(
      page.getByRole("link", { name: /edit/i })
    ).toBeVisible();
  });

  test("renders a second mock entry", async ({ page }) => {
    await page.goto("/entries/2");
    await expect(
      page.getByRole("heading", { name: /duct tape/i })
    ).toBeVisible();
  });

  test("unknown id shows 404", async ({ page }) => {
    const response = await page.goto("/entries/not-a-real-id");
    // Next.js notFound() returns 404
    expect(response?.status()).toBe(404);
  });
});

test.describe("New entry page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/entries/new");
  });

  test("renders the entry type selector", async ({ page }) => {
    // FormSelector should offer entry type options
    await expect(
      page.getByRole("heading", { name: /what kind of memory/i }).or(
        page.getByText(/story|recipe|lesson|skill|connection/i).first()
      )
    ).toBeVisible();
  });

  test("selecting story type shows the story form", async ({ page }) => {
    const storyOption = page
      .getByRole("button", { name: /story/i })
      .or(page.getByText(/story/i).first());
    await storyOption.click();

    // After selecting story, a title field should appear
    await expect(page.getByLabel(/title/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Edit entry page", () => {
  test("redirects unauthenticated users away from edit", async ({ page }) => {
    // Without auth, editing a real entry should redirect to login or 404
    const response = await page.goto("/entries/some-uuid-that-does-not-exist/edit");
    // Either 404 (entry not found) or redirect to login
    const url = page.url();
    const status = response?.status() ?? 200;
    expect(status === 404 || url.includes("/login") || url.includes("/signup")).toBeTruthy();
  });
});
