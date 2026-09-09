import { test, expect } from '@playwright/test';

test.describe('Classic Mode Flow', () => {
  test('renders homepage with Classic mode, clues dock, and allows guessing a champion', async ({ page }) => {
    await page.goto('/');

    // Check title and Header
    await expect(page.locator('h1')).toContainText('LoLdle');
    await expect(page.getByRole('heading', { name: 'Classic Mode' })).toBeVisible();

    // Check Clues Dock tokens
    await expect(page.locator('button[title*="Quote"]')).toBeVisible();
    await expect(page.locator('button[title*="Ability"]')).toBeVisible();
    await expect(page.locator('button[title*="Splash"]')).toBeVisible();

    // Type a champion name in input
    const input = page.getByPlaceholder('Guess a champion (e.g. Ahri, Yasuo...)');
    await expect(input).toBeVisible();
    await input.fill('Aatrox');

    // Click suggestion item
    const suggestion = page.locator('li').filter({ hasText: 'Aatrox' });
    await expect(suggestion).toBeVisible();
    await suggestion.click();
    await page.getByTestId('submit-guess').click();

    // Verify row appeared in guesses table
    const guessRow = page.locator('div').filter({ hasText: 'Aatrox' }).first();
    await expect(guessRow).toBeVisible();

    // Verify input is cleared
    await expect(input).toHaveValue('');
  });
});
