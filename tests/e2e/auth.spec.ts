import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';
import { SIGNED_OUT, openPage } from './helpers';

test.describe('signed out', () => {
  test.use({ storageState: SIGNED_OUT });

  test('protected pages send you to sign in', async ({ page }) => {
    await page.goto('/operations/receipts');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('a wrong password shows the mockup error text', async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto('/sign-in');
    await page.getByLabel('Login Id').fill('nobody01');
    await page.getByLabel('Password', { exact: true }).fill('Wrong!pass123');
    await page.getByRole('button', { name: 'SIGN IN' }).click();
    await expect(page.getByText('Invalid Login Id or Password')).toBeVisible();
  });

  test('sign up checks every rule before calling Clerk', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Enter Login Id').fill('abc');
    await page.getByLabel('Enter Email Id').fill('nope');
    await page.getByLabel('Enter Password', { exact: true }).fill('weakpass');
    await page.getByLabel('Re-Enter Password', { exact: true }).fill('other');
    await page.getByRole('button', { name: 'SIGN UP' }).click();
    await expect(
      page.getByText('Login ID must be 6 to 12 characters'),
    ).toBeVisible();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await expect(page.getByText('Use more than 8 characters')).toBeVisible();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });
});

test.describe('signed in', () => {
  test('the top bar reaches every section', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const label of [
      'Dashboard',
      'Operations',
      'Products',
      'Move History',
      'Settings',
    ]) {
      await expect(nav.getByText(label, { exact: true })).toBeVisible();
    }
    await nav.getByRole('button', { name: 'Operations' }).click();
    await page.getByRole('menuitem', { name: 'Receipts' }).click();
    await expect(page).toHaveURL(/\/operations\/receipts/);
  });

  test('my profile shows the signed in Login ID', async ({ page }) => {
    await openPage(page, '/profile', 'My Profile');
    await expect(
      page
        .getByText(process.env.E2E_CLERK_USER_USERNAME!, { exact: true })
        .first(),
    ).toBeVisible();
  });
});
