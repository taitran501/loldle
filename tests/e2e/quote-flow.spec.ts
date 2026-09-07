import { test, expect } from '@playwright/test';

test.describe('Quote Mode Flow', () => {
  test('navigates to Quote mode, displays quote clue card, and tracks wrong guess countdown', async ({ page }) => {
    await page.goto('/');

    // Navigate to Quote mode
    const quoteTab = page.locator('nav').getByRole('button', { name: 'Quote' });
    await quoteTab.click();

    // Verify Quote Mode header
    await expect(page.getByRole('heading', { name: 'Quote Mode' })).toBeVisible();
    await expect(page.getByText('Who says this quote in League of Legends?')).toBeVisible();

    // Verify initial locked audio clue badge
    await expect(page.getByText('Audio clue in 5 tries')).toBeVisible();

    // Make an incorrect guess
    const input = page.getByPlaceholder('Guess who said it...');
    await expect(input).toBeVisible();
    await input.fill('Aatrox');

    const suggestion = page.locator('li').filter({ hasText: 'Aatrox' });
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    // Verify guess history appeared
    await expect(page.locator('div').filter({ hasText: 'Aatrox' }).first()).toBeVisible();

    // Verify audio countdown decreased to 4 tries
    await expect(page.getByText('Audio clue in 4 tries')).toBeVisible();
  });
});
