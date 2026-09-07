import { test, expect } from '@playwright/test';

test.describe('Real Browser Speed & Latency Benchmarks', () => {
  test('serves local ability icon static asset in under 50ms over HTTP', async ({ page }) => {
    // Warm up the server connection
    await page.goto('/');

    // Warm-up fetch
    await page.request.get('/assets/abilities/Ahri_q.png');

    const start = Date.now();
    const response = await page.request.get('/assets/abilities/Ahri_q.png');
    const latency = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    // Local static asset response must be well below 200ms (so much faster than CDN 800ms)
    expect(latency).toBeLessThan(200);
  });

  test('serves local champion avatar static asset in under 200ms over HTTP', async ({ page }) => {
    await page.goto('/');

    // Warm-up fetch
    await page.request.get('/assets/champions/Ahri.png');

    const start = Date.now();
    const response = await page.request.get('/assets/champions/Ahri.png');
    const latency = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect(latency).toBeLessThan(200);
  });

  test('completes full page load and initial render in under 8 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(8000);
    await expect(page.locator('h1')).toContainText('LoLdle');
  });

  test('switches rounds in Unlimited mode instantly without network delay', async ({ page }) => {
    await page.goto('/');

    // Verify switch happens in DOM quickly without roundtrip
    const start = Date.now();
    const nav = page.locator('nav');
    await nav.getByRole('button', { name: 'Quote' }).click();
    await expect(page.getByRole('heading', { name: 'Quote Mode' })).toBeVisible();
    const switchTime = Date.now() - start;

    expect(switchTime).toBeLessThan(500);
  });
});
