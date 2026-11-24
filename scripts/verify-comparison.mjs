import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const plantingComparison = {
  tab: '看落地效果', title: '种植前后对照', sliderName: '种植前后显示比例',
  defaultValue: 58, screenshot: 'planting-compare',
};

export async function verifyComparison({ page, output }) {
  const { title, sliderName, defaultValue, screenshot } = plantingComparison;
  const figure = page.locator('.home-workbench .screenshot-compare');
  const surface = figure.locator(':scope > .reveal-surface');
  const slider = surface.getByRole('slider', { name: sliderName });
  await page.evaluate(() => document.fonts.ready);
  await surface.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  assert.equal(await slider.inputValue(), String(defaultValue));
  await surface.screenshot({ path: fileURLToPath(new URL(`${screenshot}-default.png`, output)) });
  await slider.focus();
  await slider.press('ArrowRight');
  assert.equal(await slider.inputValue(), String(defaultValue + 1));
  await slider.press('Home');
  assert.equal(await slider.inputValue(), '0');
  await slider.press('End');
  assert.equal(await slider.inputValue(), '100');
  const bounds = await surface.boundingBox();
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(bounds.x + bounds.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width + 20, y);
  assert.equal(await slider.inputValue(), '100', 'Fast dragging beyond the image must keep pointer capture');
  await page.mouse.up();

  const captures = [];
  for (const value of [25, 75]) {
    await page.mouse.move(bounds.x + bounds.width * value / 100, y);
    await page.mouse.down(); await page.mouse.up();
    assert.ok(Math.abs(Number(await slider.inputValue()) - value) <= 1);
    const buffer = await surface.screenshot({ path: fileURLToPath(new URL(`${screenshot}-${value}.png`, output)) });
    const metadata = await sharp(buffer).metadata();
    captures.push(await sharp(buffer).extract({ left: Math.floor(metadata.width * .45), top: Math.floor(metadata.height * .7),
      width: Math.floor(metadata.width * .1), height: Math.floor(metadata.height * .1) }).raw().toBuffer());
    const imageWidths = await surface.locator('img').evaluateAll(items => items.map(img => img.getBoundingClientRect().width));
    assert.ok(imageWidths.every(width => Math.abs(width - bounds.width) <= 2), 'Divider movement must not resize either screenshot');
  }
  assert.notEqual(Buffer.compare(captures[0], captures[1]), 0, 'The divider moved without revealing different image pixels');

  const zoom = figure.getByRole('button', { name: `放大${title}` });
  await zoom.click();
  const dialog = page.getByRole('dialog', { name: title });
  await dialog.waitFor();
  const enlargedSlider = dialog.getByRole('slider', { name: sliderName });
  assert.equal(await enlargedSlider.inputValue(), '75');
  await enlargedSlider.press('ArrowLeft');
  assert.equal(await enlargedSlider.inputValue(), '74');
  const rect = await dialog.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, 'The comparison dialog exceeds the viewport');
  await dialog.screenshot({ path: fileURLToPath(new URL(`${screenshot}-enlarged.png`, output)) });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(), 0);
  assert.equal(await zoom.evaluate(element => element === document.activeElement), true, 'Closing the dialog must restore keyboard focus');
  assert.equal(await slider.inputValue(), '74');
}

export async function verifyTouchComparison({ browser, base, output }) {
  const { tab, title, sliderName, defaultValue, screenshot } = plantingComparison;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const errors = [];
  try {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.getByRole('tab', { name: tab }).click();
    const surface = page.locator('.home-workbench .screenshot-compare > .reveal-surface');
    const slider = surface.getByRole('slider', { name: sliderName });
    await page.evaluate(() => document.fonts.ready);
    await surface.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await surface.locator('img').evaluateAll(items => items.forEach(img => img.loading = 'eager'));
    await page.waitForFunction(() => [...document.querySelectorAll('.screenshot-compare > .reveal-surface img')].every(img => img.complete && img.naturalWidth > 0));
    assert.equal(await slider.inputValue(), String(defaultValue));
    const cdp = await context.newCDPSession(page);
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    let bounds = await surface.boundingBox();
    const y = bounds.y + bounds.height / 2;
    await touch('touchStart', bounds.x + bounds.width * defaultValue / 100, y);
    await touch('touchMove', bounds.x + bounds.width * .62, y);
    await touch('touchMove', bounds.x + bounds.width * .75, y);
    await touch('touchEnd');
    assert.ok(Math.abs(Number(await slider.inputValue()) - 75) <= 2, 'Touch dragging did not reveal the image');
    const value = await slider.inputValue();
    const beforeScroll = await page.evaluate(() => scrollY);
    bounds = await surface.boundingBox();
    const x = bounds.x + bounds.width * .3, startY = bounds.y + bounds.height * .8;
    await touch('touchStart', x, startY);
    await touch('touchMove', x, startY - 35);
    await touch('touchMove', x, startY - 100);
    await touch('touchEnd');
    await page.waitForFunction(previous => scrollY > previous + 10, beforeScroll);
    assert.equal(await slider.inputValue(), value, 'A vertical page swipe must not change the comparison');
    await surface.screenshot({ path: fileURLToPath(new URL(`${screenshot}-mobile.png`, output)) });
    await page.getByRole('button', { name: `放大${title}` }).click();
    const dialog = page.getByRole('dialog', { name: title });
    await dialog.waitFor();
    const rect = await dialog.boundingBox();
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 391 && rect.y + rect.height <= 845);
    await dialog.getByRole('button', { name: `关闭${title}` }).click();
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}
