import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

// clickable data rows only, not the skeleton rows shown while loading
const dataRows = (page: import('@playwright/test').Page) =>
  page.locator('tbody tr[tabindex]');

test('receipts list searches by reference and switches to kanban', async ({
  page,
}) => {
  await openPage(page, '/operations/receipts', 'Receipts');
  const rows = dataRows(page);
  await expect(rows.first()).toBeVisible();

  const reference = (await rows.first().innerText()).match(
    /\w+\/IN\/\d{4}/,
  )![0];
  await page
    .getByRole('searchbox', { name: 'Search reference or contact' })
    .fill(reference);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(reference);

  await page.getByRole('tab', { name: 'Kanban view' }).click();
  await expect(page.getByRole('region', { name: 'Ready' })).toBeVisible();
  await expect(page.getByText(reference)).toBeVisible();
});

test('move history paints incoming green and outgoing red', async ({
  page,
}) => {
  await openPage(page, '/moves', 'Move History');
  await expect(
    page.locator('tbody tr', { hasText: /\+\d/ }).first(),
  ).toHaveClass(/text-success-base/);
  await expect(
    page.locator('tbody tr', { hasText: /−\d/ }).first(),
  ).toHaveClass(/text-error-base/);
});

test('dashboard receipt card opens only the ready receipts', async ({
  page,
}) => {
  await openPage(page, '/', 'Dashboard');
  await page.getByRole('link', { name: /to receive/ }).click();
  await expect(page).toHaveURL(/\/operations\/receipts\?status=ready/);
  await expect(page.getByText('Showing ready only')).toBeVisible();
  for (const status of await dataRows(page)
    .locator('td:last-child')
    .allInnerTexts()) {
    expect(status.trim()).toBe('Ready');
  }
});

test('dashboard trend shows moves per day with a readable table behind it', async ({
  page,
}) => {
  await openPage(page, '/', 'Dashboard');
  await expect(
    page.getByRole('heading', { name: /Moves per day/ }),
  ).toBeVisible();
  await page.locator('[aria-label*=" in, "]').last().hover();
  await expect(page.getByRole('tooltip')).toContainText(/\d+ in · \d+ out/);
  await expect(
    page.getByRole('table', { name: 'Moves per day, last 14 days' }),
  ).toBeAttached();
});
