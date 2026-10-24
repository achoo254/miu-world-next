// Parent area → Phiếu viết on the production build: the parent opens the PIN gate in the page, finds
// the sheets by subject and topic, opens one Tiếng Việt and one Toán sheet, and each prints to A4 with the app's
// buttons left off the page. The PDFs and a shot of the list go to the review folder.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { freshChild } from './quest-api';

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1180, height: 820 } });

const SHOTS = fileURLToPath(new URL('../../../.data/sgk/review-shots/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });

async function printSheet(page: Page, questId: string, file: string): Promise<void> {
  await page.locator(`[data-id="worksheet-link-${questId}"]`).click();
  await expect(page).toHaveURL(new RegExp(`/parent/worksheets/${questId}$`));
  await expect(page.locator('.worksheet-sheet')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-id="worksheet-print"]')).toBeHidden();
  await page.pdf({ path: `${SHOTS}${file}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.emulateMedia({ media: 'screen' });
  await page.screenshot({ path: `${SHOTS}${file}.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('link', { name: 'Danh sách phiếu' }).click();
}

test('the parent unlocks the gate, lists the sheets by subject and prints one of each to A4', async ({ page, baseURL }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  await freshChild(page, baseURL ?? '');
  // Signing up leaves the area open for a while; lock it so the sheets show only after the PIN.
  expect((await page.context().request.post('/api/parent-gate/lock', { headers: { Origin: new URL(baseURL ?? '').origin } })).status()).toBe(200);

  await page.goto('/parent/worksheets');
  await page.getByLabel('Nhập mã PIN tài khoản').fill('2468');
  await page.getByLabel('Nhập mã PIN tài khoản').press('Enter');
  await expect(page.getByRole('heading', { name: 'Tiếng Việt', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Toán', exact: true })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}worksheets-list.png`, fullPage: true, animations: 'disabled' });

  await printSheet(page, 'tv2-t01-b01', 'worksheet-tv2-t01-b01');
  // The model handwriting font has no open license and is never served: the sheet prints without model letters.
  await page.goto('/parent/worksheets/tv2-t01-b01');
  await expect(page.locator('.worksheet-sheet')).toBeVisible();
  await expect(page.locator('.oli-model')).toHaveCount(0);
  await page.getByRole('link', { name: 'Danh sách phiếu' }).click();
  await printSheet(page, 'toan2-cd3-b15', 'worksheet-toan2-cd3-b15');

  // From the parent area itself.
  await page.goto('/parent');
  await page.locator('[data-id="parent-worksheets"]').click();
  await expect(page).toHaveURL(/\/parent\/worksheets$/);
  expect(pageErrors).toEqual([]);
});
