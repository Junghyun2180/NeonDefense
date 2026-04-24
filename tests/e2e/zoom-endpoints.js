// start/end 셀만 확대해서 스크린샷 — 연결 느낌 확인용
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.BASE_URL || 'http://localhost:8765/index.html';
const OUT = path.join(__dirname, '..', '..', 'tests', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: BROWSER_PATH, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 캠페인 진입 + 첫 스테이지
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(b => /캠페인/.test(b.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(b => /^1\s*-\s*1|1-1/.test(b.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(2000);

  // 튜토리얼 닫기
  for (let i = 0; i < 6; i++) {
    const closed = await page.evaluate(() => {
      let c = 0;
      document.querySelectorAll('button, a').forEach(b => {
        if (/튜토리얼\s*건너뛰기|건너뛰기|Skip|×|✕/.test(b.textContent || '')) { b.click(); c++; }
      });
      return c;
    });
    if (!closed) break;
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(500);

  // start 셀과 그 우측 2셀 영역 스크린샷 (160×80 확대)
  const startBox = await page.evaluate(() => {
    const s = document.querySelector('.tile-start');
    if (!s) return null;
    const host = s.parentElement; // 셀 div
    const r = host.getBoundingClientRect();
    // start 셀 + 우측 2셀 포함 (가로 3셀 × 세로 1셀)
    return { x: r.x - 4, y: r.y - 4, width: r.width * 3 + 8, height: r.height + 8 };
  });
  if (startBox) {
    await page.screenshot({
      path: path.join(OUT, 'zoom-start.png'),
      clip: {
        x: Math.max(0, startBox.x), y: Math.max(0, startBox.y),
        width: Math.min(startBox.width, 1280 - startBox.x),
        height: Math.min(startBox.height, 900 - startBox.y),
      },
    });
    console.log('start zoom saved:', startBox);
  }

  const endBox = await page.evaluate(() => {
    const e = document.querySelector('.tile-end');
    if (!e) return null;
    const host = e.parentElement;
    const r = host.getBoundingClientRect();
    return { x: r.x - r.width * 2 - 4, y: r.y - 4, width: r.width * 3 + 8, height: r.height + 8 };
  });
  if (endBox) {
    await page.screenshot({
      path: path.join(OUT, 'zoom-end.png'),
      clip: {
        x: Math.max(0, endBox.x), y: Math.max(0, endBox.y),
        width: Math.min(endBox.width, 1280 - endBox.x),
        height: Math.min(endBox.height, 900 - endBox.y),
      },
    });
    console.log('end zoom saved:', endBox);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
