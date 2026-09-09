import { test, expect } from '@playwright/test';

test.describe('Game Modes Navigation Flow', () => {
  test('switches across all 5 game modes without state loss or errors', async ({ page }) => {
    await page.goto('/');

    // 1. Classic Mode initial
    await expect(page.getByRole('heading', { name: 'Classic Mode' })).toBeVisible();

    // Make a guess in Classic
    const classicInput = page.getByPlaceholder('Guess a champion (e.g. Ahri, Yasuo...)');
    await classicInput.fill('Aatrox');
    await page.locator('li').filter({ hasText: 'Aatrox' }).first().click();
    await page.getByTestId('submit-guess').click();
    await expect(page.locator('div').filter({ hasText: 'Aatrox' }).first()).toBeVisible();

    const nav = page.locator('nav');

    // 2. Switch to Quote Mode
    await nav.getByRole('button', { name: 'Quote' }).click();
    await expect(page.getByRole('heading', { name: 'Quote Mode' })).toBeVisible();

    // 3. Switch to Ability Mode
    await nav.getByRole('button', { name: 'Ability' }).click();
    await expect(page.getByRole('heading', { name: 'Ability Mode' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Challenge Mode' })).toBeVisible();

    // 4. Switch to Emoji Mode
    await nav.getByRole('button', { name: 'Emoji' }).click();
    await expect(page.getByRole('heading', { name: 'Emoji Mode' })).toBeVisible();

    // 5. Switch to Splash Mode
    await nav.getByRole('button', { name: 'Splash' }).click();
    await expect(page.getByRole('heading', { name: 'Splash Art Mode' })).toBeVisible();

    // Return to Classic Mode and verify previous guess persists
    await nav.getByRole('button', { name: 'Classic' }).click();
    await expect(page.getByRole('heading', { name: 'Classic Mode' })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'Aatrox' }).first()).toBeVisible();
  });
});
