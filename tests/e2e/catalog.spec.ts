import { expect, test, type Page } from '@playwright/test';
import { openPage } from './helpers';

// Unique per run so the spec can also run against the shared demo database
const stamp = Date.now().toString(36).toUpperCase().slice(-4);

// The Location label also belongs to page filters, so form fields are looked up inside the modal
const dialog = (page: Page) => page.getByRole('dialog');

test('warehouse and location: create, name as CODE/Stock1, delete', async ({ page }) => {
  const code = `E${stamp}`;

  await openPage(page, '/settings/warehouses', 'Warehouse');
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await dialog(page).getByLabel('Name', { exact: true }).fill('E2E Warehouse');
  await dialog(page).getByLabel('Short Code').fill(code.toLowerCase());
  await dialog(page).getByLabel('Address').fill('Plot 1, Test Road, Hyderabad');
  await dialog(page).getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name: code, exact: true })).toBeVisible();

  await openPage(page, '/settings/locations', 'Location');
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await dialog(page).getByLabel('Name', { exact: true }).fill('Stock1');
  await dialog(page).getByLabel('Short Code').fill('S1');
  await dialog(page).getByLabel('Warehouse').click();
  await page.getByRole('option', { name: new RegExp(`^${code}`) }).click();
  await expect(dialog(page).getByText(`Shown as ${code}/Stock1`)).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name: `${code}/Stock1`, exact: true })).toBeVisible();

  // clean up in the only order the app allows: location first, then its warehouse
  await page.getByRole('button', { name: `Delete ${code}/Stock1` }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('cell', { name: `${code}/Stock1`, exact: true })).toBeHidden();

  await openPage(page, '/settings/warehouses', 'Warehouse');
  await page.getByRole('button', { name: `Delete ${code}` }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('cell', { name: code, exact: true })).toBeHidden();
});

test('product with initial stock, then a new count from the stock page', async ({ page }) => {
  const sku = `E2E-${stamp}`;

  await openPage(page, '/products', 'Products');
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await dialog(page).getByLabel('Name', { exact: true }).fill(`E2E Lamp ${stamp}`);
  await dialog(page).getByLabel('SKU/Code').fill(sku);
  await dialog(page).getByLabel('Category', { exact: true }).click();
  await page.getByRole('option').first().click();
  await dialog(page).getByLabel('Unit cost (Rs)').fill('250');
  await dialog(page).getByRole('button', { name: 'Add initial stock' }).click();
  await dialog(page).getByLabel('Location', { exact: true }).click();
  await page.getByRole('option', { name: 'WH/Stock1' }).click();
  await dialog(page).getByLabel('Quantity', { exact: true }).fill('10');
  await dialog(page).getByRole('button', { name: 'Save' }).click();

  // saving opens the product page, where the opening stock sits in its location
  await expect(page).toHaveURL(/\/products\/[a-f0-9]{24}$/);
  const productId = page.url().split('/').pop()!;
  await expect(page.getByRole('heading', { level: 1, name: `E2E Lamp ${stamp}` })).toBeVisible();
  await expect(page.getByRole('row', { name: /WH\/Stock1\s+10\s+/ })).toBeVisible();

  // the stock page opens on WH/Stock1, a new count goes through a confirmed adjustment
  await openPage(page, '/stock', 'Stock');
  await page.getByLabel('Search product or SKU').fill(sku);
  const row = page.getByRole('row').filter({ hasText: sku });
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: /Update on hand/ }).click();
  await row.getByRole('spinbutton').fill('7');
  await row.getByRole('spinbutton').press('Enter');
  await expect(page.getByText(`Set E2E Lamp ${stamp} at WH/Stock1 from 10 to 7? This logs an adjustment.`)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText(/Stock updated, logged as WH\/ADJ\/\d{4}/).first()).toBeVisible();
  await expect(row.getByRole('button', { name: /Update on hand/ })).toHaveText('7');

  // archive so the product disappears from lists, its two ledger lines stay as history
  const status = await page.evaluate(async (id) => (await fetch(`/api/products/${id}`, { method: 'DELETE' })).status, productId);
  expect(status).toBe(200);
});
