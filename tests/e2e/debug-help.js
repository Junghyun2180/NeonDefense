const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true, args: ['--ignore-certificate-errors']
  });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('console', m => m.type() === 'error' && console.log('ERR:', m.text().slice(0, 150)));
  page.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0, 150)));

  await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const helpOnMount = await page.evaluate(() => ({
    modalVisible: !!document.querySelector('.fixed.inset-0.bg-black\\/80'),
    tutorialSeen: (JSON.parse(localStorage.getItem('neonDefense_settings_v1') || '{}')).tutorialSeen,
  }));
  console.log('1. Mount 직후:', helpOnMount);

  // ✕ 버튼으로 닫기
  const xBtn = page.locator('button').filter({ hasText: '✕' }).first();
  if (await xBtn.count() > 0) {
    await xBtn.click();
    console.log('2. ✕ 클릭');
  } else {
    await page.keyboard.press('Escape');
    console.log('2. ESC (✕없음)');
  }
  await page.waitForTimeout(300);

  const afterClose = await page.evaluate(() => ({
    modalVisible: !!document.querySelector('.fixed.inset-0.bg-black\\/80'),
    tutorialSeen: (JSON.parse(localStorage.getItem('neonDefense_settings_v1') || '{}')).tutorialSeen,
  }));
  console.log('3. 닫기 후:', afterClose);

  // 새 게임 시작 클릭
  const newGame = page.locator('button').filter({ hasText: /새 게임 시작/ }).first();
  await newGame.click();
  await page.waitForTimeout(1500);

  const afterNewGame = await page.evaluate(() => ({
    modalVisible: !!document.querySelector('.fixed.inset-0.bg-black\\/80'),
    tutorialSeen: (JSON.parse(localStorage.getItem('neonDefense_settings_v1') || '{}')).tutorialSeen,
    modalTitle: (document.querySelector('.fixed.inset-0.bg-black\\/80 h2, .fixed.inset-0.bg-black\\/80 h1') || {}).textContent,
    gameElementsVisible: document.body.textContent.includes('🎲 x10'),
  }));
  console.log('4. 새 게임 시작 후:', afterNewGame);

  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
