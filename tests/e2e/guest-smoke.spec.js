const { test, expect } = require('@playwright/test');

const FATAL_UI_PATTERN =
  /invalid input syntax|Failed to render|Book not found|No book ID provided|No readable file found|Error fetching data|Error verifying certificate|Failed to load book content|Failed to load table of contents/i;

const UUID_BOOK_PATH = /\/book\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROUTES = [
  { path: '/', expectedUrl: /\/login$/ },
  { path: '/login', expectedText: /Marxist\.info|Revolutionary|Theory/i },
  { path: '/home' },
  { path: '/digital-library', expectedText: /Digital Library/i },
  { path: '/pending-access' },
  { path: '/coming-soon' },
  { path: '/marxbot', expectedText: /MarxBot/i },
];

const PROTECTED_REDIRECT_ROUTES = ['/theory', '/politics', '/forum'];

function installAuditHooks(page) {
  const issues = [];

  page.on('pageerror', (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;

    const text = message.text();
    if (/ResizeObserver loop limit exceeded/i.test(text)) return;

    const location = message.location();
    const source = location?.url ? ` (${location.url}:${location.lineNumber || 0})` : '';
    issues.push(`console.error: ${text}${source}`);
  });

  page.on('requestfailed', (request) => {
    const resourceType = request.resourceType();
    if (!['document', 'script', 'xhr', 'fetch'].includes(resourceType)) return;

    const failure = request.failure();
    if (request.url().includes('_rsc=') && failure?.errorText === 'net::ERR_ABORTED') return;
    issues.push(`requestfailed: ${request.method()} ${request.url()} ${failure?.errorText || ''}`.trim());
  });

  page.on('response', (response) => {
    const resourceType = response.request().resourceType();
    const status = response.status();

    if (['document', 'script'].includes(resourceType) && status >= 400) {
      issues.push(`bad ${resourceType} response: ${status} ${response.url()}`);
    }

    if (['xhr', 'fetch'].includes(resourceType) && (status === 400 || status >= 500)) {
      issues.push(`bad API response: ${status} ${response.url()}`);
    }
  });

  return issues;
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(750);
}

async function expectNoAuditIssues(page, issues, label) {
  await expect(page.locator('body'), `${label} should not show fatal UI text`).not.toContainText(
    FATAL_UI_PATTERN,
    { timeout: 1_000 }
  );

  const bodyText = (await page.locator('body').innerText({ timeout: 5_000 })).trim();
  expect(bodyText.length, `${label} should render non-blank guest content`).toBeGreaterThan(10);

  expect(issues, `${label} should not emit page errors, console errors, or failed critical requests`).toEqual([]);
}

async function visitHealthy(page, path, options = {}) {
  const issues = installAuditHooks(page);
  await page.goto(path);
  if (options.expectedUrl) {
    await expect(page).toHaveURL(options.expectedUrl, { timeout: 20_000 });
  }
  await settle(page);
  if (options.expectedText) {
    await expect(page.locator('body')).toContainText(options.expectedText);
  }
  await expectNoAuditIssues(page, issues, path);
}

async function openFirstLibraryEbook(page) {
  await visitHealthy(page, '/digital-library', { expectedText: /Digital Library/i });

  const readLinks = page.getByTestId('ebook-read-link');
  await expect(
    readLinks.first(),
    'The public digital library must expose at least one visible ebook Read Now link for guest reader smoke coverage.'
  ).toBeVisible({ timeout: 30_000 });

  const readLinkCount = await readLinks.count();
  expect(
    readLinkCount,
    'The public digital library must expose at least one ebook Read Now link for guest reader smoke coverage.'
  ).toBeGreaterThan(0);

  const firstHref = await readLinks.first().getAttribute('href');
  expect(firstHref, 'The first ebook Read Now link should point at a UUID book route.').toMatch(UUID_BOOK_PATH);

  const issues = installAuditHooks(page);
  await readLinks.first().click();
  await expect(page).toHaveURL(UUID_BOOK_PATH, { timeout: 30_000 });
  await settle(page);
  await expectNoAuditIssues(page, issues, 'first library ebook');

  return new URL(page.url()).pathname;
}

async function expectFullBookReader(page) {
  await expect(page.getByTestId('book-reader-epub')).toBeVisible({ timeout: 45_000 });
  const fullScroll = page.getByTestId('epub-full-scroll');
  await expect(fullScroll).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('epub-loading')).toBeHidden({ timeout: 45_000 });
  await expect(page.getByTestId('epub-full-section').first()).toBeVisible({ timeout: 45_000 });

  return fullScroll;
}

test.describe('guest-view smoke audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' })
    );
    await page.route('https://fonts.gstatic.com/**', (route) =>
      route.fulfill({ status: 204, body: '' })
    );
    await page.route('https://va.vercel-scripts.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    );
  });

  for (const route of ROUTES) {
    test(`renders ${route.path} without guest-visible failures`, async ({ page }) => {
      await visitHealthy(page, route.path, route);
    });
  }

  for (const path of PROTECTED_REDIRECT_ROUTES) {
    test(`redirects protected guest route ${path} without crashing`, async ({ page }) => {
      await visitHealthy(page, path, { expectedUrl: /\/login$/ });
    });
  }

  test('renders the expected certificate not-found state without crashing', async ({ page }) => {
    const issues = installAuditHooks(page);
    await page.goto('/verify/SMOKE-NOT-FOUND');
    await settle(page);
    await expect(page.locator('body')).toContainText(/Certificate Not Found/i);

    const bodyText = (await page.locator('body').innerText()).trim();
    expect(bodyText.length, 'Certificate not-found route should render visible content').toBeGreaterThan(10);
    expect(issues, 'Expected certificate not-found route should not crash or emit critical request failures').toEqual([]);
  });

  test('opens the first ebook reader and renders a scrollable full-book view', async ({ page }) => {
    await openFirstLibraryEbook(page);
    const fullScroll = await expectFullBookReader(page);

    const initialMetrics = await fullScroll.evaluate((element) => ({
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      sections: element.querySelectorAll('[data-testid="epub-full-section"]').length,
    }));

    expect(initialMetrics.sections, 'The full-book reader should render more than one EPUB spine section.').toBeGreaterThan(1);
    expect(
      initialMetrics.scrollHeight,
      'The full-book reader should be taller than the visible reader frame.'
    ).toBeGreaterThan(initialMetrics.clientHeight + 800);

    await fullScroll.evaluate((element) => {
      element.scrollTop = Math.min(element.scrollTop + 2500, element.scrollHeight - element.clientHeight);
    });

    await expect.poll(async () => fullScroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
  });

  test('keeps internal EPUB links inside the reader instead of navigating to a fake book id', async ({ page }) => {
    const originalPath = await openFirstLibraryEbook(page);
    const fullScroll = await expectFullBookReader(page);
    const internalLinks = fullScroll.locator(
      'a[href]:not([href^="http"]):not([href^="mailto:"]):not([href^="tel:"])'
    );

    const linkCount = await internalLinks.count();
    expect(linkCount, 'The first ebook should expose at least one internal EPUB link or footnote link.').toBeGreaterThan(0);

    await internalLinks.first().click();
    await page.waitForTimeout(750);

    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname, 'Clicking an EPUB internal link must not leave the current /book/<uuid> route.').toBe(originalPath);
    expect(currentUrl.pathname, 'Reader URL should remain a UUID book path.').toMatch(UUID_BOOK_PATH);
    await expect(page.locator('body')).not.toContainText(/invalid input syntax/i);
  });

  test('uses the table of contents to scroll inside the full-book reader', async ({ page }) => {
    await openFirstLibraryEbook(page);
    const fullScroll = await expectFullBookReader(page);

    await fullScroll.evaluate((element) => {
      element.scrollTop = 0;
    });

    await fullScroll.hover();
    await page.mouse.move(480, 220);
    await page.getByLabel('Table of Contents').click({ force: true });
    await expect(page.getByTestId('epub-toc-panel')).toBeVisible();

    const tocItems = page.getByTestId('epub-toc-item');
    const tocCount = await tocItems.count();
    expect(tocCount, 'The EPUB table of contents should contain multiple entries.').toBeGreaterThan(1);

    await tocItems.nth(tocCount - 1).click();

    await expect.poll(async () => fullScroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(50);
    await expect(page).toHaveURL(UUID_BOOK_PATH);
    await expect(page.locator('body')).not.toContainText(FATAL_UI_PATTERN);
  });
});
