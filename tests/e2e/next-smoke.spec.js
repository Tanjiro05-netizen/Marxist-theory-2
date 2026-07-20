const { test, expect } = require('@playwright/test');

const GUEST_ROUTES = [
  ['/login', /Marxist\.info|Revolutionary|Theory/i],
  ['/home', /Home|Marxist/i],
  ['/digital-library', /Digital Library/i],
  ['/coming-soon?feature=theory', /Coming Soon|Theory/i],
  ['/marxbot', /MarxBot/i],
  ['/definitely-not-a-route', /404|not found/i],
];

const AUTH_ROUTES = [
  '/theory',
  '/analysis',
  '/study',
  '/science-tech',
  '/politics',
  '/visualizations',
  '/directory',
  '/forum',
  '/knowledge',
  '/profile',
];

const ADMIN_ROUTES = [
  '/admin/tags',
  '/admin/roles',
  '/admin/submissions',
  '/admin/world-sim',
];

const BREAKPOINT_ROUTES = [
  '/login',
  '/home',
  '/digital-library',
  '/study',
  '/directory',
  '/knowledge',
  '/admin/tags',
  '/marxbot',
  '/definitely-not-a-route',
];

const BREAKPOINTS = [360, 640, 820, 1024];

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function loginAsDevAdmin(page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Log In' }).first().click();
  await page.locator('input[type="email"]').last().fill('admin@localhost');
  await page.locator('input[type="password"]').last().fill('admin123');
  await page.getByRole('button', { name: 'Log In' }).last().click();
  await expect(page).toHaveURL(/\/home$/);
}

test.describe('guest routes', () => {
  for (const [path, expectedText] of GUEST_ROUTES) {
    test(`renders ${path}`, async ({ page }) => {
      await page.goto(path);
      await settle(page);
      await expect(page.locator('body')).toContainText(expectedText);
    });
  }

  test('redirects protected guests before protected content renders', async ({ page }) => {
    await page.goto('/theory');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('authenticated routes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDevAdmin(page);
  });

  for (const path of AUTH_ROUTES) {
    test(`renders ${path} for dev admin`, async ({ page }) => {
      await page.goto(path);
      await settle(page);
      await expect(page).not.toHaveURL(/\/login$/);
      await expect(page.locator('body')).not.toContainText(/Checking permissions\.\.\.|Loading\.\.\./i);
    });
  }

  for (const path of ADMIN_ROUTES) {
    test(`renders ${path} for dev admin`, async ({ page }) => {
      await page.goto(path);
      await settle(page);
      await expect(page).not.toHaveURL(/\/login$|\/coming-soon$/);
      await expect(page.locator('body')).not.toContainText(/Checking permissions\.\.\./i);
    });
  }
});

test.describe('responsive sweep', () => {
  for (const width of BREAKPOINTS) {
    test(`renders representative routes at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await loginAsDevAdmin(page);

      for (const path of BREAKPOINT_ROUTES) {
        await page.goto(path);
        await settle(page);
        await expect(page.locator('body')).toBeVisible();
      }
    });
  }
});
