const { test, expect } = require('@playwright/test');

for (const width of [1440, 390, 320]) {
  test(`Digital Twin reader at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto('/readers/digital-twin/index.html');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    await expect(page.locator('h1')).toHaveText('The Digital Twin');

    const mode = n => page.locator(`button[data-z="${n}"]:visible`).first();
    await mode(1).click();
    await expect(page.locator('body')).toHaveClass(/z1/);
    await mode(2).click();
    await expect(page.locator('body')).toHaveClass(/z2/);
    const more = page.locator('.more:visible').first();
    const paragraphIndex = await more.locator('..').getAttribute('data-p');
    await more.click();
    await expect(page.locator(`.para[data-p="${paragraphIndex}"]`)).toHaveClass(/open/);
    await mode(3).click();
    await expect(page.locator('body')).toHaveClass(/z3/);
    await page.locator('.fn:visible').first().click();
    await expect(page.locator('#pop')).toBeVisible();
    await page.keyboard.press('Escape');

    for (const id of ['engine', 'security', 'profile']) {
      await page.locator(`.mirror-links a[href="#mirror-${id}"]`).click();
      await expect(page.locator(`#mirror-${id}`)).toBeFocused();
    }
    const engine = page.locator('#mirror-engine');
    for (const action of ['continue', 'repair']) {
      await engine.locator(`[data-action="${action}"]`).click();
      await engine.locator('.engine-check').click();
      await expect(engine.locator('.engine-check')).toHaveText('Pause');
      await engine.locator('.engine-check').click();
      await expect(engine.locator('.engine-check')).toHaveText('Continue');
      await engine.locator('.engine-check').click();
      await expect(engine.locator('.engine-check')).toHaveText('Replay outcome');
      await engine.locator('.engine-reset').click();
      await expect(engine).toHaveAttribute('data-action', 'none');
    }
    for (const id of ['security', 'profile']) {
      for (let step = 0; step < 4; step++) {
        const button = page.locator(`#mirror-${id} [data-im-step="${step}"]`);
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
      }
    }
    await expect(page.locator('.generated-plate')).toHaveCount(2);
    for (const button of await page.locator('.generated-plate button').all()) {
      await button.click();
      await expect(page.locator('#imageViewer')).toBeVisible();
      await expect(page.locator('#imageFull')).toHaveJSProperty('complete', true);
      await page.locator('#imageClose').click();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    const dark = page.locator('button[data-look="dark"]:visible');
    if (await dark.count()) await dark.click();
    else await page.locator('#lookBtn').click();
    await expect(page.locator('html')).toHaveAttribute('data-look', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-look', 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
