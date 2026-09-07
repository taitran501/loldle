import { chromium } from '@playwright/test';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'public/header-desktop.png' });
  console.log('Saved public/header-desktop.png');

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.screenshot({ path: 'public/header-1024.png' });
  console.log('Saved public/header-1024.png');

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'public/header-tablet.png' });
  console.log('Saved public/header-tablet.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'public/header-mobile.png' });
  console.log('Saved public/header-mobile.png');

  await browser.close();
}

capture().catch(console.error);
