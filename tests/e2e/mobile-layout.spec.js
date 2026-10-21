const { test, expect } = require('@playwright/test');

const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440];

async function expectPageFits(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  // Mobile Safari may enlarge innerWidth to contain overflowing content.
  // Compare against the requested viewport, not that enlarged layout width.
  const width = page.viewportSize().width;
  expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(width + 1);
  expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(width + 1);
}

for (const route of ['/login', '/home', '/digital-library', '/submit']) {
  test(`${route} fits phones, tablets and desktop`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await expectPageFits(page);
      if (route === '/login' && width <= 650) {
        const email = await page.locator('.landing-mailing-input').boundingBox();
        expect(email.width).toBeGreaterThanOrEqual(width - 42);
      }
      if (route === '/home') {
        const cards = page.getByTestId('publication-contents').locator('a');
        await expect(cards).toHaveCount(10);
        const clipped = await cards.evaluateAll(cards => cards.some(card => [...card.querySelectorAll('span')].some(el => {
          const bounds = el.getBoundingClientRect();
          return bounds.right > window.innerWidth + 1 || bounds.left < -1;
        })));
        expect(clipped, `Section card clipped at ${width}px`).toBe(false);
        await expect(page.getByTestId('home-contents')).not.toContainText('Foundational texts');
        await expect(page.getByTestId('home-contents')).not.toContainText('An expanding collection');
      }
      if (width === 390 || width === 1440) {
        await page.screenshot({ path: testInfo.outputPath(`${width}.png`), fullPage: true });
      }
    }
    expect(errors).toEqual([]);
  });
}

test('mobile navigation is reachable, closes and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/home');
  const open = page.getByRole('button', { name: 'Open navigation menu' });
  await open.click();
  const menu = page.getByRole('dialog', { name: 'Navigation menu' });
  await expect(menu).toBeVisible();
  await expectPageFits(page);
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(menu.locator('a, button').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.click();
  await menu.getByRole('link', { name: 'Digital Library', exact: true }).click();
  await expect(page).toHaveURL(/\/digital-library$/);
  await expect(menu).not.toBeVisible();
  await expectPageFits(page);
});

test('home starts with contents rather than a full-height empty hero', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/home');
  await expect(page.locator('h1')).toBeVisible();
  await expectPageFits(page);
  const title = await page.locator('h1').boundingBox();
  expect(title.y).toBeLessThan(200);
  await expect(page.getByTestId('publication-contents').locator('a').first()).toBeInViewport();
});

test('editorial landing navigation and dialogs fit small phones', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/login');
  for (const button of await page.locator('.landing-actions > a, .landing-actions > button').all()) {
    const bounds = await button.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  }
  for (const name of ['Log In', 'Register', 'About the Project']) {
    await expectPageFits(page);
    const trigger = page.locator('.landing-actions').getByRole('button', { name, exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();
    await expectPageFits(page);
    const bounds = await panel.boundingBox();
    expect(bounds.height).toBeLessThanOrEqual(608);
    if (name !== 'About the Project') {
      await expect(panel.locator('input[type=email]')).toHaveCSS('font-size', '16px');
    }
    if (name === 'Register') {
      await panel.getByLabel('I have an invite code').check();
      await expect(panel.getByLabel('Confirm Password')).toBeVisible();
      await expect(panel.getByLabel('Password', { exact: true })).toHaveAttribute('minlength', '6');
      await expectPageFits(page);
    }
    await panel.getByRole('button', { name: 'Close dialog' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(panel.locator('a, button, input').last()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('button', { name: 'Close dialog' })).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`${name}-dialog.png`) });
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test('page names highlight on hover and keyboard focus without card fills', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  const library = page.locator('.landing-actions').getByRole('link', { name: 'Digital Library', exact: true });
  await library.hover();
  await expect(library).toHaveCSS('color', 'rgb(200, 16, 46)');
  await expect.poll(() => library.evaluate(element => getComputedStyle(element, '::after').transform))
    .toBe('matrix(1, 0, 0, 1, 0, 0)');
  await expect(library).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.mouse.move(0, 0);
  await library.focus();
  await expect(library).toHaveCSS('color', 'rgb(200, 16, 46)');
  await page.goto('/home');
  const theory = page.getByTestId('publication-contents').getByRole('link', { name: 'Theory Members', exact: true });
  await theory.hover();
  await expect(theory).toHaveCSS('color', 'rgb(200, 16, 46)');
  await expect(theory).toHaveAttribute('href', '/login');
  const nav = page.locator('nav').first().getByRole('link', { name: 'Digital Library', exact: true });
  await nav.hover();
  await expect(nav).toHaveCSS('color', 'rgb(200, 16, 46)');
  await expect.poll(() => nav.evaluate(element => getComputedStyle(element, '::before').transform))
    .toBe('matrix(1, 0, 0, 1, 0, 0)');
});

test('library filters and local reading-list drawer fit small phones', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/digital-library');
  await expect(page.locator('h1')).toBeVisible();
  for (const select of await page.locator('main select').all()) {
    const bounds = await select.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  }
  await page.getByRole('button', { name: /Local Lists/i }).click();
  await expect(page.locator('.reading-list-panel')).toBeVisible();
  await expectPageFits(page);
  await page.locator('.reading-list-panel input').fill('A long local reading list name');
  await expectPageFits(page);
  await page.getByRole('button', { name: 'Close reading lists' }).click();
});

test('upload selection and guidelines fit a narrow phone', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/submit');
  await page.locator('input[type=file]').setInputFiles({
    name: 'A-very-long-manuscript-file-name-for-mobile-layout-verification.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await expect(page.locator('main')).toContainText('A-very-long-manuscript');
  await expectPageFits(page);
  await page.getByRole('button', { name: /View submission guidelines/i }).click();
  await expect(page.getByRole('dialog', { name: 'Submission guidelines' })).toBeVisible();
  await expectPageFits(page);
  await page.screenshot({ path: testInfo.outputPath('guidelines.png') });
  await page.getByRole('button', { name: 'Close submission guidelines' }).click();
});

test('translated header and enlarged text remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/home');
  await page.locator('.language-switcher-trigger').click();
  await page.locator('.language-switcher-option').filter({ hasText: 'Deutsch' }).click();
  await expectPageFits(page);
  await page.addStyleTag({ content: 'body { font-size: 200% !important; }' });
  await expectPageFits(page);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expectPageFits(page);
});

test('upload security challenge uses compact sizing in narrow forms', async ({ page }) => {
  await page.addInitScript(() => {
    window.challengeSizes = [];
    window.turnstile = {
      render(container, options) {
        window.challengeSizes.push(options.size);
        const challenge = document.createElement('div');
        challenge.style.width = options.size === 'compact' ? '150px' : '300px';
        challenge.style.height = options.size === 'compact' ? '140px' : '65px';
        container.appendChild(challenge);
        options.callback('test-token');
        return container;
      },
      remove(container) { container.replaceChildren(); },
    };
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/submit');
  await expect.poll(() => page.evaluate(() => window.challengeSizes.at(-1))).toBe('compact');
  await expectPageFits(page);
  await page.setViewportSize({ width: 768, height: 844 });
  await expect.poll(() => page.evaluate(() => window.challengeSizes.at(-1))).toBe('flexible');
  await expectPageFits(page);
});
