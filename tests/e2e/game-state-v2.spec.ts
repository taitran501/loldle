import { test, expect } from '@playwright/test';

async function waitForApp(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId('app-ready')).toBeVisible();
}

async function getTargetName(page: import('@playwright/test').Page, playType: 'daily' | 'unlimited', mode: string) {
  return page.evaluate(async ({ playType: selectedPlayType, mode: selectedMode }) => {
    const state = JSON.parse(localStorage.getItem('loldle_game_state_v2') || '{}');
    const targetId = state[selectedPlayType]?.modes?.[selectedMode]?.targetId;
    const champions = await fetch('/data/champions.json').then(response => response.json());
    return champions.find((champion: { id: string }) => champion.id === targetId)?.name as string;
  }, { playType, mode });
}

async function guessChampion(page: import('@playwright/test').Page, name: string) {
  const input = page.locator('input[placeholder*="Guess"]:not([disabled])').first();
  await input.fill(name);
  await page.getByRole('option', { name }).click();
  await page.getByTestId('submit-guess').click();
}

test.describe('Game state v2 and regression flows', () => {
  test('keeps Daily and Unlimited rounds separate across switches and reload', async ({ page }) => {
    await waitForApp(page);

    const unlimitedTarget = await page.evaluate(() => JSON.parse(localStorage.getItem('loldle_game_state_v2') || '{}').unlimited.modes.classic.targetId);
    await guessChampion(page, unlimitedTarget === 'Aatrox' ? 'Ahri' : 'Aatrox');
    await expect(page.getByText(/^Guesses:$/).locator('..')).toContainText('1');

    await page.getByRole('button', { name: 'Daily' }).click();
    await expect(page.getByRole('button', { name: 'Daily' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/^Guesses:$/).locator('..')).toContainText('0');

    await page.getByRole('button', { name: 'Unlimited' }).click();
    await expect(page.getByText(/^Guesses:$/).locator('..')).toContainText('1');

    await page.reload();
    await expect(page.getByTestId('app-ready')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlimited' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/^Guesses:$/).locator('..')).toContainText('1');
  });

  test('clears a pending autocomplete selection when switching play type', async ({ page }) => {
    await waitForApp(page);

    const input = page.getByPlaceholder('Guess a champion (e.g. Ahri, Yasuo...)');
    await input.fill('Aatrox');
    await page.getByRole('option', { name: /Aatrox/ }).click();
    await expect(input).toHaveValue('Aatrox');

    await page.getByRole('button', { name: 'Daily' }).click();
    await expect(page.getByPlaceholder('Guess a champion (e.g. Ahri, Yasuo...)')).toHaveValue('');
    await page.getByRole('button', { name: 'Unlimited' }).click();
    await expect(page.getByPlaceholder('Guess a champion (e.g. Ahri, Yasuo...)')).toHaveValue('');
  });

  test('locks a completed Daily round until the next UTC day', async ({ page }) => {
    await waitForApp(page);
    await page.getByRole('button', { name: 'Daily' }).click();
    const targetName = await getTargetName(page, 'daily', 'classic');
    await guessChampion(page, targetName);
    await expect(page.getByTestId('victory-modal')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'Close result' }).click();

    const input = page.getByPlaceholder('Round completed!');
    await expect(input).toBeDisabled();
    await page.getByRole('button', { name: 'Unlimited' }).click();
    await page.getByRole('button', { name: 'Daily' }).click();
    await expect(page.getByPlaceholder('Round completed!')).toBeDisabled();
  });

  test('cancels a stale victory result when the player changes mode immediately', async ({ page }) => {
    await waitForApp(page);
    const targetName = await getTargetName(page, 'unlimited', 'classic');
    await guessChampion(page, targetName);
    await page.locator('nav').getByRole('button', { name: 'Quote' }).click();
    await expect(page.getByRole('heading', { name: 'Quote Mode' })).toBeVisible();
    await page.waitForTimeout(1800);
    await expect(page.getByTestId('victory-modal')).not.toBeVisible();
  });

  test('persists Ability and Splash bonus completion and cancels their stale results', async ({ page }) => {
    await waitForApp(page);

    const abilityRound = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('loldle_game_state_v2') || '{}');
      const round = state.unlimited.modes.ability;
      round.guesses = [round.targetId];
      round.isSolved = true;
      round.bonus = { status: 'pending' };
      state.currentMode = 'ability';
      state.playType = 'unlimited';
      localStorage.setItem('loldle_game_state_v2', JSON.stringify(state));
      return round.abilityKey;
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Ability Mode' })).toBeVisible();
    await page.getByRole('button', { name: abilityRound, exact: true }).click();
    await page.locator('nav').getByRole('button', { name: 'Quote' }).click();
    await page.waitForTimeout(1300);
    await expect(page.getByTestId('victory-modal')).not.toBeVisible();

    const splashSkin = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('loldle_game_state_v2') || '{}');
      const round = state.unlimited.modes.splash;
      const skinId = round.skinId;
      round.guesses = [round.targetId];
      round.isSolved = true;
      round.bonus = { status: 'pending' };
      state.currentMode = 'splash';
      localStorage.setItem('loldle_game_state_v2', JSON.stringify(state));
      return { targetId: round.targetId, skinId };
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Splash Art Mode' })).toBeVisible();
    const skinName = await page.evaluate(async ({ targetId, skinId }) => {
      const champions = await fetch('/data/champions.json').then(response => response.json());
      return champions.find((champion: { id: string }) => champion.id === targetId)
        ?.skins.find((skin: { id: number }) => skin.id === skinId)?.name as string;
    }, splashSkin);
    const skinInput = page.getByPlaceholder('Search or select a skin...');
    await skinInput.fill(skinName);
    await page.getByRole('button', { name: skinName, exact: true }).last().click();
    await page.locator('nav').getByRole('button', { name: 'Emoji' }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('victory-modal')).not.toBeVisible();
  });

  test('opens separated statistics with per-mode distribution and closes on Escape', async ({ page }) => {
    await page.goto('/');
    const stats = {
      version: 2,
      daily: {
        played: 1, won: 1, currentStreak: 1, maxStreak: 1, guessDistribution: { 2: 1 },
        byMode: {
          classic: { played: 1, won: 1, guessDistribution: { 2: 1 } },
          quote: { played: 0, won: 0, guessDistribution: {} },
          ability: { played: 0, won: 0, guessDistribution: {} },
          emoji: { played: 0, won: 0, guessDistribution: {} },
          splash: { played: 0, won: 0, guessDistribution: {} },
        },
        unattributed: { played: 0, won: 0, guessDistribution: {} },
      },
      unlimited: {
        played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: {},
        byMode: {
          classic: { played: 0, won: 0, guessDistribution: {} },
          quote: { played: 0, won: 0, guessDistribution: {} },
          ability: { played: 0, won: 0, guessDistribution: {} },
          emoji: { played: 0, won: 0, guessDistribution: {} },
          splash: { played: 0, won: 0, guessDistribution: {} },
        },
        unattributed: { played: 0, won: 0, guessDistribution: {} },
      },
    };
    await page.evaluate(value => localStorage.setItem('loldle_stats_v2', JSON.stringify(value)), stats);
    await page.reload();
    await expect(page.getByTestId('app-ready')).toBeVisible();

    const statsButton = page.getByRole('button', { name: 'Statistics' });
    await statsButton.click();
    await expect(page.getByRole('dialog', { name: 'Statistics' })).toBeVisible();
    await expect(page.getByText('Guess Distribution')).toBeVisible();
    await expect(page.getByTestId('stats-modal').getByText('Classic')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('stats-modal')).not.toBeVisible();
    await expect(statsButton).toBeFocused();
  });

  test('fits the mobile viewport and renders Classic guesses as vertical cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForApp(page);
    const dimensions = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.documentScrollWidth).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.getByRole('button', { name: 'Statistics' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'How to play' })).toBeVisible();

    const targetId = await page.evaluate(() => JSON.parse(localStorage.getItem('loldle_game_state_v2') || '{}').unlimited.modes.classic.targetId);
    await guessChampion(page, targetId === 'Aatrox' ? 'Ahri' : 'Aatrox');
    await expect(page.locator('article')).toBeVisible();
    const dimensionsAfterGuess = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(dimensionsAfterGuess.bodyScrollWidth).toBeLessThanOrEqual(dimensionsAfterGuess.viewport);
    expect(dimensionsAfterGuess.documentScrollWidth).toBeLessThanOrEqual(dimensionsAfterGuess.viewport);
  });

  test('shows a retryable dataset error instead of a blank board', async ({ page }) => {
    let shouldFail = true;
    await page.route('**/data/champions.json', route => {
      if (shouldFail) return route.abort();
      return route.continue();
    });
    await page.goto('/');
    await expect(page.getByTestId('dataset-error')).toBeVisible();
    shouldFail = false;
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByTestId('app-ready')).toBeVisible({ timeout: 5000 });
  });
});
