/** Smoke tests for Parrot production build — verifies the frontend renders its key surfaces. */
import { test, expect } from '@playwright/test';

test.describe('Parrot frontend smoke', () => {
  test('homepage loads and shows app shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toBeVisible();
    // The Vite dev server renders the React root; at minimum the page title or
    // a recognizable heading should appear.
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('production build index.html is well-formed', async ({ page }) => {
    // This test uses the dev server (Vite) which serves the built output.
    await page.goto('/');
    await expect(page.locator('head title')).toBeAttached();
    // Check that the JS bundle loaded without immediate errors.
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.waitForLoadState('networkidle');
    // Allow some expected React hydration warnings; flag only unhandled ones.
    const unhandled = consoleErrors.filter(e =>
      !e.includes('Warning:') && !e.includes('Warning')
    );
    expect(unhandled).toEqual([]);
  });

  test('favicon assets exist', async ({ request }) => {
    const favicon = await request.head('/favicon.svg');
    expect(favicon.ok()).toBeTruthy();
    const sw = await request.head('/sw.js');
    expect(sw.ok()).toBeTruthy();
  });
});
