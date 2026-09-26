import { expect, test, type Page } from '@playwright/test';
import { openPage } from './helpers';

const STEEL = '[STEEL001] Steel Rods';

// On hand across all locations, read the way the Stock page reads it
const onHand = (page: Page) =>
  page.evaluate(async () => {
    const { data } = await (await fetch('/api/stock?q=STEEL001')).json();
    return data.find((row: { sku: string }) => row.sku === 'STEEL001')?.onHand ?? 0;
  });

const status = (page: Page) => page.locator('[aria-current="step"]');

async function addLine(page: Page, product: string, quantity: number) {
  await page.getByRole('button', { name: 'New Product' }).click();
  await page.getByLabel('Product').last().click();
  await page.getByRole('option', { name: product }).click();
  await page.getByLabel('Quantity').last().fill(String(quantity));
}

test('a receipt adds stock, a delivery takes it out, and on hand matches', async ({ page }) => {
  await openPage(page, '/operations/receipts/new', 'Receipt');
  const before = await onHand(page);

  await page.getByLabel('Receive From').fill('Azure Interior');
  await addLine(page, STEEL, 50);
  await page.getByRole('button', { name: 'To Do' }).click();
  await expect(status(page)).toHaveText('Ready');
  await page.getByRole('button', { name: 'Validate' }).click();
  await expect(status(page)).toHaveText('Done');
  await expect(page.getByRole('link', { name: 'Print' })).toBeVisible();
  expect(await onHand(page)).toBe(before + 50);

  await openPage(page, '/operations/deliveries/new', 'Delivery');
  await page.getByLabel('Delivery Address').fill('Wood Corner');
  await addLine(page, STEEL, 10);
  await page.getByRole('button', { name: 'To Do' }).click();
  await expect(status(page)).toHaveText('Ready');
  await page.getByRole('button', { name: 'Validate' }).click();
  await expect(status(page)).toHaveText('Done');
  expect(await onHand(page)).toBe(before + 40);
});
