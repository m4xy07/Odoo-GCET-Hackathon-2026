import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE } from './helpers';

setup.describe.configure({ mode: 'serial' });

// A testing token lets automated browsers past Clerk's bot protection
setup('clerk testing token', async () => {
  await clerkSetup({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
});

// Every test browser is a "new device", so a password sign in would stop at the email code step.
// Signing in with a one time ticket for the user's email skips that, which is what the helper does.
setup('sign in the e2e user', async ({ page }) => {
  const username = process.env.E2E_CLERK_USER_USERNAME!;
  const res = await fetch(
    `https://api.clerk.com/v1/users?username=${encodeURIComponent(username)}`,
    {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    },
  );
  const [user] = await res.json();
  const email = user?.email_addresses?.find(
    (e: { id: string }) => e.id === user.primary_email_address_id,
  )?.email_address;
  expect(email, `no Clerk user with username ${username}`).toBeTruthy();

  await page.goto('/sign-in');
  await clerk.signIn({ page, emailAddress: email });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
