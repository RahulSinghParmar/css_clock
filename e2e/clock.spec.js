import { test, expect } from '@playwright/test';
test('timezone, appearance, pinning and preferences work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#time')).not.toHaveText('--:--:--');
  await page.getByLabel('Appearance').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#timezone').selectOption('Asia/Tokyo');
  await page.getByRole('button', { name: '+ Pin selected timezone' }).click();
  await expect(page.getByRole('heading', { name: 'Tokyo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Tokyo clock' }).click();
  await expect(page.getByRole('heading', { name: 'Tokyo', exact: true })).toHaveCount(0);
  await page.getByRole('switch', { name: '24-hour time' }).uncheck();
  await expect(page.locator('#period')).toHaveText(/AM|PM/);
  await page.reload();
  await expect(page.locator('#timezone')).toHaveValue('Asia/Tokyo');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('reduced motion and unavailable storage do not break the clock', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('switch', { name: 'Sweeping second hand' }).check();
  await expect(page.locator('#motion-note')).toContainText('Reduced motion');
  await expect(page.locator('#time')).not.toHaveText('--:--:--');
});
