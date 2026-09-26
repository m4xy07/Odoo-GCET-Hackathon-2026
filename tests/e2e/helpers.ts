import { expect, type Page } from '@playwright/test';

// Saved session of the E2E user, written once by global.setup.ts (gitignored)
export const AUTH_FILE = 'playwright/.clerk/user.json';

// Use inside a describe block to run it signed out
export const SIGNED_OUT = { cookies: [], origins: [] };

// Open a page and wait for its title, so specs read like the demo script
export async function openPage(page: Page, path: string, title: string) {
  await page.goto(path);
  await expect(
    page.getByRole('heading', { level: 1, name: title }),
  ).toBeVisible();
}
