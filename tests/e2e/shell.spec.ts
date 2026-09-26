import { expect, test } from '@playwright/test';

// read only: only navigates, so it is safe to run against the deployed app

test('on a phone the menu opens a drawer that reaches every section', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

  await page.getByRole('button', { name: 'Open menu' }).click();
  const drawer = page.getByRole('dialog');
  // links, not text: "Products" is both a group heading and a link
  for (const label of [
    'Overview',
    'Receipts',
    'Deliveries',
    'Internal Transfers',
    'Adjustments',
    'Products',
    'Stock',
    'Move History',
    'Warehouses',
    'Locations',
    'My Profile',
  ]) {
    await expect(
      drawer.getByRole('link', { name: label, exact: true }),
    ).toBeVisible();
  }
  await expect(drawer.getByRole('button', { name: 'Logout' })).toBeVisible();

  await drawer.getByRole('link', { name: 'Stock', exact: true }).click();
  await expect(page).toHaveURL(/\/stock$/);
  await expect(drawer).toBeHidden();
});

test('tablets get the drawer and the full bar starts at 1024px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Profile menu' }),
  ).toBeInViewport();
});
