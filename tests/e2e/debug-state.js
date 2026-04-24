// Debug: 중간 단계별 스크린샷 + DOM 덤프
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: ['--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  page.on('console', m => console.log(`[${m.type()}] ${m.text().slice(0, 200)}`));
  page.on('pageerror', e => console.log('[pageerror]', e.message));

  await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('#root *', { timeout: 10000 });
  await page.waitForTimeout(500);

  console.log('\n=== STEP 1: Main menu ===');
  const mainButtons = await page.locator('button').allTextContents();
  console.log('Buttons:', mainButtons.slice(0, 15));
  await page.screenshot({ path: '/tmp/ss-1-main.png' });

  // 런 모드 버튼 클릭
  console.log('\n=== STEP 2: click 런 모드 ===');
  await page.locator('button:has-text("런 모드")').first().click();
  await page.waitForTimeout(500);
  const runMenuBtns = await page.locator('button').allTextContents();
  console.log('Buttons:', runMenuBtns.slice(0, 20));
  await page.screenshot({ path: '/tmp/ss-2-runmenu.png' });

  // Rush Mode 카드 찾기
  console.log('\n=== STEP 3: look for Rush Mode ===');
  const rushCount = await page.locator('button:has-text("Rush Mode")').count();
  console.log('Rush Mode buttons found:', rushCount);
  const rushMatches = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Rush')).map(b => b.textContent.slice(0, 100));
  });
  console.log('Rush text matches:', rushMatches);

  if (rushCount > 0) {
    await page.locator('button:has-text("Rush Mode")').first().click();
    await page.waitForTimeout(1500);
    console.log('\n=== STEP 4: in game ===');
    const gameButtons = await page.locator('button').allTextContents();
    console.log('Buttons:', gameButtons.slice(0, 20));

    const fullText = await page.evaluate(() => document.body.textContent);
    console.log('Body text snippet:', fullText.slice(0, 1000));

    await page.screenshot({ path: '/tmp/ss-3-game.png' });
  }

  await browser.close();
})();
