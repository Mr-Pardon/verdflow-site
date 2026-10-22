import assert from 'node:assert/strict';

export async function verifyDemo({ page, base, shot, overflow, exercise = false }) {
  const url = new URL('demo.html', base).href;
  const videoUrl = new URL('media/dts-live-demo.mp4', base).href;
  const videoRequests = [];
  const record = request => { if (request.url() === videoUrl) videoRequests.push(request.url()); };
  page.on('request', record);
  try {
    await page.goto(url);
    await page.getByRole('heading', { name: '看见 VerdFlow', exact: true }).waitFor();
    const play = page.getByRole('button', { name: '播放 DTS 实时种植演示', exact: true });
    const video = page.locator('.demo-player video');
    await play.waitFor();
    await overflow();
    assert.equal(await page.locator('.VPSidebar').count(), 0, 'Demo should not show the manual sidebar');
    assert.equal(await page.locator('.VPNavBar').isVisible(), true);
    assert.equal(await video.getAttribute('src'), null, 'Video should load only on request');
    assert.equal(await video.getAttribute('preload'), 'none');
    assert.equal(await video.getAttribute('autoplay'), null);
    assert.equal(await video.getAttribute('playsinline'), '');
    assert.equal(await video.getAttribute('poster'), new URL('media/dts-live-demo-poster.webp', base).pathname);
    const posterRatio = await video.evaluate(async element => {
      const image = new Image();
      image.src = element.poster;
      await image.decode();
      return image.naturalWidth / image.naturalHeight;
    });
    assert.ok(Math.abs(posterRatio - 16 / 9) < 0.01, 'Poster must load at the same aspect ratio as the recording');
    assert.equal(videoRequests.length, 0, 'Visiting the demo must not fetch the full video');
    const bounds = await video.boundingBox();
    assert.ok(Math.abs(bounds.width / bounds.height - 16 / 9) < 0.01, 'Video frame must stay 16:9');
    assert.equal(await video.evaluate(element => getComputedStyle(element).objectFit), 'contain', 'Recording must not be cropped');
    const viewport = page.viewportSize();
    assert.ok(bounds.y + bounds.height < viewport.height, 'Full player should fit in the first viewport');
    const next = page.getByRole('navigation', { name: '演示之后' });
    assert.equal(await next.getByRole('link').count(), 2);
    assert.equal(await next.getByRole('link', { name: '阅读实时种植指南' }).getAttribute('href'), new URL('workflows/live.html', base).pathname);
    assert.equal(await next.getByRole('link', { name: '开始第一次种植' }).getAttribute('href'), new URL('guide/start.html', base).pathname);
    await play.focus();
    await shot(`demo-${viewport.width}`);
    if (!exercise) return;

    await play.press('Enter');
    await page.waitForFunction(() => {
      const video = document.querySelector('.demo-player video');
      return video && video.currentTime > 0.2 && !video.paused && video.readyState >= 2;
    }, null, { timeout: 60000 });
    const metadata = await video.evaluate(element => ({
      width: element.videoWidth, height: element.videoHeight, duration: element.duration,
      controls: element.controls, focused: document.activeElement === element,
    }));
    assert.equal(metadata.width, 1920);
    assert.equal(metadata.height, 1080);
    assert.ok(metadata.duration > 49 && metadata.duration < 50, 'Expected complete 49 second recording');
    assert.equal(metadata.controls, true);
    assert.equal(metadata.focused, true, 'Focus should move from the poster to native player controls');
    assert.ok(videoRequests.length > 0);
    await video.evaluate(element => { element.pause(); element.currentTime = 46; });
    await page.waitForFunction(() => {
      const video = document.querySelector('.demo-player video');
      return video && !video.seeking && video.currentTime >= 46 && video.readyState >= 2;
    });
    const colors = await video.evaluate(element => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 36;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(element, 0, 0, 64, 36);
      const pixels = ctx.getImageData(0, 0, 64, 36).data;
      return new Set(Array.from({ length: pixels.length / 4 }, (_, i) => `${pixels[i * 4]},${pixels[i * 4 + 1]},${pixels[i * 4 + 2]}`)).size;
    });
    assert.ok(colors > 100, 'Decoded video frame should contain real scenery, not a blank canvas');
    await shot(`demo-playing-${viewport.width}`);
    await video.evaluate(element => element.requestFullscreen());
    await page.waitForFunction(() => document.fullscreenElement?.tagName === 'VIDEO');
    await page.evaluate(() => document.exitFullscreen());
    await page.waitForFunction(() => !document.fullscreenElement);
    await video.evaluate(element => { element.currentTime = element.duration - 0.4; return element.play(); });
    await page.waitForFunction(() => document.querySelector('.demo-player video')?.ended);
    await video.evaluate(element => element.play());
    await page.waitForFunction(() => {
      const video = document.querySelector('.demo-player video');
      return video && !video.ended && !video.paused && video.currentTime < 3;
    });
    await next.getByRole('link', { name: '阅读实时种植指南' }).click();
    await page.getByRole('heading', { level: 1, name: /^DTS 实时种植/ }).waitFor();
    const guideLink = page.getByRole('link', { name: '先看完整演示 · 49 秒', exact: true });
    assert.equal(await guideLink.getAttribute('href'), new URL('demo.html', base).pathname);
    await guideLink.click();
    await play.waitFor();

    // Fail the media request once; retry must recover without reloading the page.
    await page.route(videoUrl, route => route.abort('failed'));
    await play.click();
    await page.getByRole('alert').filter({ hasText: '视频暂时无法播放' }).waitFor();
    await page.unroute(videoUrl);
    await page.getByRole('button', { name: '重新加载', exact: true }).click();
    await page.waitForFunction(() => {
      const video = document.querySelector('.demo-player video');
      return video && video.currentTime > 0.2 && !video.paused;
    }, null, { timeout: 60000 });
    assert.equal(await page.locator('.demo-error').count(), 0);
    await video.evaluate(element => element.pause());
  } finally {
    page.off('request', record);
    await page.unroute(videoUrl);
  }
}
