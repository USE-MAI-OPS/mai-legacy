import { test, expect } from "@playwright/test";

/**
 * Onboarding flow — 3-step wizard (name → family → first entry).
 *
 * The onboarding page is a pure client component; it can be rendered and
 * navigated without hitting Supabase, though the final server actions (createFamily,
 * createEntry) will fail without auth. We test:
 *   • All three steps render correctly
 *   • Validation prevents advancing without required fields
 *   • Back navigation works
 *   • The "Skip for now" option is visible on step 3
 */

test.describe("Onboarding wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
  });

  test("renders step 0 — ask for display name", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /what should we call you/i })).toBeVisible();
    await expect(page.getByLabel("Your name")).toBeVisible();
    await expect(page.getByLabel(/nickname/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /next/i })).toBeVisible();
  });

  test("cannot advance from step 0 with empty name", async ({ page }) => {
    // Next button is disabled until name is filled
    const nextBtn = page.getByRole("button", { name: /next/i });
    await expect(nextBtn).toBeDisabled();
  });

  test("advances to step 1 after entering a name", async ({ page }) => {
    await page.getByLabel("Your name").fill("Grandma Rosa");
    await page.getByRole("button", { name: /next/i }).click();

    await expect(
      page.getByRole("heading", { name: /what do you call your family/i })
    ).toBeVisible();
    await expect(page.getByLabel("Family name")).toBeVisible();
  });

  test("cannot advance from step 1 with empty family name", async ({ page }) => {
    await page.getByLabel("Your name").fill("Grandma Rosa");
    await page.getByRole("button", { name: /next/i }).click();

    await expect(page.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  test("back button returns to previous step", async ({ page }) => {
    await page.getByLabel("Your name").fill("Grandma Rosa");
    await page.getByRole("button", { name: /next/i }).click();

    await page.getByRole("button", { name: /back/i }).click();
    await expect(
      page.getByRole("heading", { name: /what should we call you/i })
    ).toBeVisible();
  });

  test("reaches step 2 — first entry", async ({ page }) => {
    await page.getByLabel("Your name").fill("Grandma Rosa");
    await page.getByRole("button", { name: /next/i }).click();

    await page.getByLabel("Family name").fill("The Rossis");
    await page.getByRole("button", { name: /next/i }).click();

    await expect(
      page.getByRole("heading", { name: /what.s a story worth saving/i })
    ).toBeVisible();
    await expect(page.getByLabel("Title")).toBeVisible();
    await expect(page.getByLabel("Story")).toBeVisible();
    await expect(page.getByRole("button", { name: /skip for now/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /save my first memory/i })
    ).toBeVisible();
  });

  test("keyboard Enter advances each step", async ({ page }) => {
    await page.getByLabel("Your name").fill("Grandma Rosa");
    await page.getByLabel("Your name").press("Enter");

    await expect(
      page.getByRole("heading", { name: /what do you call your family/i })
    ).toBeVisible();

    await page.getByLabel("Family name").fill("The Rossis");
    await page.getByLabel("Family name").press("Enter");

    await expect(
      page.getByRole("heading", { name: /what.s a story worth saving/i })
    ).toBeVisible();
  });
});
