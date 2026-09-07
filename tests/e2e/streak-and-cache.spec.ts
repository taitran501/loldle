import { test, expect } from '@playwright/test';

test.describe('Streak, Settings & Cache Persistence', () => {
  test('persists Challenge Mode modifiers across page reloads', async ({ page }) => {
    await page.goto('/');

    // Navigate to Ability Mode
    await page.locator('nav').getByRole('button', { name: 'Ability' }).click();

    // Open Challenge Mode settings
    const challengeBtn = page.getByRole('button', { name: 'Challenge Mode' });
    await challengeBtn.click();

    // Toggle Black & White checkbox
    const grayscaleCheckbox = page.getByRole('checkbox', { name: 'Black & White (Grayscale)' });
    await expect(grayscaleCheckbox).not.toBeChecked();
    await grayscaleCheckbox.check();
    await expect(grayscaleCheckbox).toBeChecked();

    // Reload page
    await page.reload();

    // Navigate back to Ability Mode
    await page.locator('nav').getByRole('button', { name: 'Ability' }).click();
    await page.getByRole('button', { name: 'Challenge Mode' }).click();

    // Verify it is still checked from localStorage cache
    const reloadedCheckbox = page.getByRole('checkbox', { name: 'Black & White (Grayscale)' });
    await expect(reloadedCheckbox).toBeChecked();
  });

  test('toggles between Daily and Unlimited modes in header', async ({ page }) => {
    await page.goto('/');

    const dailyBtn = page.getByRole('button', { name: 'Daily' });
    const unlimitedBtn = page.getByRole('button', { name: 'Unlimited' });

    await expect(dailyBtn).toBeVisible();
    await expect(unlimitedBtn).toBeVisible();

    // Default mode is Unlimited (amber gradient active state)
    await expect(unlimitedBtn).toHaveClass(/from-amber-500/);

    // Click Daily to switch to Daily Mode
    await dailyBtn.click();
    await expect(dailyBtn).toHaveClass(/from-blue-600/);

    // Click Unlimited to switch back to Unlimited Mode
    await unlimitedBtn.click();
    await expect(unlimitedBtn).toHaveClass(/from-amber-500/);
  });
});
